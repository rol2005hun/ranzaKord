import type { SkipSegment, SponsorBlockApiResponse } from '@/features/player/types/player.types';

const currentSegments = ref<SkipSegment[]>([]);
const isLoading = ref<boolean>(false);
const cache = new Map<string, SkipSegment[]>();

export function useSponsorBlock() {
  async function fetchSegments(videoId: string): Promise<SkipSegment[]> {
    if (!videoId) {
      currentSegments.value = [];
      return [];
    }

    if (cache.has(videoId)) {
      const cached = cache.get(videoId) || [];
      currentSegments.value = cached;
      return cached;
    }

    isLoading.value = true;
    try {
      const data = await $fetch<SponsorBlockApiResponse>(
        useApiUrl(`/api/sponsorblock?v=${encodeURIComponent(videoId)}`)
      );
      const segs = data?.segments || [];
      cache.set(videoId, segs);
      currentSegments.value = segs;
      return segs;
    } catch {
      currentSegments.value = [];
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  function clearSegments(): void {
    currentSegments.value = [];
  }

  function shouldSkip(currentTime: number): number | null {
    for (const [start, end] of currentSegments.value) {
      if (currentTime >= start && currentTime < end - 0.25) {
        return end + 0.05;
      }
    }
    return null;
  }

  function resetCache(): void {
    cache.clear();
    currentSegments.value = [];
    isLoading.value = false;
  }

  return {
    segments: currentSegments,
    isLoading,
    fetchSegments,
    clearSegments,
    shouldSkip,
    resetCache
  };
}
