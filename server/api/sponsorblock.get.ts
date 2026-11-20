import type { SkipSegment, SponsorBlockApiResponse } from '@/features/player/types/player.types';

export default defineEventHandler(async (event): Promise<SponsorBlockApiResponse> => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;

  if (!videoId || videoId.trim().length === 0) {
    return { segments: [] };
  }

  const vid = videoId.trim();
  const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(vid)}&category=music_offtopic`;

  try {
    const res = await $fetch<Array<{ segment: SkipSegment }>>(url, {
      timeout: 3000
    });
    return {
      segments: Array.isArray(res) ? res.map((r) => r.segment) : []
    };
  } catch {
    return { segments: [] };
  }
});
