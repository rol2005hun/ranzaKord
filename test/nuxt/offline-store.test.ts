import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOfflineStore } from '../../app/features/offline/stores/useOfflineStore';
import * as offlineDb from '../../app/features/offline/composables/useOfflineDb';
import { useRuntimeConfig } from '#imports';

describe('useOfflineStore', () => {
  let mockGetAllMetas: ReturnType<typeof vi.spyOn>;
  let mockGetTrackBlob: ReturnType<typeof vi.spyOn>;
  let mockSaveTrack: ReturnType<typeof vi.spyOn>;
  let mockDeleteTrack: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    useRuntimeConfig().public.baseUrl = 'http://localhost:3000';
    vi.clearAllMocks();

    mockGetAllMetas = vi.spyOn(offlineDb, 'getAllMetas').mockResolvedValue([]);
    mockGetTrackBlob = vi
      .spyOn(offlineDb, 'getTrackBlob')
      .mockResolvedValue(new Blob(['test'], { type: 'audio/webm' }));
    mockSaveTrack = vi.spyOn(offlineDb, 'saveTrack').mockResolvedValue(undefined);
    mockDeleteTrack = vi.spyOn(offlineDb, 'deleteTrack').mockResolvedValue(undefined);

    // Mock URL object
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    global.URL.revokeObjectURL = vi.fn();

    // Mock navigator.storage
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 1000000 })
      },
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes and fetches from db', async () => {
    mockGetAllMetas.mockResolvedValue([{ videoId: '1', title: 'Test', sizeBytes: 500 }]);

    const store = useOfflineStore();
    await store.init();

    expect(store.downloadedTracks).toHaveLength(1);
    expect(store.isTrackDownloaded('1')).toBe(true);
    expect(store.totalSizeBytes).toBe(500);
    expect(store.storageQuotaBytes).toBe(1000000);
  });

  it('handles object url caching', async () => {
    const store = useOfflineStore();
    const url1 = await store.getObjectUrl('1');
    expect(url1).toBe('blob:http://localhost/test');
    expect(mockGetTrackBlob).toHaveBeenCalledWith('1');

    mockGetTrackBlob.mockClear();

    const url2 = await store.getObjectUrl('1');
    expect(url2).toBe('blob:http://localhost/test');
    expect(mockGetTrackBlob).not.toHaveBeenCalled(); // Should hit cache
  });

  it('downloads track and updates progress', async () => {
    const store = useOfflineStore();

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-length': '10' }),
      body: {
        getReader: () => {
          let readCount = 0;
          return {
            read: vi.fn().mockImplementation(() => {
              readCount++;
              if (readCount === 1)
                return Promise.resolve({ done: false, value: new Uint8Array([1, 2, 3, 4, 5]) });
              if (readCount === 2)
                return Promise.resolve({ done: false, value: new Uint8Array([6, 7, 8, 9, 10]) });
              return Promise.resolve({ done: true });
            })
          };
        }
      }
    } as unknown as Response);

    const track = {
      videoId: '2',
      title: 'Track 2',
      artist: 'Artist',
      thumbnailUrl: '',
      durationSeconds: 120
    };
    await store.downloadTrack(track);

    expect(store.getStatus('2')).toBe('done');
    expect(store.getProgress('2')).toBe(100);
    expect(mockSaveTrack).toHaveBeenCalled();
    expect(store.isTrackDownloaded('2')).toBe(true);
  });

  it('removes a downloaded track', async () => {
    const store = useOfflineStore();

    mockGetAllMetas.mockResolvedValue([{ videoId: '3', title: 'Test', sizeBytes: 100 }]);
    await store.init();

    expect(store.isTrackDownloaded('3')).toBe(true);

    await store.removeTrack('3');

    expect(mockDeleteTrack).toHaveBeenCalledWith('3');
    expect(store.isTrackDownloaded('3')).toBe(false);
  });

  it('removes all tracks', async () => {
    const store = useOfflineStore();
    mockGetAllMetas.mockResolvedValue([
      { videoId: '1', title: 'Test 1', sizeBytes: 100 },
      { videoId: '2', title: 'Test 2', sizeBytes: 200 }
    ]);
    await store.init();

    expect(store.downloadedTracks).toHaveLength(2);

    await store.removeAll();

    expect(mockDeleteTrack).toHaveBeenCalledTimes(2);
    expect(store.downloadedTracks).toHaveLength(0);
    expect(store.totalSizeBytes).toBe(0);
  });
});
