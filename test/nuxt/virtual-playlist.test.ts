import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVirtualPlaylist } from '@/features/playlists/composables/useVirtualPlaylist';
import { ref, nextTick } from 'vue';
import type { PlaylistTrack } from '@/features/playlists/types/playlists.types';

describe('useVirtualPlaylist', () => {
  const mockTracks: PlaylistTrack[] = Array.from({ length: 100 }).map((_, i) => ({
    videoId: `v${i}`,
    title: `Track ${i}`,
    artist: `Artist ${i}`,
    thumbnailUrl: `thumb${i}.jpg`,
    durationSeconds: 120,
    durationMs: 120000,
    addedAt: new Date().toISOString(),
    addedBy: { id: '1', name: 'User' }
  }));

  const mockFetchChunk = vi.fn().mockImplementation(async (offset: number, limit: number) => {
    return mockTracks.slice(offset, offset + limit);
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchChunk.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes with null array of correct length', () => {
    const trackCount = ref(100);
    const { virtualTracks, totalHeight } = useVirtualPlaylist({
      trackCount,
      fetchChunk: mockFetchChunk,
      itemHeight: 50
    });

    expect(virtualTracks.value.length).toBe(100);
    expect(virtualTracks.value[0]).toBeNull();
    expect(totalHeight.value).toBe(5000);
  });

  it('updates track array length when trackCount changes', async () => {
    const trackCount = ref(50);
    const { virtualTracks } = useVirtualPlaylist({
      trackCount,
      fetchChunk: mockFetchChunk
    });

    expect(virtualTracks.value.length).toBe(50);

    trackCount.value = 150;
    // Wait for watch to trigger
    await nextTick();
    expect(virtualTracks.value.length).toBe(150);
    expect(virtualTracks.value[149]).toBeNull();

    trackCount.value = 10;
    await nextTick();
    expect(virtualTracks.value.length).toBe(10);
  });

  it('loads missing chunks on scroll', async () => {
    const trackCount = ref(100);
    const { onScroll, virtualTracks, isLoadingChunk } = useVirtualPlaylist({
      trackCount,
      fetchChunk: mockFetchChunk,
      chunkSize: 20,
      itemHeight: 50,
      debounceMs: 200
    });

    // Simulate scroll to index 40 (scrollTop 2000)
    const mockEvent = {
      target: {
        scrollTop: 2000,
        clientHeight: 500 // Can show 10 items
      }
    } as unknown as Event;

    onScroll(mockEvent);

    // Should wait for debounce
    expect(mockFetchChunk).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);

    // Expect fetchChunk to be called for the required chunk
    expect(mockFetchChunk).toHaveBeenCalled();

    // Simulate promise resolution
    vi.useRealTimers();
    await nextTick();
    await nextTick();
    await nextTick();

    expect(isLoadingChunk.value).toBe(false);

    // Chunk size is 20, we scrolled to item 40, so chunk 40 should be loaded
    // Depending on overscan, it might load 40-59
    expect(virtualTracks.value[40]).toEqual(mockTracks[40]);
  });
});

// Helper for nextTick in vitest
