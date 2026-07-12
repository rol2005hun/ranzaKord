interface MusicVideoResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const artist = query['artist'] as string | undefined;
  const title = query['title'] as string | undefined;

  if (!artist || !title) {
    throw createError({ statusCode: 400, message: 'artist and title are required' });
  }

  const searchQuery = `${artist} ${title} official music video`;
  const innertube = await createInnertube(false);

  const results = await innertube.search(searchQuery, { type: 'video' });
  const items: MusicVideoResult[] = [];

  if (results.results) {
    for (const item of results.results) {
      if (item.type !== 'Video') continue;
      const video = item as unknown as {
        id?: string;
        title?: { text?: string };
        author?: { name?: string };
        thumbnails?: Array<{ url: string; width: number; height: number }>;
        duration?: { seconds?: number };
      };

      const videoId = video.id;
      const videoTitle = video.title?.text ?? '';
      const authorName = video.author?.name ?? '';
      const thumbnail = video.thumbnails?.[0]?.url ?? '';
      const duration = video.duration?.seconds ?? 0;

      if (!videoId) continue;

      items.push({
        videoId,
        title: videoTitle,
        artist: authorName,
        thumbnailUrl: thumbnail,
        durationSeconds: duration
      });

      if (items.length >= 5) break;
    }
  }

  return { results: items };
});
