import type { LyricLine, LyricsData } from '../types/sidebar.types';
import type { Track } from '../types/player.types';

interface LrclibResponse {
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

const lyricsData = ref<LyricsData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentFetchTrackId = ref<string | null>(null);

export function useLyrics() {
  async function fetchLyrics(track: Track): Promise<void> {
    const trackId = track.videoId;

    if (lyricsData.value?.trackId === trackId || currentFetchTrackId.value === trackId) return;

    currentFetchTrackId.value = trackId;
    isLoading.value = true;
    error.value = null;
    lyricsData.value = null;

    try {
      const durationSeconds = Math.round(track.durationSeconds);
      const params = new URLSearchParams({
        artist_name: track.artist,
        track_name: track.title
      });

      if (durationSeconds > 0 && durationSeconds <= 3600) {
        params.append('duration', String(durationSeconds));
      }

      const response = await $fetch<LrclibResponse>(
        `https://lrclib.net/api/get?${params.toString()}`
      );

      lyricsData.value = {
        trackId,
        synced: response.syncedLyrics ? parseLrc(response.syncedLyrics) : null,
        plain: response.plainLyrics ?? null
      };
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

    let active = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= (lines[i]?.time ?? 0)) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }

  function clearLyrics() {
    lyricsData.value = null;
    error.value = null;
  }

  return {
    lyricsData: computed(() => lyricsData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchLyrics,
    getActiveLine,
    clearLyrics
  };
}
