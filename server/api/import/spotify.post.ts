export default defineEventHandler(async (event) => {
  const { t } = useServerTranslation(event);
  const body = await readBody<{ url?: string }>(event);
  const url = body?.url;

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

    const tracks = spotifyTracks
      .filter((track): track is { name: string; artist?: string } => !!track && !!track.name)
      .map((track) => ({
        title: track.name,
        artist: track.artist || 'Unknown Artist',
        videoId: '',
        thumbnailUrl: '',
        durationSeconds: 0
      }));

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
