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
    const playlist = await innertube.music.getPlaylist(playlistId);

    if (!playlist || !playlist.items) {
      throw createError({
        statusCode: 404,
        statusMessage: t('playlists.errors.notFound')
      });
    }

    interface YtHeader {
      title?: { toString: () => string };
      description?: unknown;
      thumbnails?: Array<{ url: string; width?: number; height?: number }>;
    }

    const header = playlist.header as unknown as YtHeader | undefined;
    const title = header?.title?.toString() || 'Imported Playlist';

    let description = '';
    const rawDesc = header?.description as
      | { description?: { text?: string }; toString?: () => string }
      | undefined;
    if (rawDesc) {
      if (rawDesc.description?.text) {
        description = rawDesc.description.text;
      } else if (
        typeof rawDesc.toString === 'function' &&
        rawDesc.toString() !== '[object Object]'
      ) {
        description = rawDesc.toString();
      }
    }

    // Try to get thumbnail from header, if not available use first track's thumbnail
    let coverUrl = '';
    const headerThumbnails = header?.thumbnails || [];
    if (headerThumbnails && headerThumbnails.length > 0) {
      coverUrl = headerThumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
    }

    const tracks: Track[] = [];

    let currentPlaylist = playlist;
    const items = [...(playlist.items || [])];

    while (currentPlaylist.has_continuation) {
      currentPlaylist = await currentPlaylist.getContinuation();
      if (currentPlaylist.items) {
        items.push(...currentPlaylist.items);
      }
    }

    interface YtAuthor {
      name?: string;
      channel_id?: string;
    }

    interface YtVideoItem {
      id?: string;
      title?: string | { text: string } | { toString: () => string };
      thumbnails?: Array<{ url: string; width?: number; height?: number }>;
      duration?: number | { seconds?: number };
      authors?: YtAuthor[];
      artists?: YtAuthor[];
      author?:
        | YtAuthor
        | YtAuthor[]
        | { toString: () => string; name?: string; channel_id?: string };
    }

    for (const item of items) {
      const video = item as unknown as YtVideoItem;
      if (!video.id) continue;

      const trackThumbnails = video.thumbnails || [];
      const bestThumbnail = trackThumbnails.length
        ? trackThumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || ''
        : '';

      if (!coverUrl && bestThumbnail) {
        coverUrl = bestThumbnail;
      }

      let durationSeconds = 0;
      if (video.duration && typeof video.duration === 'object' && 'seconds' in video.duration) {
        durationSeconds = video.duration.seconds || 0;
      } else if (typeof video.duration === 'number') {
        durationSeconds = video.duration;
      }

      function buildArtistName(authors: { name?: string }[]): string {
        const names = authors.map((a) => a.name || '').filter(Boolean);
        if (names.length === 0) return 'Unknown Artist';
        if (names.length === 1) return names[0] as string;
        return `${names[0]} feat. ${names.slice(1).join(', ')}`;
      }

      let artistName = 'Unknown Artist';
      if (video.authors && Array.isArray(video.authors) && video.authors.length > 0) {
        artistName = buildArtistName(video.authors);
      } else if (video.artists && Array.isArray(video.artists) && video.artists.length > 0) {
        artistName = buildArtistName(video.artists);
      } else if (video.author && typeof video.author === 'object' && 'name' in video.author) {
        artistName = video.author.name || '';
      } else if (
        video.author &&
        typeof video.author.toString === 'function' &&
        video.author.toString() !== '[object Object]'
      ) {
        artistName = video.author.toString();
      }

      let artistId: string | undefined = undefined;
      if (video.artists?.[0]?.channel_id) {
        artistId = video.artists[0].channel_id;
      } else if (video.authors?.[0]?.channel_id) {
        artistId = video.authors[0].channel_id;
      } else if (
        video.author &&
        typeof video.author === 'object' &&
        'channel_id' in video.author &&
        !Array.isArray(video.author)
      ) {
        artistId = video.author.channel_id;
      }

      let videoTitle = 'Unknown Title';
      if (typeof video.title === 'string') {
        videoTitle = video.title;
      } else if (video.title && typeof video.title === 'object' && 'text' in video.title) {
        videoTitle = video.title.text;
      } else if (video.title && typeof video.title.toString === 'function') {
        videoTitle = video.title.toString();
      }

      const rawAuthors =
        video.authors && Array.isArray(video.authors) && video.authors.length > 0
          ? video.authors
          : video.artists && Array.isArray(video.artists) && video.artists.length > 0
            ? video.artists
            : [];

      const artistsList = rawAuthors.map((a) => ({
        name: a.name || 'Unknown Artist',
        channelId: a.channel_id
      }));

      tracks.push({
        videoId: video.id,
        title: videoTitle,
        artist: artistName || 'Unknown Artist',
        artistId,
        artists: artistsList,
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
