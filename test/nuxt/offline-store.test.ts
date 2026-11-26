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
  let mockClearAllTracks: ReturnType<typeof vi.spyOn>;

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
    mockClearAllTracks = vi.spyOn(offlineDb, 'clearAllTracks').mockResolvedValue(undefined);

    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    global.URL.revokeObjectURL = vi.fn();

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
    expect(mockGetTrackBlob).not.toHaveBeenCalled();
  });

  it('downloads track and updates progress', async () => {
    const store = useOfflineStore();

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

  it('downloads full track across multiple 206 range responses', async () => {
    const store = useOfflineStore();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 206,
        headers: new Headers({
          'content-type': 'audio/mp4',
          'content-range': 'bytes 0-3/8',
          'content-length': '4'
        }),
        body: {
          getReader: () => {
            let doneOnce = false;
            return {
              read: vi.fn().mockImplementation(() => {
                if (!doneOnce) {
                  doneOnce = true;
                  return Promise.resolve({ done: false, value: new Uint8Array([1, 2, 3, 4]) });
                }
                return Promise.resolve({ done: true });
              })
            };
          }
        }
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 206,
        headers: new Headers({
          'content-type': 'audio/mp4',
          'content-range': 'bytes 4-7/8',
          'content-length': '4'
        }),
        body: {
          getReader: () => {
            let doneOnce = false;
            return {
              read: vi.fn().mockImplementation(() => {
                if (!doneOnce) {
                  doneOnce = true;
                  return Promise.resolve({ done: false, value: new Uint8Array([5, 6, 7, 8]) });
                }
                return Promise.resolve({ done: true });
              })
            };
          }
        }
      } as unknown as Response);

    const track = {
      videoId: 'chunked-1',
      title: 'Chunked Track',
      artist: 'Artist',
      thumbnailUrl: '',
      durationSeconds: 173
    };
    await store.downloadTrack(track);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(store.getStatus('chunked-1')).toBe('done');
    expect(store.getProgress('chunked-1')).toBe(100);
    expect(mockSaveTrack).toHaveBeenCalledTimes(1);
    const savedMeta = mockSaveTrack.mock.calls[0]?.[0];
    const savedBlob = mockSaveTrack.mock.calls[0]?.[1];
    expect(savedMeta?.sizeBytes).toBe(8);
    expect(savedBlob?.type).toBe('audio/mp4');
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

    expect(mockClearAllTracks).toHaveBeenCalledTimes(1);
    expect(store.downloadedTracks).toHaveLength(0);
    expect(store.totalSizeBytes).toBe(0);
  });
});
