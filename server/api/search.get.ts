import type { ServerSession } from '../types/auth.server.types';

export interface SearchResultItem {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export default defineEventHandler(async (event): Promise<SearchResultItem[]> => {
  const query = getQuery(event);
  const q = query['q'] as string | undefined;

  if (!q || q.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing search query' });
  }

  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  const innertube = await createInnertube(!!sessionData.accessToken);
  const results = await innertube.music.search(q.trim(), { type: 'song' });

  const items: SearchResultItem[] = [];

  const contents = results.contents;
  if (!contents) return items;

  for (const section of contents) {
    if (!('contents' in section) || !Array.isArray(section.contents)) continue;

    for (const item of section.contents) {
      if (items.length >= 20) break;

      const id = 'id' in item && typeof item.id === 'string' ? item.id : null;

      const title =
        'title' in item && typeof item.title === 'string'
          ? item.title
          : 'name' in item && typeof item.name === 'string'
            ? item.name
            : '';

      const artist =
        'artists' in item && Array.isArray(item.artists) && item.artists.length > 0
          ? (item.artists[0] as { name: string }).name
          : 'author' in item && typeof item.author === 'string'
            ? item.author
            : '';

      const thumbnail =
        'thumbnails' in item && Array.isArray(item.thumbnails) && item.thumbnails.length > 0
          ? (item.thumbnails as Array<{ url: string; width?: number }>).sort(
              (a, b) => (b.width || 0) - (a.width || 0)
            )[0]?.url || ''
          : '';

      const duration =
        'duration' in item
          ? typeof item.duration === 'number'
            ? item.duration
            : typeof item.duration === 'object' &&
                item.duration !== null &&
                'seconds' in (item.duration as object)
              ? (item.duration as { seconds: number }).seconds
              : 0
          : 0;

      if (id && title) {
        items.push({
          videoId: id,
          title,
          artist,
          thumbnailUrl: thumbnail,
          durationSeconds: duration
        });
      }
    }

    if (items.length >= 20) break;
  }

  return items;
});
