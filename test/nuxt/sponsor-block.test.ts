import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { useSponsorBlock } from '@/features/player/composables/useSponsorBlock';

const fetchMock = vi.hoisted(() => vi.fn());
mockNuxtImport('$fetch', () => fetchMock);

describe('useSponsorBlock', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    const { resetCache } = useSponsorBlock();
    resetCache();
  });

  it('initializes with empty segments', () => {
    const { segments, isLoading } = useSponsorBlock();
    expect(segments.value).toEqual([]);
    expect(isLoading.value).toBe(false);
  });

  it('handles empty videoId', async () => {
    const { fetchSegments, segments } = useSponsorBlock();
    const result = await fetchSegments('');
    expect(result).toEqual([]);
    expect(segments.value).toEqual([]);
  });

  it('fetches segments successfully and caches result', async () => {
    fetchMock.mockResolvedValueOnce({
      segments: [
        [0, 21.8],
        [249.3, 281.5]
      ]
    });

    const { fetchSegments, segments, shouldSkip } = useSponsorBlock();
    const result = await fetchSegments('kJQP7kiw5Fk');

    expect(result.length).toBe(2);
    expect(segments.value.length).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const cached = await fetchSegments('kJQP7kiw5Fk');
    expect(cached.length).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(shouldSkip(10)).toBeCloseTo(21.85, 2);
    expect(shouldSkip(250)).toBeCloseTo(281.55, 2);
    expect(shouldSkip(50)).toBeNull();
  });

  it('handles API error gracefully by returning empty segments', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { fetchSegments, segments, shouldSkip } = useSponsorBlock();
    const result = await fetchSegments('error_vid');

    expect(result).toEqual([]);
    expect(segments.value).toEqual([]);
    expect(shouldSkip(10)).toBeNull();
  });
});
