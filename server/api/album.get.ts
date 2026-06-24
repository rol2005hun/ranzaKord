import type { AlbumDetail, SearchResult } from '../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<AlbumDetail> => {
    const query = getQuery(event);
    const id = query['id'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: t('search.errors.missingAlbumId') });
    }

    const innertube = await createInnertube(false);

    try {
      const album = await innertube.music.getAlbum(id);

      function firstNonEmptyString(...values: Array<string | undefined>): string | undefined {
        return values.find((value) => typeof value === 'string' && value.trim().length > 0);
      }

      type YTHeader = {
        title?: { toString: () => string };
        author?: { name?: string; channel_id?: string };
        artists?: Array<{ name?: string; channel_id?: string }>;
        year?: string;
        thumbnails?: Array<{ url: string; width?: number }>;
        thumbnail?: { contents?: Array<{ url: string; width?: number }> };
        subtitle?: { toString: () => string };
        strapline_text_one?: { toString: () => string };
      };

      type YTItem = {
        id?: string;
        endpoint?: { payload?: { videoId?: string } };
        title?: { toString: () => string };
        name?: { toString: () => string };
        authors?: Array<{ name?: string; channel_id?: string }>;
        thumbnails?: Array<{ url: string }>;
        duration?: { seconds?: number };
        flex_columns?: Array<{
          title?: {
            runs?: Array<{
              endpoint?: { payload?: { videoId?: string } };
            }>;
          };
        }>;
      };

      const header = album.header as YTHeader | undefined;

      const title = header?.title?.toString() || 'Unknown Album';
      const artist =
        firstNonEmptyString(
          header?.author?.name,
          header?.artists?.[0]?.name,
          header?.strapline_text_one?.toString(),
          album.contents?.[0] ? (album.contents[0] as YTItem).authors?.[0]?.name : undefined
        ) || 'Unknown Artist';

      const albumArtistId = header?.author?.channel_id || '';

      // Attempt to extract year from subtitle if not provided
      let year = header?.year || '';
      if (!year && header?.subtitle) {
        const sub = header.subtitle.toString();
        const match = sub.match(/\b(19|20)\d{2}\b/);
        if (match) year = match[0];
      }

      let thumbnailUrl = '';
      const thumbs = header?.thumbnails || header?.thumbnail?.contents;
      if (Array.isArray(thumbs) && thumbs.length > 0) {
        thumbnailUrl = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
      }

      const tracks: SearchResult[] = [];

      if (album.contents) {
        for (const rawItem of album.contents) {
          const item = rawItem as YTItem;
          const videoId =
            item.id ||
            item.endpoint?.payload?.videoId ||
            item.flex_columns?.[0]?.title?.runs?.[0]?.endpoint?.payload?.videoId;
          if (!videoId) continue;

          const trackTitle = item.title?.toString() || item.name?.toString() || '';
          const trackArtist =
            firstNonEmptyString(item.authors?.[0]?.name, header?.author?.name, artist) || artist;
          const trackThumb = item.thumbnails?.[0]?.url || thumbnailUrl;
          const trackArtistId = item.authors?.[0]?.channel_id || albumArtistId;

          let duration = 0;
          if (item.duration?.seconds) duration = item.duration.seconds;

          tracks.push({
            id: videoId,
            type: 'song',
            title: trackTitle,
            artist: trackArtist,
            artistId: trackArtistId,
            thumbnailUrl: trackThumb,
            durationSeconds: duration
          });
        }
      }

      return {
        id,
        title,
        artist,
        thumbnailUrl,
        year,
        tracks
      };
    } catch {
      throw createError({ statusCode: 500, statusMessage: t('search.errors.fetchAlbumFailed') });
    }
  },
  {
    maxAge: 60 * 60 * 24, // Cache for 24 hours
    name: 'album-details',
    getKey: (event) => {
      const query = getQuery(event);
      return String(query['id'] || 'none');
    }
  }
);
