import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { useMusicVideo } from '@/features/player/composables/useMusicVideo';

const fetchMock = vi.hoisted(() => vi.fn());
mockNuxtImport('$fetch', () => fetchMock);

describe('useMusicVideo', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    const { resetMusicVideo, clearVideoCache } = useMusicVideo();
    resetMusicVideo();
    clearVideoCache();
  });

  it('initializes with default values', () => {
    const { musicVideoUrl, isLoading, isNotFound } = useMusicVideo();
    expect(musicVideoUrl.value).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(isNotFound.value).toBe(false);
  });

  it('marks not found when title and artist are missing', async () => {
    const { musicVideoUrl, isNotFound, fetchMusicVideo } = useMusicVideo();
    await fetchMusicVideo({ title: '', artist: '' });
    expect(musicVideoUrl.value).toBeNull();
    expect(isNotFound.value).toBe(true);
  });

  it('fetches music video successfully when found', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/musicvideo')) {
        return Promise.resolve({ results: [{ videoId: 'test_vid_123' }] });
      }
      if (url.includes('/api/stream')) {
        return Promise.resolve('mock-stream-data');
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const { musicVideoUrl, isLoading, isNotFound, fetchMusicVideo } = useMusicVideo();
    await fetchMusicVideo({ title: 'Acapulco', artist: 'Jason Derulo' });

    expect(isLoading.value).toBe(false);
    expect(isNotFound.value).toBe(false);
    expect(musicVideoUrl.value).toContain('v=test_vid_123');
  });

  it('marks not found when search results are empty', async () => {
    fetchMock.mockResolvedValue({ results: [] });

    const { musicVideoUrl, isNotFound, fetchMusicVideo } = useMusicVideo();
    await fetchMusicVideo({ title: 'Nonexistent', artist: 'Unknown' });

    expect(musicVideoUrl.value).toBeNull();
    expect(isNotFound.value).toBe(true);
  });

  it('preloads music video and uses cache for subsequent fetch', async () => {
    fetchMock.mockResolvedValue({ results: [{ videoId: 'preloaded_vid_456' }] });

    const { musicVideoUrl, preloadMusicVideo, fetchMusicVideo } = useMusicVideo();
    await preloadMusicVideo({ title: 'Song', artist: 'Artist' });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await fetchMusicVideo({ title: 'Song', artist: 'Artist' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(musicVideoUrl.value).toContain('v=preloaded_vid_456');
  });

  it('uses videoId as cache key when provided', async () => {
    fetchMock.mockResolvedValue({ results: [{ videoId: 'custom_vid_789' }] });

    const { musicVideoUrl, fetchMusicVideo } = useMusicVideo();
    await fetchMusicVideo({ videoId: 'track_123', title: 'Song', artist: 'Artist' });

    expect(musicVideoUrl.value).toContain('v=custom_vid_789');

    fetchMock.mockResolvedValue({ results: [{ videoId: 'custom_vid_999' }] });
    await fetchMusicVideo({ videoId: 'track_456', title: 'Song', artist: 'Artist' });

    expect(musicVideoUrl.value).toContain('v=custom_vid_999');
  });
});
