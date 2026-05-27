import type { ServerSession } from '../types/auth.server.types';
import type { AlbumDetail, SearchResult } from '../../app/features/search/types/search.types';

export default defineEventHandler(async (event): Promise<AlbumDetail> => {
  const query = getQuery(event);
  const id = query['id'] as string | undefined;

  const { t } = useServerTranslation(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: t('search.errors.missingAlbumId') });
  }

  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  const innertube = await createInnertube(!!sessionData.accessToken);

  try {
    const album = await innertube.music.getAlbum(id);

    type YTHeader = {
      title?: { toString: () => string };
      author?: { name?: string };
      year?: string;
      thumbnails?: Array<{ url: string; width?: number }>;
      thumbnail?: { contents?: Array<{ url: string; width?: number }> };
    };

    type YTItem = {
      id?: string;
      endpoint?: { payload?: { videoId?: string } };
      title?: { toString: () => string };
      name?: { toString: () => string };
      authors?: Array<{ name?: string }>;
      thumbnails?: Array<{ url: string }>;
      duration?: { seconds?: number };
    };

    const header = album.header as YTHeader | undefined;

    const title = header?.title?.toString() || 'Unknown Album';
    const artist = header?.author?.name || 'Unknown Artist';
    const year = header?.year || '';

    let thumbnailUrl = '';
    const thumbs = header?.thumbnails || header?.thumbnail?.contents;
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      thumbnailUrl = thumbs.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
    }

    const tracks: SearchResult[] = [];

    if (album.contents) {
      for (const rawItem of album.contents) {
        const item = rawItem as YTItem;
        const videoId = item.id || item.endpoint?.payload?.videoId;
        if (!videoId) continue;

        const trackTitle = item.title?.toString() || item.name?.toString() || '';
        const trackArtist = item.authors?.[0]?.name || artist;
        const trackThumb = item.thumbnails?.[0]?.url || thumbnailUrl;

        let duration = 0;
        if (item.duration?.seconds) duration = item.duration.seconds;

        tracks.push({
          id: videoId,
          type: 'song',
          title: trackTitle,
          artist: trackArtist,
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
});
