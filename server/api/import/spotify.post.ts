import { createInnertube } from '../../utils/innertube';
import type { Track } from '../../../app/features/player/types/player.types';

export default defineEventHandler(async (event) => {
  const { t } = useServerTranslation(event);
  const body = await readBody(event);
  const { url } = body;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: t('playlists.errors.missingUrl')
    });
  }

  try {
    const _spotifyUrlInfo = await import('spotify-url-info');
    const spotifyUrlInfo = ((_spotifyUrlInfo as Record<string, unknown>).default ||
      _spotifyUrlInfo) as (f: typeof fetch) => {
      getPreview: (
        url: string
      ) => Promise<{ title?: string; description?: string; image?: string }>;
      getTracks: (url: string) => Promise<{ name?: string; artist?: string }[]>;
    };
    const { getPreview, getTracks } = spotifyUrlInfo(globalThis.fetch);

    const preview = await getPreview(url);
    const spotifyTracks = await getTracks(url);

    if (!preview || !spotifyTracks) {
      throw createError({
        statusCode: 404,
        statusMessage: t('playlists.errors.notFound')
      });
    }

    const title = preview.title || 'Imported Spotify Playlist';
    const description = preview.description || '';
    const coverUrl = preview.image || '';

    const tracks: Track[] = [];
    const innertube = await createInnertube(false);

    const itemsToProcess = spotifyTracks;

    for (const track of itemsToProcess) {
      if (!track || !track.name) continue;

      const artistNames = track.artist || 'Unknown Artist';
      const searchQuery = `${track.name} ${artistNames}`;

      try {
        const searchResults = await innertube.search(searchQuery, { type: 'video' });

        interface YtVideoResult {
          type: string;
          id?: string;
          title?: { text: string } | string;
          author?: { name: string };
          duration?: { seconds: number };
          thumbnails?: { url: string; width: number; height: number }[];
        }

        const firstResult = searchResults.results?.[0] as unknown as YtVideoResult;

        if (firstResult && firstResult.type === 'Video' && typeof firstResult.id === 'string') {
          const trackThumbnails = firstResult.thumbnails || [];
          const bestThumbnail = trackThumbnails.length
            ? trackThumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || ''
            : '';

          let durationSeconds = 0;
          if (firstResult.duration && firstResult.duration.seconds) {
            durationSeconds = firstResult.duration.seconds;
          }

          tracks.push({
            videoId: firstResult.id,
            title:
              ((typeof firstResult.title === 'object' &&
              firstResult.title !== null &&
              'text' in firstResult.title
                ? firstResult.title.text
                : firstResult.title) as string) || track.name,
            artist: firstResult.author?.name || artistNames,
            thumbnailUrl: bestThumbnail,
            durationSeconds: durationSeconds
          });
        }
      } catch (err) {
        console.error(`Failed to find match for: ${searchQuery}`, err);
      }
    }

    return {
      name: title,
      description,
      imageUrl: coverUrl,
      tracks
    };
  } catch (error) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string };
    console.error('Failed to import Spotify playlist:', err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || t('playlists.errors.import')
    });
  }
});
