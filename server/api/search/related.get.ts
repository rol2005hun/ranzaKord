import type { SearchResult } from '../../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<SearchResult[]> => {
    const query = getQuery(event);
    const videoId = query['videoId'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!videoId || videoId === 'undefined') {
      throw createError({ statusCode: 400, message: t('search.errors.missingQuery') });
    }

    const innertube = await createInnertube(false);

    try {
      const results: SearchResult[] = [];
      const seenIds = new Set<string>([videoId]);

      function firstNonEmptyString(...values: Array<string | undefined>): string | undefined {
        return values.find((value) => typeof value === 'string' && value.trim().length > 0);
      }

      function extractArtists(
        authorStr?: string,
        authorsArr?: Array<{
          name: string;
          channel_id?: string;
          endpoint?: { payload?: { browseId?: string } };
        }>
      ): Array<{ name: string; id?: string }> {
        if (authorsArr && authorsArr.length > 0) {
          return authorsArr.map((a) => ({
            name: a.name,
            id: a.channel_id || a.endpoint?.payload?.browseId
          }));
        }
        if (authorStr) {
          return authorStr
            .split(/,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i)
            .map((s) => ({ name: s.trim() }))
            .filter((a) => a.name);
        }
        return [];
      }

      function formatThumbnailUrl(url?: string): string {
        if (!url) return '';
        if (url.includes('=w')) {
          return url.replace(/=w\d+-h\d+[^$]*/, '=w544-h544-l90-rj');
        }
        if (url.includes('=s') && url.includes('googleusercontent.com')) {
          return url.replace(/=s\d+[^$]*/, '=s576');
        }
        return url;
      }

      interface RelatedItem {
        type?: string;
        item_type?: string;
        id?: string;
        video_id?: string;
        title?: { toString: () => string } | string;
        author?: { toString: () => string } | string;
        artists?: Array<{
          name: string;
          channel_id?: string;
          endpoint?: { payload?: { browseId?: string } };
        }>;
        thumbnails?: Array<{ url: string; width?: number; height?: number }>;
        thumbnail?:
          | { contents?: Array<{ url: string; width?: number; height?: number }> }
          | Array<{ url: string; width?: number; height?: number }>;
        duration?: { text?: string; seconds?: number };
      }

      interface RelatedShelf {
        type?: string;
        contents?: RelatedItem[];
      }

      try {
        const related = (await innertube.music.getRelated(videoId)) as {
          contents?: RelatedShelf[];
        };
        if (related && related.contents) {
          for (const shelf of related.contents) {
            if (shelf.contents && Array.isArray(shelf.contents)) {
              for (const item of shelf.contents) {
                const vidId = item.id || item.video_id;
                if (!vidId || seenIds.has(vidId)) continue;
                if (item.item_type !== 'song' && item.type !== 'MusicResponsiveListItem') continue;

                const title = firstNonEmptyString(
                  typeof item.title === 'string' ? item.title : item.title?.toString()
                );
                if (!title) continue;

                seenIds.add(vidId);

                const artists = extractArtists(
                  typeof item.author === 'string' ? item.author : item.author?.toString(),
                  Array.isArray(item.artists) ? item.artists : undefined
                );
                const primaryArtist = artists[0]?.name || '';
                const primaryArtistId = artists[0]?.id || '';

                const rawThumbs =
                  item.thumbnails ||
                  (item.thumbnail as { contents?: Array<{ url: string; width?: number }> })
                    ?.contents ||
                  (Array.isArray(item.thumbnail) ? item.thumbnail : undefined);

                const thumb =
                  (Array.isArray(rawThumbs) && rawThumbs.length > 0
                    ? rawThumbs[0]?.url
                    : undefined) || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

                results.push({
                  id: vidId,
                  type: 'song',
                  title,
                  artist: primaryArtist,
                  artistId: primaryArtistId,
                  artists,
                  thumbnailUrl: formatThumbnailUrl(thumb),
                  durationSeconds: item.duration?.seconds || 0
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('music.getRelated failed, falling back to getUpNext:', err);
      }

      if (results.length < 5) {
        try {
          const upNext = await innertube.music.getUpNext(videoId);
          if (upNext && upNext.contents) {
            for (const item of upNext.contents) {
              const videoItem = item as unknown as RelatedItem;
              if (videoItem.type !== 'PlaylistPanelVideo') continue;

              const vidId = videoItem.video_id;
              if (!vidId || seenIds.has(vidId)) continue;

              const title = firstNonEmptyString(videoItem.title?.toString());
              if (!title) continue;

              seenIds.add(vidId);

              const artists = extractArtists(
                videoItem.author?.toString(),
                Array.isArray(videoItem.artists) ? videoItem.artists : undefined
              );
              const primaryArtist = artists[0]?.name || '';
              const primaryArtistId = artists[0]?.id || '';

              const rawThumbs =
                videoItem.thumbnails ||
                (videoItem.thumbnail as { contents?: Array<{ url: string; width?: number }> })
                  ?.contents ||
                (Array.isArray(videoItem.thumbnail) ? videoItem.thumbnail : undefined);
              const thumb =
                (Array.isArray(rawThumbs) && rawThumbs.length > 0
                  ? rawThumbs.sort(
                      (a: { width?: number }, b: { width?: number }) =>
                        (b.width || 0) - (a.width || 0)
                    )[0]?.url
                  : undefined) || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

              let durationSecs = 0;
              if (videoItem.duration && typeof videoItem.duration.seconds === 'number') {
                durationSecs = videoItem.duration.seconds;
              } else if (videoItem.duration && typeof videoItem.duration.text === 'string') {
                const parts = videoItem.duration.text.split(':').map(Number);
                if (parts.length === 2) durationSecs = (parts[0] || 0) * 60 + (parts[1] || 0);
                else if (parts.length === 3)
                  durationSecs = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
              }

              results.push({
                id: vidId,
                type: 'song',
                title,
                artist: primaryArtist,
                artistId: primaryArtistId,
                artists,
                thumbnailUrl: formatThumbnailUrl(thumb),
                durationSeconds: durationSecs
              });
            }
          }
        } catch (err) {
          console.warn('music.getUpNext fallback failed:', err);
        }
      }

      return results;
    } catch (e) {
      console.error('Related API error:', e);
      throw createError({
        statusCode: 500,
        message: t('search.errors.failedToFetch')
      });
    }
  },
  {
    maxAge: 60 * 60,
    name: 'related-search',
    getKey: (event) => {
      const query = getQuery(event);
      return `related-${query['videoId']}`;
    }
  }
);
