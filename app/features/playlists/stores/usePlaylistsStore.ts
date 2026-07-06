import type {
  PlaylistSummary,
  PlaylistDetail,
  CreatePlaylistPayload,
  PlaylistDetailQuery,
  ImportResult,
  FailedTrack,
  SkippedTrackEntry
} from '../types/playlists.types';
import type { Track } from '../../player/types/player.types';
import type { SearchResult } from '@/features/search/types/search.types';

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<PlaylistSummary[]>([]);
  const isLoading = ref(true);
  const hasLoaded = ref(false);
  const error = ref<string | null>(null);
  const importProgress = ref<{ current: number; total: number } | null>(null);
  const importCancelled = ref(false);
  const importResult = ref<ImportResult | null>(null);
  const importingUrl = ref<string | null>(null);
  const importingPlatform = ref<'youtube' | 'spotify' | null>(null);
  const nuxtApp = useNuxtApp();
  const t = nuxtApp.$i18n.t;

  // Capture request headers during setup for SSR
  const reqHeaders = import.meta.server ? useRequestHeaders(['cookie']) : { cookie: '' };

  function isTrackInPlaylist(playlistId: string, videoId: string): boolean {
    const p = playlists.value.find((x) => x.id === playlistId);
    return p ? p.trackIds.includes(videoId) : false;
  }

  function isTrackInAnyPlaylist(videoId: string): boolean {
    return playlists.value.some((p) => p.trackIds.includes(videoId));
  }

  async function fetchAll(force = false): Promise<void> {
    if (!force && hasLoaded.value) {
      isLoading.value = false;
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const fetchOptions: { headers?: Record<string, string> } = {};
      if (import.meta.server) {
        if (reqHeaders.cookie) {
          fetchOptions.headers = { cookie: reqHeaders.cookie };
        }
      }
      playlists.value = await $fetch<PlaylistSummary[]>('/api/playlists', fetchOptions);
      hasLoaded.value = true;
    } catch {
      error.value = t('playlists.errors.load');
    } finally {
      isLoading.value = false;
    }
  }

  async function create(payload: CreatePlaylistPayload): Promise<PlaylistSummary | null> {
    try {
      const created = await $fetch<PlaylistSummary>('/api/playlists', {
        method: 'POST',
        body: payload
      });
      playlists.value.unshift(created);
      return created;
    } catch {
      error.value = t('playlists.errors.create');
      return null;
    }
  }

  async function update(id: string, payload: Partial<CreatePlaylistPayload>): Promise<void> {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'PATCH', body: payload });
      await fetchAll(true);
    } catch {
      error.value = t('playlists.errors.update');
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      playlists.value = playlists.value.filter((p) => p.id !== id);
      return true;
    } catch {
      error.value = t('playlists.errors.delete');
      return false;
    }
  }

  async function addTrack(
    playlistId: string,
    track: {
      videoId: string;
      title: string;
      artist: string;
      artistId?: string;
      artists?: { name: string; channelId?: string }[];
      thumbnailUrl: string;
      durationMs: number;
    }
  ): Promise<void> {
    await $fetch(`/api/playlists/${playlistId}/tracks`, { method: 'POST', body: track });
    const playlist = playlists.value.find((p) => p.id === playlistId);
    if (playlist) {
      playlist.trackCount++;
      if (!playlist.trackIds.includes(track.videoId)) {
        playlist.trackIds.push(track.videoId);
      }
    }
  }

  async function removeTrack(playlistId: string, videoId: string): Promise<void> {
    await $fetch(`/api/playlists/${playlistId}/tracks/${videoId}`, { method: 'DELETE' });
    const playlist = playlists.value.find((p) => p.id === playlistId);
    if (playlist) {
      playlist.trackCount = Math.max(0, playlist.trackCount - 1);
      playlist.trackIds = playlist.trackIds.filter((id) => id !== videoId);
    }
  }

  async function fetchDetail(
    id: string,
    query?: PlaylistDetailQuery
  ): Promise<PlaylistDetail | null> {
    try {
      const fetchOptions: { headers?: Record<string, string> } = {};
      if (import.meta.server) {
        if (reqHeaders.cookie) {
          fetchOptions.headers = { cookie: reqHeaders.cookie };
        }
      }

      const searchParams = new URLSearchParams();
      if (typeof query?.limit === 'number') {
        searchParams.set('limit', String(query.limit));
      }
      if (typeof query?.offset === 'number') {
        searchParams.set('offset', String(query.offset));
      }
      if (query?.sortBy) {
        searchParams.set('sortBy', query.sortBy);
      }
      if (query?.sortOrder) {
        searchParams.set('sortOrder', query.sortOrder);
      }
      if (query?.search) {
        searchParams.set('search', query.search);
      }

      const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return await $fetch<PlaylistDetail>(`/api/playlists/${id}${suffix}`, fetchOptions);
    } catch {
      return null;
    }
  }

  function splitArtistString(artistStr: string): { name: string; channelId?: string }[] {
    if (!artistStr) return [];
    const separatorRe = /,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i;
    const parts = artistStr
      .split(separatorRe)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) return [];
    return parts.map((name) => ({ name }));
  }

  function clearImportResult(): void {
    importResult.value = null;
  }

  async function importPlaylist(
    url: string,
    platform: 'youtube' | 'spotify'
  ): Promise<PlaylistSummary | null> {
    try {
      importProgress.value = { current: 0, total: 0 };
      importResult.value = null;
      importingUrl.value = url;
      importingPlatform.value = platform;

      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      let alreadyExistsCount = 0;
      const successTracks: import('../types/playlists.types').SuccessTrack[] = [];
      const failedTracks: FailedTrack[] = [];
      const skippedTracks: SkippedTrackEntry[] = [];
      const alreadyExistsTracks: SkippedTrackEntry[] = [];

      const result = await $fetch<{
        name: string;
        description: string;
        imageUrl: string;
        tracks: Track[];
      }>(`/api/import/${platform}`, { method: 'POST', body: { url } });

      importProgress.value = { current: 0, total: result.tracks.length };

      let targetPlaylist = playlists.value.find((p) => p.name === result.name);

      if (!targetPlaylist) {
        targetPlaylist =
          (await create({
            name: result.name,
            description: result.description,
            imageUrl: result.imageUrl
          })) || undefined;
      }

      if (!targetPlaylist) {
        importProgress.value = null;
        return null;
      }
      const targetId = targetPlaylist.id;

      const normalizeString = (str: string): string => {
        return str
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[()[\]]/g, '')
          .replace(/official\s+video|official\s+audio|lyric\s+video|lyrics|video|audio/gi, '')
          .trim();
      };

      const primaryArtist = (artist: string): string => {
        return normalizeString(artist.split(/\s+feat\.\s+|\s+ft\.\s+|\s+&\s+|,\s*/i)[0] ?? artist);
      };

      const trackKey = (title: string, artist: string): string =>
        `${normalizeString(title)}|${primaryArtist(artist)}`;

      const playlistDetail = await fetchDetail(targetPlaylist.id);
      const existingTrackIds = new Set(
        playlistDetail?.tracks.map((t) => t.videoId) || targetPlaylist.trackIds || []
      );
      const existingKeyToTrack = new Map(
        (playlistDetail?.tracks ?? []).map((t) => [
          trackKey(t.title, t.artist),
          { title: t.title, artist: t.artist, thumbnailUrl: t.thumbnailUrl, videoId: t.videoId }
        ])
      );
      const initialTrackKeys = new Set(existingKeyToTrack.keys());
      const importedTrackKeys = new Set<string>();
      const processedIncomingKeys = new Set<string>();

      const CHUNK_SIZE = 5;
      for (let i = 0; i < result.tracks.length; i += CHUNK_SIZE) {
        if (importCancelled.value) break;

        const chunk = result.tracks.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (rawTrack) => {
            if (importCancelled.value) return;

            let track = rawTrack as Track;
            const originalTitle = track.title;
            const originalArtist = track.artist;

            const incomingKey = trackKey(track.title, track.artist);

            if (processedIncomingKeys.has(incomingKey)) {
              skippedCount++;
              skippedTracks.push({
                incoming: {
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl,
                  videoId: track.videoId
                },
                existing: existingKeyToTrack.get(incomingKey) || {
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl,
                  videoId: track.videoId
                }
              });
              return;
            }
            processedIncomingKeys.add(incomingKey);

            if (initialTrackKeys.has(incomingKey)) {
              alreadyExistsCount++;
              const existingTrack = existingKeyToTrack.get(incomingKey) || {
                title: track.title,
                artist: track.artist,
                thumbnailUrl: track.thumbnailUrl,
                videoId: track.videoId
              };
              alreadyExistsTracks.push({
                incoming: {
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl,
                  videoId: track.videoId
                },
                existing: existingTrack
              });
              return;
            }

            if (importedTrackKeys.has(incomingKey)) {
              skippedCount++;
              skippedTracks.push({
                incoming: {
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl,
                  videoId: track.videoId
                },
                existing: {
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl,
                  videoId: track.videoId
                }
              });
              return;
            }

            if (platform === 'spotify') {
              const searchQuery = `${track.title} ${track.artist}`;
              try {
                const searchRes = await $fetch<SearchResult[]>(`/api/search`, {
                  query: { q: searchQuery, type: 'song' }
                });
                if (searchRes && searchRes.length > 0) {
                  const ytTrack = searchRes[0];
                  if (!ytTrack) {
                    failedCount++;
                    failedTracks.push({ title: originalTitle, artist: originalArtist });
                    return;
                  }
                  const resolvedArtist = ytTrack.artist || track.artist;
                  const resolvedArtists =
                    ytTrack.artists && ytTrack.artists.length > 0
                      ? ytTrack.artists.map((a) => ({ name: a.name, channelId: a.id }))
                      : splitArtistString(resolvedArtist);
                  track = {
                    ...track,
                    videoId: ytTrack.id,
                    title: ytTrack.title,
                    artist: resolvedArtist,
                    artistId: ytTrack.artistId,
                    artists: resolvedArtists,
                    thumbnailUrl: ytTrack.thumbnailUrl,
                    durationSeconds: ytTrack.durationSeconds ?? 0
                  };
                } else {
                  failedCount++;
                  failedTracks.push({ title: originalTitle, artist: originalArtist });
                  return;
                }
              } catch (e) {
                console.error(`Search failed for ${searchQuery}`, e);
                failedCount++;
                failedTracks.push({ title: originalTitle, artist: originalArtist });
                return;
              }
            }

            const resolvedKey = trackKey(track.title, track.artist);
            if (
              track.videoId &&
              !existingTrackIds.has(track.videoId) &&
              !initialTrackKeys.has(resolvedKey) &&
              !importedTrackKeys.has(resolvedKey)
            ) {
              existingTrackIds.add(track.videoId);
              importedTrackKeys.add(resolvedKey);
              try {
                await addTrack(targetId, {
                  videoId: track.videoId,
                  title: track.title,
                  artist: track.artist,
                  artistId: track.artistId,
                  artists: track.artists ?? [],
                  thumbnailUrl: track.thumbnailUrl,
                  durationMs: track.durationSeconds * 1000
                });
                successCount++;
                successTracks.push({
                  title: track.title,
                  artist: track.artist,
                  thumbnailUrl: track.thumbnailUrl
                });
              } catch {
                failedCount++;
                failedTracks.push({ title: originalTitle, artist: originalArtist });
              }
            } else if (!track.videoId) {
              failedCount++;
              failedTracks.push({ title: originalTitle, artist: originalArtist });
            } else {
              skippedCount++;
            }
          })
        );

        importProgress.value = {
          current: Math.min(i + CHUNK_SIZE, result.tracks.length),
          total: result.tracks.length
        };
      }

      importCancelled.value = false;
      importProgress.value = null;
      importingUrl.value = null;
      importingPlatform.value = null;
      importResult.value = {
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        alreadyExists: alreadyExistsCount,
        successTracks,
        failedTracks,
        skippedTracks,
        alreadyExistsTracks
      };
      return targetPlaylist;
    } catch {
      importCancelled.value = false;
      importProgress.value = null;
      importingUrl.value = null;
      importingPlatform.value = null;
      error.value = t('playlists.errors.import') || 'Failed to import playlist';
      return null;
    }
  }

  async function reorderTrack(
    playlistId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<boolean> {
    if (fromIndex === toIndex) return true;

    try {
      const response = await $fetch<{ success: boolean }>(`/api/playlists/${playlistId}/reorder`, {
        method: 'PATCH',
        body: { fromIndex, toIndex }
      });
      return response.success;
    } catch {
      return false;
    }
  }

  function cancelImport(): void {
    importCancelled.value = true;
  }

  return {
    playlists,
    isLoading,
    error,
    importProgress,
    importCancelled,
    importResult,
    importingUrl,
    importingPlatform,
    isTrackInPlaylist,
    isTrackInAnyPlaylist,
    fetchAll,
    create,
    update,
    remove,
    addTrack,
    cancelImport,
    clearImportResult,
    removeTrack,
    reorderTrack,
    fetchDetail,
    importPlaylist
  };
});
