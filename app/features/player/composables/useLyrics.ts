import { cleanTrackMetadata } from '@/utils/trackMetadata';

import type { LyricLine, LyricsData } from '../types/sidebar.types';
import type { Track } from '../types/player.types';

interface LrclibResponse {
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

interface LrclibSearchResult {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const raw of lrc.split('\n')) {
    const match = raw.match(regex);
    if (!match || match.length < 5) continue;

    const minutes = parseInt(match[1] ?? '0', 10);
    const seconds = parseInt(match[2] ?? '0', 10);
    const centiseconds = parseInt((match[3] ?? '0').padEnd(3, '0'), 10);
    const text = (match[4] ?? '').trim();

    if (!text) continue;

    lines.push({
      time: minutes * 60 + seconds + centiseconds / 1000,
      text
    });
  }

  return lines.sort((a, b) => a.time - b.time);
}

function normalizeString(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function matchesArtist(
  candidateArtist: string,
  targetArtist: string,
  artists?: Array<{ name: string }> | null
): boolean {
  const cand = normalizeString(candidateArtist);
  const target = normalizeString(targetArtist);
  if (!cand || !target) return false;

  if (cand === target || cand.includes(target) || target.includes(cand)) {
    return true;
  }

  const primaryTarget = normalizeString(targetArtist.split(/[,&/]|feat\.?|ft\.?/i)[0] ?? '');
  if (
    primaryTarget &&
    (cand === primaryTarget || cand.includes(primaryTarget) || primaryTarget.includes(cand))
  ) {
    return true;
  }

  if (artists && artists.length > 0) {
    for (const a of artists) {
      const aNorm = normalizeString(a.name);
      if (aNorm && (cand === aNorm || cand.includes(aNorm) || aNorm.includes(cand))) {
        return true;
      }
    }
  }

  return false;
}

function matchesTitle(candidateTitle: string, targetTitle: string): boolean {
  const cand = normalizeString(candidateTitle);
  const target = normalizeString(targetTitle);
  if (!cand || !target) return false;

  return cand === target || cand.includes(target) || target.includes(cand);
}

function findBestMatch(
  results: LrclibSearchResult[],
  artist: string,
  title: string,
  durationSeconds: number,
  artists?: Array<{ name: string }> | null
): LrclibSearchResult | null {
  const valid = results.filter((r) => {
    if (!r.syncedLyrics && !r.plainLyrics) return false;
    if (!matchesArtist(r.artistName, artist, artists)) return false;
    if (!matchesTitle(r.trackName, title)) return false;
    if (durationSeconds > 0 && r.duration > 0 && Math.abs(r.duration - durationSeconds) > 18) {
      return false;
    }
    return true;
  });

  if (valid.length === 0) return null;

  return (
    valid.sort((a, b) => {
      if (a.syncedLyrics && !b.syncedLyrics) return -1;
      if (!a.syncedLyrics && b.syncedLyrics) return 1;
      if (durationSeconds > 0) {
        return Math.abs(a.duration - durationSeconds) - Math.abs(b.duration - durationSeconds);
      }
      return 0;
    })[0] ?? null
  );
}

const lyricsData = ref<LyricsData | null>(null);
const isLoading = ref(false);
const isTranslating = ref(false);
const translatedLanguage = ref<string | null>(null);
const error = ref<string | null>(null);
const currentFetchTrackId = ref<string | null>(null);

let lyricsCache: globalThis.Ref<Record<string, LyricsData>>;
const MAX_CACHE_SIZE = 50;

export function useLyrics() {
  if (!lyricsCache) {
    if (import.meta.client) {
      lyricsCache = useLocalStorage<Record<string, LyricsData>>('ranzakord_lyrics_cache', {});
    } else {
      lyricsCache = ref<Record<string, LyricsData>>({});
    }
  }

  async function fetchLyrics(track: Track): Promise<void> {
    const trackId = track.videoId;

    if (lyricsData.value?.trackId === trackId || currentFetchTrackId.value === trackId) return;

    if (lyricsCache.value[trackId]) {
      lyricsData.value = lyricsCache.value[trackId];
      error.value = null;
      return;
    }

    currentFetchTrackId.value = trackId;
    isLoading.value = true;
    error.value = null;
    lyricsData.value = null;

    try {
      const { cleanTitle, cleanArtist } = cleanTrackMetadata(track.title, track.artist);
      const durationSeconds = Math.round(track.durationSeconds);

      let response: LrclibResponse | null = null;

      try {
        const params = new URLSearchParams({
          artist_name: cleanArtist,
          track_name: cleanTitle
        });
        if (durationSeconds > 0 && durationSeconds <= 3600) {
          params.append('duration', String(durationSeconds));
        }

        response = await $fetch<LrclibResponse>(`https://lrclib.net/api/get?${params.toString()}`, {
          headers: {
            'Lrclib-Client': 'ranzaKord v0.1.0 (https://github.com/rol2005hun/ranzaKord)'
          }
        });
      } catch {
        response = null;
      }

      if (!response && track.title !== cleanTitle) {
        try {
          const rawParams = new URLSearchParams({
            artist_name: track.artist,
            track_name: track.title
          });
          if (durationSeconds > 0 && durationSeconds <= 3600) {
            rawParams.append('duration', String(durationSeconds));
          }

          response = await $fetch<LrclibResponse>(
            `https://lrclib.net/api/get?${rawParams.toString()}`,
            {
              headers: {
                'Lrclib-Client': 'ranzaKord v0.1.0 (https://github.com/rol2005hun/ranzaKord)'
              }
            }
          );
        } catch {
          response = null;
        }
      }

      if (!response || (!response.syncedLyrics && !response.plainLyrics)) {
        try {
          const primaryArtist = cleanArtist.split(/[,&/]|feat\.?|ft\.?/i)[0]?.trim() || cleanArtist;
          const searchQueries: string[] = [];

          searchQueries.push(`${cleanArtist} ${cleanTitle}`);
          if (primaryArtist !== cleanArtist) {
            searchQueries.push(`${primaryArtist} ${cleanTitle}`);
          }
          if (track.title !== cleanTitle || track.artist !== cleanArtist) {
            searchQueries.push(`${track.artist} ${track.title}`);
          }

          for (const query of searchQueries) {
            const searchResults = await $fetch<LrclibSearchResult[]>(
              `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`,
              {
                headers: {
                  'Lrclib-Client': 'ranzaKord v0.1.0 (https://github.com/rol2005hun/ranzaKord)'
                }
              }
            );

            if (searchResults && searchResults.length > 0) {
              const matched = findBestMatch(
                searchResults,
                cleanArtist,
                cleanTitle,
                durationSeconds,
                track.artists
              );

              if (matched && (matched.syncedLyrics || matched.plainLyrics)) {
                response = {
                  syncedLyrics: matched.syncedLyrics,
                  plainLyrics: matched.plainLyrics
                };
                break;
              }
            }
          }
        } catch {
          response = null;
        }
      }

      if (!response || (!response.syncedLyrics && !response.plainLyrics)) {
        error.value = 'lyrics.notFound';
        lyricsData.value = { trackId, synced: null, plain: null };
        return;
      }

      const result: LyricsData = {
        trackId,
        synced: response.syncedLyrics ? parseLrc(response.syncedLyrics) : null,
        plain: response.plainLyrics ?? null
      };

      lyricsData.value = result;

      lyricsCache.value[trackId] = result;
      const keys = Object.keys(lyricsCache.value);
      if (keys.length > MAX_CACHE_SIZE) {
        const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE);
        lyricsCache.value = Object.fromEntries(
          Object.entries(lyricsCache.value).filter(([k]) => !keysToRemove.includes(k))
        );
      }
    } catch {
      error.value = 'lyrics.notFound';
      lyricsData.value = { trackId, synced: null, plain: null };
    } finally {
      isLoading.value = false;
      if (currentFetchTrackId.value === trackId) {
        currentFetchTrackId.value = null;
      }
    }
  }

  function getActiveLine(currentTime: number): number {
    const lines = lyricsData.value?.synced;
    if (!lines || lines.length === 0) return -1;

    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= (lines[i]?.time ?? 0)) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }

  async function translateLyrics(targetLang: string = 'hu') {
    if (!lyricsData.value || isTranslating.value) return;

    if (
      translatedLanguage.value === targetLang &&
      (lyricsData.value.synced?.[0]?.translatedText || lyricsData.value.translatedPlain)
    ) {
      return;
    }

    let textToTranslate: string;

    if (lyricsData.value.synced) {
      textToTranslate = lyricsData.value.synced.map((l) => l.text).join('\n');
    } else if (lyricsData.value.plain) {
      textToTranslate = lyricsData.value.plain;
    } else {
      return;
    }

    if (!textToTranslate.trim()) return;

    isTranslating.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ translatedText: string }>(
        useApiUrl('/api/player/translate'),
        {
          method: 'POST',
          body: {
            text: textToTranslate,
            targetLang
          }
        }
      );

      if (lyricsData.value.synced) {
        const translatedLines = response.translatedText.split('\n');
        lyricsData.value.synced = lyricsData.value.synced.map((line, index) => ({
          ...line,
          translatedText: translatedLines[index] ?? undefined
        }));
      } else {
        lyricsData.value.translatedPlain = response.translatedText;
      }

      translatedLanguage.value = targetLang;
    } catch {
      error.value = 'player.errors.translationFailed';
    } finally {
      isTranslating.value = false;
    }
  }

  function clearLyrics() {
    lyricsData.value = null;
    error.value = null;
    if (lyricsCache) {
      lyricsCache.value = {};
    }
  }

  function resetTranslation() {
    if (!lyricsData.value) return;
    if (lyricsData.value.synced) {
      lyricsData.value.synced = lyricsData.value.synced.map((line) => ({
        ...line,
        translatedText: undefined
      }));
    } else {
      lyricsData.value.translatedPlain = undefined;
    }
    translatedLanguage.value = null;
  }

  return {
    lyricsData: computed(() => lyricsData.value),
    isLoading: computed(() => isLoading.value),
    isTranslating: computed(() => isTranslating.value),
    translatedLanguage: computed(() => translatedLanguage.value),
    error: computed(() => error.value),
    fetchLyrics,
    translateLyrics,
    resetTranslation,
    getActiveLine,
    clearLyrics
  };
}
