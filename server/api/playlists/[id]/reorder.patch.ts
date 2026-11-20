import { PlaylistModel } from '../../../models/Playlist';
import { useAppSession } from '../../../utils/session';

import type { ServerSession } from '../../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Playlist ID is required'
    });
  }

  const body = (await readBody(event)) as { fromIndex: number; toIndex: number };
  const { fromIndex, toIndex } = body;

  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'fromIndex and toIndex are required and must be numbers'
    });
  }

  const playlist = await PlaylistModel.findOne({ _id: id, userId: sessionData.user.sub });

  if (!playlist) {
    throw createError({
      statusCode: 404,
      message: 'Playlist not found'
    });
  }

  if (fromIndex < 0 || fromIndex >= playlist.items.length) {
    throw createError({
      statusCode: 400,
      message: 'fromIndex out of bounds'
    });
  }

  if (toIndex < 0 || toIndex >= playlist.items.length) {
    throw createError({
      statusCode: 400,
      message: 'toIndex out of bounds'
    });
  }

  if (fromIndex === toIndex) {
    return { success: true };
  }

  const item = playlist.items.splice(fromIndex, 1)[0];
  if (item) {
    playlist.items.splice(toIndex, 0, item);
    playlist.updatedAt = new Date();
    await playlist.save();
  }

  return { success: true };
});
