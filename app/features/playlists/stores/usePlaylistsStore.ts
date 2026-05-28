import type {
  PlaylistSummary,
  PlaylistDetail,
  CreatePlaylistPayload
} from '../types/playlists.types';
import type { Track } from '../../player/types/player.types';

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<PlaylistSummary[]>([]);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const { t } = useI18n();

  function isTrackInPlaylist(playlistId: string, videoId: string): boolean {
    const p = playlists.value.find((x) => x.id === playlistId);
    return p ? p.trackIds.includes(videoId) : false;
  }

  function isTrackInAnyPlaylist(videoId: string): boolean {
    return playlists.value.some((p) => p.trackIds.includes(videoId));
  }

  async function fetchAll(): Promise<void> {
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
      await fetchAll();
    } catch {
      error.value = t('playlists.errors.update');
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      playlists.value = playlists.value.filter((p) => p.id !== id);
    } catch {
      error.value = t('playlists.errors.delete');
    }
  }

  async function addTrack(
    playlistId: string,
    track: {
      videoId: string;
      title: string;
      artist: string;
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

  async function fetchDetail(id: string): Promise<PlaylistDetail | null> {
    try {
      return await $fetch<PlaylistDetail>(`/api/playlists/${id}`);
    } catch {
      return null;
    }
  }

  async function importPlaylist(
    url: string,
    platform: 'youtube' | 'spotify'
  ): Promise<PlaylistSummary | null> {
    try {
      const result = await $fetch<{
        name: string;
        description: string;
        imageUrl: string;
        tracks: Track[];
      }>(`/api/import/${platform}`, { method: 'POST', body: { url } });

      const created = await create({
        name: result.name,
        description: result.description,
        imageUrl: result.imageUrl
      });

      if (!created) return null;

      for (const track of result.tracks) {
        await addTrack(created.id, {
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          thumbnailUrl: track.thumbnailUrl,
          durationMs: track.durationSeconds * 1000
        });
      }

      return created;
    } catch {
      error.value = t('playlists.errors.import') || 'Failed to import playlist';
      return null;
    }
  }

  return {
    playlists,
    isLoading,
    error,
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
