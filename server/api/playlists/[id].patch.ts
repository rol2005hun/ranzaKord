import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';
import type { PlaylistDetailResponse } from './[id].get';

interface UpdatePlaylistBody {
  name?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
}

export default defineEventHandler(async (event): Promise<PlaylistDetailResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: t('playlists.errors.missingId') });

  const body = await readBody<UpdatePlaylistBody>(event);
  const updates: Record<string, string | boolean> = {};
  if (body?.name !== undefined) updates['name'] = body.name.trim();
  if (body?.description !== undefined) updates['description'] = body.description.trim();
  if (body?.imageUrl !== undefined) updates['imageUrl'] = body.imageUrl;
  if (body?.isPublic !== undefined) updates['isPublic'] = body.isPublic;

  const playlist = await PlaylistModel.findOneAndUpdate(
    { _id: id, userId: sessionData.user.sub },
    { $set: updates },
    { returnDocument: 'after' }
  ).lean();

  if (!playlist) {
    throw createError({ statusCode: 404, message: t('playlists.errors.notFound') });
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
    updatedAt: playlist.updatedAt.toISOString(),
    isPublic: playlist.isPublic !== false
  };
});
