import { TrackStatModel } from '../../models/TrackStat';
import type { ServerSession } from '../../types/auth.server.types';
import type { SearchResult } from '../../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<SearchResult[]> => {
    const session = await useAppSession(event);
    const sessionData = session.data as Partial<ServerSession>;
    const { t } = useServerTranslation(event);

    if (!sessionData.user) {
      throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
    }

    const userId = sessionData.user.sub;

    // 1. Get the user's top 3 tracks with most plays and fewest skips
    const stats = await TrackStatModel.find({ userId })
      .sort({ playCount: -1, skipCount: 1 })
      .limit(3)
      .lean();

    const innertube = await createInnertube(false);

    type YTItem = {
      id?: string;
      endpoint?: { payload?: { videoId?: string } };
      title?: { toString: () => string };
      name?: { toString: () => string };
      authors?: Array<{ name?: string }>;
      artists?: Array<{ name?: string }>;
      author?: { name?: string } | Array<{ name?: string }> | string | { toString: () => string };
      subtitle?: { name?: string } | Array<{ name?: string }> | string | { toString: () => string };
      thumbnails?: Array<{ url: string; width?: number }>;
      thumbnail?:
        | { contents?: Array<{ url: string; width?: number }> }
        | Array<{ url: string; width?: number }>;
      duration?: { seconds?: number } | number;
    };

    if (!stats.length) {
      // 2. Fallback: If no history, fetch a generic "Charts" or "Top Hits" playlist
      try {
        const results = await innertube.music.search('top hits', { type: 'song' });
        const items: SearchResult[] = [];
        if (results.contents) {
          for (const section of results.contents) {
            if (!('contents' in section) || !Array.isArray(section.contents)) continue;
            for (const rawItem of section.contents) {
              const item = rawItem as YTItem;
              const videoId = item.id || item.endpoint?.payload?.videoId;
              if (videoId) {
                let artistName = 'Unknown';
                if (item.authors?.[0]?.name) {
                  artistName = item.authors[0].name;
                } else if (
                  item.author &&
                  typeof item.author === 'object' &&
                  'name' in item.author &&
                  !Array.isArray(item.author)
                ) {
                  artistName = item.author.name || 'Unknown';
                } else if (Array.isArray(item.author) && item.author[0]?.name) {
                  artistName = item.author[0].name;
                } else if (
                  item.author &&
                  typeof item.author.toString === 'function' &&
                  item.author.toString() !== '[object Object]'
                ) {
                  artistName = item.author.toString();
                } else if (item.artists?.[0]?.name) {
                  artistName = item.artists[0].name;
                } else if (
                  item.subtitle &&
                  typeof item.subtitle === 'object' &&
                  'name' in item.subtitle &&
                  !Array.isArray(item.subtitle)
                ) {
                  artistName = item.subtitle.name || 'Unknown';
                } else if (Array.isArray(item.subtitle) && item.subtitle[0]?.name) {
                  artistName = item.subtitle[0].name;
                } else if (
                  item.subtitle &&
                  typeof item.subtitle.toString === 'function' &&
                  item.subtitle.toString() !== '[object Object]'
                ) {
                  artistName = item.subtitle.toString();
                }

                let thumbnail = '';
                const thumbs =
                  item.thumbnails || (item.thumbnail as Record<string, unknown>)?.contents;
                if (Array.isArray(thumbs) && thumbs.length > 0) {
                  thumbnail = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
                }

                items.push({
                  id: String(videoId),
                  type: 'song',
                  title: String(item.title?.toString() || 'Unknown'),
                  artist: String(artistName),
                  thumbnailUrl: String(thumbnail),
                  durationSeconds: Number(
                    (typeof item.duration === 'object' && item.duration
                      ? item.duration.seconds
                      : item.duration) || 0
                  )
                });
              }
              if (items.length >= 10) break;
            }
          }
        }
        return items;
      } catch {
        return [];
      }
    }

    // 3. User has history: use getUpNext based on a random top track
    const randomTopTrack = stats[Math.floor(Math.random() * stats.length)];
    if (!randomTopTrack) return [];

    try {
      const upNext = await innertube.music.getUpNext(randomTopTrack.trackId);
      const items: SearchResult[] = [];

      if (upNext.contents) {
        for (const rawItem of upNext.contents) {
          const item = rawItem as YTItem;
          const videoId = item.id || item.endpoint?.payload?.videoId;
          if (videoId && videoId !== randomTopTrack.trackId) {
            let artistName = 'Unknown';
            if (item.authors?.[0]?.name) {
              artistName = item.authors[0].name;
            } else if (
              item.author &&
              typeof item.author === 'object' &&
              'name' in item.author &&
              !Array.isArray(item.author)
            ) {
              artistName = item.author.name || 'Unknown';
            } else if (Array.isArray(item.author) && item.author[0]?.name) {
              artistName = item.author[0].name;
            } else if (
              item.author &&
              typeof item.author.toString === 'function' &&
              item.author.toString() !== '[object Object]'
            ) {
              artistName = item.author.toString();
            } else if (item.artists?.[0]?.name) {
              artistName = item.artists[0].name;
            } else if (
              item.subtitle &&
              typeof item.subtitle === 'object' &&
              'name' in item.subtitle &&
              !Array.isArray(item.subtitle)
            ) {
              artistName = item.subtitle.name || 'Unknown';
            } else if (Array.isArray(item.subtitle) && item.subtitle[0]?.name) {
              artistName = item.subtitle[0].name;
            } else if (
              item.subtitle &&
              typeof item.subtitle.toString === 'function' &&
              item.subtitle.toString() !== '[object Object]'
            ) {
              artistName = item.subtitle.toString();
            }

            let thumbnail = '';
            const thumbs =
              item.thumbnails ||
              (item.thumbnail as Record<string, unknown>)?.contents ||
              item.thumbnail;
            if (Array.isArray(thumbs) && thumbs.length > 0) {
              thumbnail = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
            }

            items.push({
              id: String(videoId),
              type: 'song',
              title: String(item.title?.toString() || 'Unknown'),
              artist: String(artistName),
              thumbnailUrl: String(thumbnail),
              durationSeconds: Number(
                (typeof item.duration === 'object' && item.duration
                  ? item.duration.seconds
                  : item.duration) || 0
              )
            });
          }
          if (items.length >= 15) break;
        }
      }
      return items;
    } catch (e) {
      console.error('Failed to fetch UpNext for featured tracks:', e);
      return [];
    }
  },
  {
    maxAge: 60 * 60 * 2, // 2 hours cache
    name: 'featured-tracks',
    getKey: async (event) => {
      const session = await useAppSession(event);
      return `user-${session.data.user?.sub || 'guest'}`;
    }
  }
);
