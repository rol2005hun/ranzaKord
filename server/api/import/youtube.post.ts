import { createInnertube } from '../../utils/innertube';
import type { Track } from '../../../app/features/player/types/player.types';

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
    const playlistId = new URL(url).searchParams.get('list');
    if (!playlistId) {
      throw createError({
        statusCode: 400,
        statusMessage: t('playlists.errors.missingUrl')
      });
    }

    const innertube = await createInnertube(false);
    const playlist = await innertube.getPlaylist(playlistId);

    if (!playlist || !playlist.items) {
      throw createError({
        statusCode: 404,
        statusMessage: t('playlists.errors.notFound')
      });
    }

    const title = playlist.info.title || 'Imported Playlist';
    const description = playlist.info.description || '';

    const thumbnails = playlist.info.thumbnails;
    const coverUrl =
      thumbnails && thumbnails.length > 0
        ? thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || ''
        : '';

    const tracks: Track[] = [];

    let currentPlaylist = playlist;
    const items = [...(playlist.items || [])];

    while (currentPlaylist.has_continuation) {
      currentPlaylist = await currentPlaylist.getContinuation();
      if (currentPlaylist.items) {
        items.push(...currentPlaylist.items);
      }
    }

    for (const item of items) {
      if (item.type !== 'PlaylistVideo' && item.type !== 'Video' && item.type !== 'MusicTrack')
        continue;

      interface YtVideoResult {
        id?: string;
        title?: { text: string } | string;
        author?: { name: string };
        artists?: { name: string }[];
        duration?: { seconds: number };
        thumbnails?: { url: string; width: number; height: number }[];
      }

      const video = item as unknown as YtVideoResult;

      if (!video.id) continue;

      const trackThumbnails = video.thumbnails || [];
      const bestThumbnail = trackThumbnails.length
        ? trackThumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || ''
        : '';

      let durationSeconds = 0;
      if (video.duration && video.duration.seconds) {
        durationSeconds = video.duration.seconds;
      }

      let artist = 'Unknown Artist';
      if (video.author && video.author.name) {
        artist = video.author.name;
      } else if (video.artists && video.artists.length > 0) {
        artist = video.artists.map((a) => a.name).join(', ');
      }

      tracks.push({
        videoId: video.id,
        title:
          ((typeof video.title === 'object' && video.title !== null && 'text' in video.title
            ? video.title.text
            : video.title) as string) || 'Unknown Title',
        artist: artist,
        thumbnailUrl: bestThumbnail,
        durationSeconds: durationSeconds
      });
    }

    return {
      name: title,
      description,
      imageUrl: coverUrl,
      tracks
    };
  } catch (error) {
    const err = error as { message?: string; statusCode?: number; statusMessage?: string };
    console.error('Failed to import YouTube playlist:', err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || t('playlists.errors.import')
    });
  }
});
