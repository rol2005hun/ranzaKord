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
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const body = await readBody<Partial<CreatePlaylistBody>>(event);

  if (!body?.name) {
    throw createError({ statusCode: 400, message: t('playlists.errors.missingName') });
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
