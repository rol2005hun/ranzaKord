import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';
import type { PlaylistResponse } from './index.get';

interface CreatePlaylistBody {
  name: string;
  description?: string;
  imageUrl?: string;
}

export default defineEventHandler(async (event): Promise<PlaylistResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<CreatePlaylistBody>(event);

  if (!body.name || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Playlist name is required' });
  }

  const playlist = await PlaylistModel.create({
    userId: sessionData.user.sub,
    name: body.name.trim(),
    description: body.description?.trim() || '',
    imageUrl: body.imageUrl || '',
    items: []
  });

  return {
    id: playlist._id.toString(),
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: playlist.imageUrl || '',
    trackCount: 0,
    trackIds: [],
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString()
  };
});
