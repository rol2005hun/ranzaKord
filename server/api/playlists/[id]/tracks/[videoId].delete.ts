import type { ServerSession } from '../../../../types/auth.server.types';
import { PlaylistModel, type IPlaylistItem } from '../../../../models/Playlist';

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  const videoId = getRouterParam(event, 'videoId');
  if (!id || !videoId) {
    throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingParams') });
  }

  const playlist = await PlaylistModel.findOne({ _id: id, userId: sessionData.user.sub });
  if (!playlist)
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });

  playlist.items = playlist.items.filter((item: IPlaylistItem) => item.videoId !== videoId);
  await playlist.save();

  return { success: true };
});
