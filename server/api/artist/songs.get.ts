import type { SearchResult } from '../../../app/features/search/types/search.types';
import { Parser } from 'youtubei.js';
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = query['q'] as string | undefined;
  const continuation = query['continuation'] as string | undefined;

  const { t } = useServerTranslation(event);

  if (!q && !continuation) {
    throw createError({ statusCode: 400, statusMessage: t('search.errors.missingQuery') });
  }

  const innertube = await createInnertube(false);

  type YTItem = {
    id?: string;
    browse_id?: string;
    endpoint?: {
      payload?: { videoId?: string; browseId?: string };
      metadata?: { pageType?: string };
    };
    title?: { toString: () => string };
    name?: { toString: () => string };
    type?: string;
    item_type?: string;
    authors?: Array<{ name?: string; channel_id?: string }>;
    artists?: Array<{ name?: string; channel_id?: string }>;
    author?: { name?: string; channel_id?: string } | string | { toString: () => string };
    thumbnails?: Array<{ url: string; width?: number }>;
    thumbnail?: { contents?: Array<{ url: string; width?: number }> };
    duration?: { seconds?: number } | number;
  };

  const parseItem = (rawItem: unknown): SearchResult | null => {
    const item = rawItem as YTItem;
    const id = item.id || item.browse_id || item.endpoint?.payload?.videoId;
    if (!id || typeof id !== 'string') return null;

    const title = item.title?.toString() || item.name?.toString() || '';
    if (!title) return null;

    let artistName = '';
    const extItem = item as unknown as {
      author?: { name?: string; channel_id?: string } | string | { toString: () => string };
    };
    const authorObj = extItem.author;
    if (item.authors && Array.isArray(item.authors) && item.authors.length > 0) {
      artistName = item.authors.map((a) => a.name).join(', ');
    } else if (item.artists && Array.isArray(item.artists) && item.artists.length > 0) {
      artistName = item.artists.map((a) => a.name).join(', ');
    } else if (authorObj && typeof authorObj === 'object' && 'name' in authorObj) {
      artistName = authorObj.name || '';
    } else if (
      authorObj &&
      typeof authorObj.toString === 'function' &&
      authorObj.toString() !== '[object Object]'
    ) {
      artistName = authorObj.toString();
    } else if (q) {
      artistName = q;
    }

    let artistId: string | undefined = undefined;
    if (item.artists?.[0]?.channel_id) {
      artistId = item.artists[0].channel_id;
    } else if (item.authors?.[0]?.channel_id) {
      artistId = item.authors[0].channel_id;
    }

    let thumbnail = '';
    const thumbs = item.thumbnails || item.thumbnail?.contents;
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      thumbnail = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
    }

    let duration = 0;
    if (
      item.duration &&
      typeof item.duration === 'object' &&
      'seconds' in item.duration &&
      item.duration.seconds
    ) {
      duration = item.duration.seconds;
    } else if (typeof item.duration === 'number') {
      duration = item.duration;
    }

    return {
      id,
      type: 'song',
      title,
      artist: artistName,
      artistId,
      thumbnailUrl: thumbnail,
      durationSeconds: duration
    };
  };

  const items: SearchResult[] = [];
  let nextContinuation: string | undefined = undefined;

  try {
    if (continuation) {
      const response = await innertube.actions.execute('/search', {
        continuation,
        client: 'YTMUSIC'
      });

      type ContinuationContents = {
        contents?: unknown[];
        continuation?: string;
      };

      const parsed = Parser.parseResponse(response.data);
      const contents = parsed.continuation_contents as ContinuationContents | undefined;
      if (contents?.contents) {
        for (const item of contents.contents) {
          const s = parseItem(item);
          if (s) {
            if (q && s.artist && !s.artist.toLowerCase().includes(q.toLowerCase())) {
              continue;
            }
            items.push(s);
          }
        }
      }
      nextContinuation = contents?.continuation || undefined;
    } else if (q) {
      type ShelfItem = {
        type: string;
        contents?: unknown[];
        continuation?: string;
      };

      const results = await innertube.music.search(q.trim(), { type: 'song' });
      const shelf = results.contents?.find((c) => (c as ShelfItem).type === 'MusicShelf') as
        | ShelfItem
        | undefined;

      if (shelf?.contents) {
        for (const item of shelf.contents) {
          const s = parseItem(item);
          if (s) {
            if (q && s.artist && !s.artist.toLowerCase().includes(q.toLowerCase())) {
              continue;
            }
            items.push(s);
          }
        }
      }
      nextContinuation = shelf?.continuation || undefined;
    }

    return {
      items,
      continuation: nextContinuation
    };
  } catch (error: unknown) {
    console.error('artist/songs.get.ts error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch artist songs.'
    });
  }
});
