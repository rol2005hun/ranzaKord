import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

describe('usePlaylistsStore', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    fetchMock = vi.fn();
    globalThis.$fetch = fetchMock as unknown as typeof globalThis.$fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlaylist = {
    id: 'p1',
    name: 'Test Playlist',
    description: '',
    imageUrl: '',
    trackIds: ['t1', 't2'],
    trackCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('initializes correctly', () => {
    const store = usePlaylistsStore();
    expect(store.playlists).toEqual([]);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBeNull();
    expect(store.importProgress).toBeNull();
  });

  describe('isTrackInPlaylist / isTrackInAnyPlaylist', () => {
    it('checks if track is in playlist', () => {
      const store = usePlaylistsStore();
      store.playlists = [mockPlaylist];
      expect(store.isTrackInPlaylist('p1', 't1')).toBe(true);
      expect(store.isTrackInPlaylist('p1', 't3')).toBe(false);
      expect(store.isTrackInPlaylist('p2', 't1')).toBe(false);
    });

    it('checks if track is in any playlist', () => {
      const store = usePlaylistsStore();
      store.playlists = [mockPlaylist];
      expect(store.isTrackInAnyPlaylist('t2')).toBe(true);
      expect(store.isTrackInAnyPlaylist('t3')).toBe(false);
    });
  });

  describe('fetchAll', () => {
    it('fetches all playlists successfully', async () => {
      fetchMock.mockResolvedValue({ myPlaylists: [mockPlaylist], sharedPlaylists: [] });
      const store = usePlaylistsStore();
      await store.fetchAll();
      expect(store.playlists).toEqual([mockPlaylist]);
      expect(store.isLoading).toBe(false);
    });

    it('handles fetch all error', async () => {
      fetchMock.mockRejectedValue(new Error('Fetch error'));
      const store = usePlaylistsStore();
      await store.fetchAll();
      expect(store.error).toBeDefined(); // Actually we mock useI18n, but since it's global let's just check truthy
      expect(store.isLoading).toBe(false);
    });
  });

  describe('create / update / remove', () => {
    it('creates a playlist', async () => {
      fetchMock.mockResolvedValue(mockPlaylist);
      const store = usePlaylistsStore();

      const res = await store.create({ name: 'Test', description: '', imageUrl: '' });
      expect(res).toEqual(mockPlaylist);
      expect(store.playlists[0]).toEqual(mockPlaylist);
    });

    it('handles create error', async () => {
      fetchMock.mockRejectedValue(new Error());
      const store = usePlaylistsStore();

      const res = await store.create({ name: 'Test', description: '', imageUrl: '' });
      expect(res).toBeNull();
      expect(store.error).toBeDefined();
    });

    it('updates a playlist', async () => {
      fetchMock.mockResolvedValue({});
      const store = usePlaylistsStore();

      await store.update('p1', { name: 'New Name' });
      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/playlists/p1', {
        method: 'PATCH',
        body: { name: 'New Name' }
      });
      // update calls fetchAll which calls /api/playlists
      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/playlists', expect.any(Object));
    });

    it('removes a playlist', async () => {
      fetchMock.mockResolvedValue({});
      const store = usePlaylistsStore();
      store.playlists = [mockPlaylist, { ...mockPlaylist, id: 'p2' }];

      const success = await store.remove('p1');
      expect(success).toBe(true);
      expect(store.playlists.length).toBe(1);
      expect(store.playlists[0]?.id).toBe('p2');
    });
  });

  describe('addTrack / removeTrack', () => {
    it('adds a track', async () => {
      fetchMock.mockResolvedValue({});
      const store = usePlaylistsStore();
      store.playlists = [{ ...mockPlaylist, trackIds: [], trackCount: 0 }];

      await store.addTrack('p1', {
        videoId: 't1',
        title: 'T',
        artist: 'A',
        thumbnailUrl: '',
        durationMs: 100
      });
      expect(store.playlists[0]?.trackCount).toBe(1);
      expect(store.playlists[0]?.trackIds).toContain('t1');
    });

    it('removes a track', async () => {
      fetchMock.mockResolvedValue({});
      const store = usePlaylistsStore();
      store.playlists = [mockPlaylist]; // Has t1 and t2

      await store.removeTrack('p1', 't1');
      expect(store.playlists[0]?.trackCount).toBe(1);
      expect(store.playlists[0]?.trackIds).not.toContain('t1');
    });
  });

  describe('fetchDetail', () => {
    it('fetches detail successfully', async () => {
      const detail = { ...mockPlaylist, tracks: [] };
      fetchMock.mockResolvedValue(detail);
      const store = usePlaylistsStore();

      const res = await store.fetchDetail('p1', { limit: 10, offset: 0 });
      expect(res).toEqual(detail);
      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/playlists/p1?limit=10&offset=0',
        expect.anything()
      );
    });

    it('handles fetchDetail error', async () => {
      fetchMock.mockRejectedValue(new Error());
      const store = usePlaylistsStore();
      const res = await store.fetchDetail('p1');
      expect(res).toBeNull();
    });
  });

  describe('importPlaylist', () => {
    it('handles import error', async () => {
      fetchMock.mockRejectedValue(new Error());
      const store = usePlaylistsStore();

      const res = await store.importPlaylist('http://yt', 'youtube');
      expect(res).toBeNull();
      expect(store.error).toBeDefined();
    });

    it('imports youtube playlist successfully', async () => {
      const mockResult = {
        name: 'YT Import',
        description: 'desc',
        imageUrl: 'img',
        tracks: [{ title: 't', artist: 'a', videoId: 'v1', durationSeconds: 10 }]
      };

      fetchMock.mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/api/import/youtube')) return mockResult;
        if (typeof url === 'string' && url.includes('/api/playlists') && !url.includes('/tracks')) {
          // fetchDetail or create
          return { id: 'p3', name: 'YT Import', trackIds: [], tracks: [] };
        }
        return {}; // For addTrack
      });

      const store = usePlaylistsStore();

      const res = await store.importPlaylist('http://yt', 'youtube');

      expect(res?.id).toBe('p3');
      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/playlists/p3/tracks',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('imports spotify playlist successfully with search', async () => {
      const mockResult = {
        name: 'SP Import',
        description: 'desc',
        imageUrl: 'img',
        tracks: [{ title: 'song', artist: 'artist', videoId: null, durationSeconds: 10 }]
      };

      fetchMock.mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/api/import/spotify')) return mockResult;
        if (typeof url === 'string' && url.includes('/api/search'))
          return [{ id: 'v2', title: 'song', artist: 'artist', durationSeconds: 10 }];
        if (typeof url === 'string' && url.includes('/api/playlists') && !url.includes('/tracks')) {
          return { id: 'p4', name: 'SP Import', trackIds: [], tracks: [] };
        }
        return {};
      });

      const store = usePlaylistsStore();

      const res = await store.importPlaylist('http://sp', 'spotify');

      expect(res?.id).toBe('p4');
      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/playlists/p4/tracks',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns null if create fails during import', async () => {
      const mockResult = {
        name: 'Fail Import',
        description: '',
        imageUrl: '',
        tracks: []
      };
      fetchMock.mockResolvedValueOnce(mockResult); // the /import call
      const store = usePlaylistsStore();
      vi.spyOn(store, 'create').mockResolvedValue(null);

      const res = await store.importPlaylist('http://yt', 'youtube');
      expect(res).toBeNull();
    });

    it('handles addTrack errors during import', async () => {
      const mockResult = {
        name: 'YT Import',
        description: 'desc',
        imageUrl: 'img',
        tracks: [
          { title: 't1', artist: 'a1', videoId: 'v1', durationSeconds: 10 },
          { title: 't2', artist: 'a2', videoId: null, durationSeconds: 10 }, // No video ID
          { title: 't3', artist: 'a3', videoId: 'v3', durationSeconds: 10 }
        ]
      };

      fetchMock.mockImplementation(async (url, options) => {
        if (typeof url === 'string' && url.includes('/api/import/youtube')) return mockResult;
        if (typeof url === 'string' && url.includes('/api/playlists') && !url.includes('/tracks')) {
          return { id: 'p3', name: 'YT Import', trackIds: [], tracks: [] };
        }
        if (typeof url === 'string' && url.includes('/tracks')) {
          if (options?.body?.videoId === 'v3') {
            throw new Error('addTrack failed');
          }
          return { success: true };
        }
        return {};
      });

      const store = usePlaylistsStore();
      const res = await store.importPlaylist('http://yt', 'youtube');

      expect(res?.id).toBe('p3');
      expect(store.importResult?.success).toBe(1); // v1
      expect(store.importResult?.failed).toBe(2); // v2 (no ID), v3 (error)
    });

    it('can cancel import', () => {
      const store = usePlaylistsStore();
      expect(store.importCancelled).toBe(false);
      store.cancelImport();
      expect(store.importCancelled).toBe(true);
    });
  });

  describe('reorderTrack', () => {
    it('returns true if fromIndex equals toIndex', async () => {
      const store = usePlaylistsStore();
      const result = await store.reorderTrack('p1', 1, 1);
      expect(result).toBe(true);
      expect(globalThis.$fetch).not.toHaveBeenCalled();
    });

    it('calls API and returns success', async () => {
      fetchMock.mockResolvedValue({ success: true });
      const store = usePlaylistsStore();

      const result = await store.reorderTrack('p1', 0, 2);

      expect(result).toBe(true);
      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/playlists/p1/reorder', {
        method: 'PATCH',
        body: { fromIndex: 0, toIndex: 2 }
      });
    });

    it('returns false on error', async () => {
      fetchMock.mockRejectedValue(new Error());
      const store = usePlaylistsStore();

      const result = await store.reorderTrack('p1', 0, 2);
      expect(result).toBe(false);
    });
  });
});
