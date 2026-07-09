import type { ArtistDetail, SearchResult } from '../../app/features/search/types/search.types';

export default defineCachedEventHandler(
  async (event): Promise<ArtistDetail> => {
    const query = getQuery(event);
    const id = query['id'] as string | undefined;

    const { t } = useServerTranslation(event);

    if (!id) {
      throw createError({ statusCode: 400, message: t('search.errors.missingArtistId') });
    }

    const innertube = await createInnertube(false);

    try {
      const artist = await innertube.music.getArtist(id);

      type YTHeader = {
        title?: { toString: () => string };
        description?: { toString: () => string };
      };

      type YTSection = {
        title?: { toString: () => string };
        contents?: Array<unknown>;
      };

      type YTItem = {
        id?: string;
        endpoint?: { payload?: { videoId?: string; browseId?: string } };
        title?: { toString: () => string };
        name?: { toString: () => string };
        authors?: Array<{ name?: string; channel_id?: string }>;
        thumbnails?: Array<{ url: string }>;
        duration?: { seconds?: number };
        type?: string;
      };

      const header = artist.header as YTHeader | undefined;

      const name = header?.title?.toString() || 'Unknown Artist';
      const description = header?.description?.toString() || '';

      let thumbnailUrl = '';

      const topSongs: SearchResult[] = [];
      const albums: SearchResult[] = [];

      if (artist.sections) {
        for (const rawSection of artist.sections) {
          const section = rawSection as YTSection;
          const title = section.title?.toString()?.toLowerCase() || '';

          if (title.includes('song') || title.includes('dal') || title.includes('top')) {
            if (section.contents) {
              for (const rawItem of section.contents) {
                const item = rawItem as YTItem;
                const videoId = item.id || item.endpoint?.payload?.videoId;
                if (!videoId) continue;

                const trackTitle = item.title?.toString() || item.name?.toString() || '';
                const trackArtist = item.authors?.[0]?.name || name;
                const trackArtistId = item.authors?.[0]?.channel_id || id;
                const trackThumb = item.thumbnails?.[0]?.url || '';

                if (!thumbnailUrl && trackThumb) thumbnailUrl = trackThumb;

                let duration = 0;
                if (item.duration?.seconds) duration = item.duration.seconds;

                topSongs.push({
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
          } else if (title.includes('album') || title.includes('single')) {
            if (section.contents) {
              for (const rawItem of section.contents) {
                const item = rawItem as YTItem;
                const browseId = item.id || item.endpoint?.payload?.browseId;
                if (!browseId) continue;

                const albumTitle = item.title?.toString() || item.name?.toString() || '';
                const albumThumb = item.thumbnails?.[0]?.url || '';

                if (!thumbnailUrl && albumThumb) thumbnailUrl = albumThumb;

                albums.push({
                  id: browseId,
                  type: 'album',
                  title: albumTitle,
                  artist: name,
                  thumbnailUrl: albumThumb
                });
              }
            }
          }
        }
      }

      return {
        id,
        name,
        description,
        thumbnailUrl,
        topSongs,
        albums
      };
    } catch (error: unknown) {
      console.error('artist.get.ts error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw createError({
        statusCode: 500,
        message: errorMessage || t('search.errors.fetchArtistFailed')
      });
    }
  },
  {
    maxAge: 60 * 60 * 12, // Cache for 12 hours
    name: 'artist-details',
    getKey: (event) => {
      const query = getQuery(event);
      return String(query['id'] || 'none');
    }
  }
);
