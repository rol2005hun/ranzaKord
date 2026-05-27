import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';
import type { PlaylistDetailResponse } from './[id].get';

interface UpdatePlaylistBody {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export default defineEventHandler(async (event): Promise<PlaylistDetailResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing playlist ID' });

  const body = await readBody<UpdatePlaylistBody>(event);
  const updates: Record<string, string> = {};
  if (body.name !== undefined) updates['name'] = body.name.trim();
  if (body.description !== undefined) updates['description'] = body.description.trim();
  if (body.imageUrl !== undefined) updates['imageUrl'] = body.imageUrl;

  const playlist = await PlaylistModel.findOneAndUpdate(
    { _id: id, userId: sessionData.user.sub },
    { $set: updates },
    { returnDocument: 'after' }
  ).lean();

  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: 'Playlist not found' });
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
