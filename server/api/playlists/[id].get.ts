import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';

export interface PlaylistTrackResponse {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationMs: number;
  addedAt: string;
}

export interface PlaylistDetailResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tracks: PlaylistTrackResponse[];
  trackCount: number;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export default defineEventHandler(async (event): Promise<PlaylistDetailResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingId') });

  const playlist = await PlaylistModel.findOne({
    _id: id,
    userId: sessionData.user.sub
  }).lean();

  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });
  }

  return {
    id: (playlist._id as { toString(): string }).toString(),
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: playlist.imageUrl || '',
    tracks: playlist.items.map((item) => ({
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      thumbnailUrl: item.thumbnailUrl,
      durationMs: item.durationMs,
      addedAt: item.addedAt.toISOString()
    })),
    trackCount: playlist.items.length,
    trackIds: playlist.items.map((i: { videoId: string }) => i.videoId),
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString()
  };
});
