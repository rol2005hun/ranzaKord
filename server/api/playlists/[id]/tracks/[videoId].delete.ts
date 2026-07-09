import type { H3Event } from 'h3';
import type { ServerSession } from '../../../../types/auth.server.types';
import { PlaylistModel, type IPlaylistItem } from '../../../../models/Playlist';

function resolveParam(event: H3Event, key: string): string | undefined {
  const routeParam = getRouterParam(event, key) ?? event.context.params?.[key];
  if (routeParam) {
    return routeParam;
  }

  const pathname = getRequestURL(event).pathname;
  const pathMatch = pathname.match(/\/api\/playlists\/([^/]+)\/tracks\/([^/]+)$/);
  if (!pathMatch) {
    return undefined;
  }

  return key === 'id' ? pathMatch[1] : pathMatch[2];
}

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
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

  const id = resolveParam(event, 'id');
  const videoId = resolveParam(event, 'videoId');
  if (!id || !videoId) {
    throw createError({ statusCode: 400, message: t('playlists.errors.missingParams') });
  }

  const playlist = await PlaylistModel.findOne({ _id: id });
  if (!playlist)
    throw createError({ statusCode: 404, message: t('playlists.errors.notFound') });

  const isOwner = playlist.userId === sessionData.user.sub;
  const isCollaborator = playlist.collaborators?.includes(sessionData.user.sub);

  if (!isOwner && !isCollaborator) {
    throw createError({ statusCode: 403, message: t('core.errors.unauthorized') });
  }

  // Find the track
  const trackIndex = playlist.items.findIndex((item: IPlaylistItem) => item.videoId === videoId);
  if (trackIndex === -1) {
    return { success: true };
  }

  const track = playlist.items[trackIndex];
  if (!track) {
    return { success: true };
  }

  // Collaborators can only delete their own tracks
  if (!isOwner && track.addedBy !== sessionData.user.sub) {
    throw createError({ statusCode: 403, message: t('core.errors.unauthorized') });
  }

  playlist.items.splice(trackIndex, 1);
  await playlist.save();

  return { success: true };
});
