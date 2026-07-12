import type { SearchResult } from '../../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<SearchResult[]> => {
    const query = getQuery(event);
    const videoId = query['videoId'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!videoId) {
      throw createError({ statusCode: 400, message: t('search.errors.missingQuery') });
    }

    const innertube = await createInnertube(false);

    try {
      const upNext = await innertube.music.getUpNext(videoId);

      if (!upNext || !upNext.contents) {
        return [];
      }

      const results: SearchResult[] = [];

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

      interface YTVideoItem {
        type: string;
        video_id?: string;
        title?: { toString: () => string };
        author?: { toString: () => string };
        authors?: Array<{
          name: string;
          channel_id?: string;
          endpoint?: { payload?: { browseId?: string } };
        }>;
        thumbnails?: Array<{ url: string; width?: number; height?: number }>;
        duration?: { text: string; seconds?: number };
      }

      for (const item of upNext.contents) {
        const videoItem = item as unknown as YTVideoItem;
        if (videoItem.type !== 'PlaylistPanelVideo') continue;

        const vidId = videoItem.video_id;
        if (!vidId) continue;

        const title = firstNonEmptyString(videoItem.title?.toString());
        if (!title) continue;

        const artists = extractArtists(
          videoItem.author?.toString(),
          Array.isArray(videoItem.authors) ? videoItem.authors : undefined
        );
        const primaryArtist = artists[0]?.name || '';
        const primaryArtistId = artists[0]?.id || '';

        const thumb = Array.isArray(videoItem.thumbnails)
          ? videoItem.thumbnails.sort(
              (a: { width?: number }, b: { width?: number }) => (b.width || 0) - (a.width || 0)
            )[0]?.url
          : undefined;

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
          id: vidId as string,
          type: 'song',
          title: title as string,
          artist: primaryArtist,
          artistId: primaryArtistId,
          artists,
          thumbnailUrl: thumb || '',
          durationSeconds: durationSecs
        });
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
    maxAge: 60 * 60, // 1 hour
    name: 'related-search',
    getKey: (event) => {
      const query = getQuery(event);
      return `related-${query['videoId']}`;
    }
  }
);
