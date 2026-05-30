import type {
  PlaylistSummary,
  PlaylistDetail,
  CreatePlaylistPayload,
  PlaylistDetailQuery
} from '../types/playlists.types';
import type { Track } from '../../player/types/player.types';
import type { SearchResult } from '@/features/search/types/search.types';

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<PlaylistSummary[]>([]);
  const isLoading = ref(true);
  const hasLoaded = ref(false);
  const error = ref<string | null>(null);
  const importProgress = ref<{ current: number; total: number } | null>(null);
  const { t } = useI18n();

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
        const reqHeaders = useRequestHeaders(['cookie']);
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
        const reqHeaders = useRequestHeaders(['cookie']);
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

      const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return await $fetch<PlaylistDetail>(`/api/playlists/${id}${suffix}`, fetchOptions);
    } catch {
      return null;
    }
  }

  async function importPlaylist(
    url: string,
    platform: 'youtube' | 'spotify'
  ): Promise<PlaylistSummary | null> {
    try {
      importProgress.value = { current: 0, total: 0 };
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

      const playlistDetail = await fetchDetail(targetPlaylist.id);
      const existingTrackIds = new Set(
        playlistDetail?.tracks.map((t) => t.videoId) || targetPlaylist.trackIds || []
      );

      for (let i = 0; i < result.tracks.length; i++) {
        importProgress.value = { current: i + 1, total: result.tracks.length };
        let track = result.tracks[i] as Track;

        if (platform === 'spotify') {
          const searchQuery = `${track.title} ${track.artist}`;
          try {
            const searchRes = await $fetch<SearchResult[]>(`/api/search`, {
              query: { q: searchQuery, type: 'song' }
            });
            if (searchRes && searchRes.length > 0) {
              const ytTrack = searchRes[0];
              if (!ytTrack) {
                continue;
              }
              track = {
                ...track,
                videoId: ytTrack.id,
                title: ytTrack.title,
                artist: ytTrack.artist,
                artistId: ytTrack.artistId,
                thumbnailUrl: ytTrack.thumbnailUrl,
                durationSeconds: ytTrack.durationSeconds ?? 0
              };
            } else {
              continue;
            }
          } catch (e) {
            console.error(`Search failed for ${searchQuery}`, e);
            continue;
          }
        }

        if (track.videoId && !existingTrackIds.has(track.videoId)) {
          await addTrack(targetPlaylist.id, {
            videoId: track.videoId,
            title: track.title,
            artist: track.artist,
            artistId: track.artistId,
            thumbnailUrl: track.thumbnailUrl,
            durationMs: track.durationSeconds * 1000
          });
          existingTrackIds.add(track.videoId);
        }
      }

      importProgress.value = null;
      return targetPlaylist;
    } catch {
      importProgress.value = null;
      error.value = t('playlists.errors.import') || 'Failed to import playlist';
      return null;
    }
  }

  return {
    playlists,
    isLoading,
    error,
    importProgress,
    isTrackInPlaylist,
    isTrackInAnyPlaylist,
    fetchAll,
    create,
    update,
    remove,
    addTrack,
    removeTrack,
    fetchDetail,
    importPlaylist
  };
});
