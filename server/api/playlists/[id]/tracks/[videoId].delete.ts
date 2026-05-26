import type { ServerSession } from '../../../../types/auth.server.types';
import { PlaylistModel, type IPlaylistItem } from '../../../../models/Playlist';

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  const videoId = getRouterParam(event, 'videoId');
  if (!id || !videoId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing playlist ID or video ID' });
  }

  const playlist = await PlaylistModel.findOne({ _id: id, userId: sessionData.user.sub });
  if (!playlist) throw createError({ statusCode: 404, statusMessage: 'Playlist not found' });

  playlist.items = playlist.items.filter((item: IPlaylistItem) => item.videoId !== videoId);
  await playlist.save();

  return { success: true };
});
