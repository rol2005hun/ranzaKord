import type { ServerSession } from '../../../types/auth.server.types';
import { PlaylistModel } from '../../../models/Playlist';

interface AddTrackBody {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnailUrl: string;
  durationMs: number;
}

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

  const body = await readBody<Partial<AddTrackBody>>(event);
  if (!body?.videoId || !body.title) {
    throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingTrackInfo') });
  }

  const playlist = await PlaylistModel.findOne({ _id: id, userId: sessionData.user.sub });
  if (!playlist)
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });

  const alreadyExists = playlist.items.some((item) => item.videoId === body.videoId);
  if (!alreadyExists) {
    playlist.items.push({
      videoId: body.videoId,
      title: body.title,
      artist: body.artist || '',
      artistId: body.artistId,
      thumbnailUrl: body.thumbnailUrl || '',
      durationMs: body.durationMs || 0,
      addedAt: new Date()
    });
    await playlist.save();
  }

  return { success: true };
});
