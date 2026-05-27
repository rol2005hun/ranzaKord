import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingId') });

  const result = await PlaylistModel.deleteOne({ _id: id, userId: sessionData.user.sub });

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });
  }

  return { success: true };
});
