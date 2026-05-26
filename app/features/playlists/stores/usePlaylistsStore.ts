import type {
  PlaylistSummary,
  PlaylistDetail,
  CreatePlaylistPayload
} from '../types/playlists.types';

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref<PlaylistSummary[]>([]);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      playlists.value = await $fetch<PlaylistSummary[]>('/api/playlists');
    } catch {
      error.value = 'Failed to load playlists';
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
      error.value = 'Failed to create playlist';
      return null;
    }
  }

  async function update(id: string, payload: Partial<CreatePlaylistPayload>): Promise<void> {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'PATCH', body: payload });
      await fetchAll();
    } catch {
      error.value = 'Failed to update playlist';
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      playlists.value = playlists.value.filter((p) => p.id !== id);
    } catch {
      error.value = 'Failed to delete playlist';
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
    if (playlist) playlist.trackCount++;
  }

  async function removeTrack(playlistId: string, videoId: string): Promise<void> {
    await $fetch(`/api/playlists/${playlistId}/tracks/${videoId}`, { method: 'DELETE' });
    const playlist = playlists.value.find((p) => p.id === playlistId);
    if (playlist) playlist.trackCount = Math.max(0, playlist.trackCount - 1);
  }

  async function fetchDetail(id: string): Promise<PlaylistDetail | null> {
    try {
      return await $fetch<PlaylistDetail>(`/api/playlists/${id}`);
    } catch {
      return null;
    }
  }

  return {
    playlists,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    remove,
    addTrack,
    removeTrack,
    fetchDetail
  };
});
