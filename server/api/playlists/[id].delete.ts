import type { H3Event } from 'h3';
import type { ServerSession } from '../../types/auth.server.types';
import mongoose from 'mongoose';
import { PlaylistModel } from '../../models/Playlist';

function resolvePlaylistId(event: H3Event): string | undefined {
  const queryId = getQuery(event).id;
  if (typeof queryId === 'string' && queryId.length > 0) {
    return queryId;
  }

  const routeId = getRouterParam(event, 'id') ?? event.context.params?.id;
  if (routeId) {
    return routeId;
  }

  const pathname = getRequestURL(event).pathname;
  const pathMatch = pathname.match(/\/api\/playlists\/([^/]+)$/);
  return pathMatch?.[1];
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

  const id = resolvePlaylistId(event);
  if (!id) throw createError({ statusCode: 400, message: t('playlists.errors.missingId') });

  if (!mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 404, message: t('playlists.errors.notFound') });
  }

  const result = await PlaylistModel.deleteOne({ _id: id, userId: sessionData.user.sub });

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: t('playlists.errors.notFound') });
  }

  return { success: true };
});
