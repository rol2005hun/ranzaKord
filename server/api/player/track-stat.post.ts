import { TrackModel } from '../../models/Track';
import { TrackStatModel } from '../../models/TrackStat';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;

  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const body = await readBody<{
    trackId?: string;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    listeningSeconds?: number;
    skipped?: boolean;
  }>(event);

  if (!body || typeof body.trackId !== 'string' || typeof body.listeningSeconds !== 'number') {
    throw createError({ statusCode: 400, message: t('player.errors.invalidPayload') });
  }

  const {
    trackId,
    title = '',
    artist = '',
    thumbnailUrl = '',
    durationSeconds = 0,
    listeningSeconds,
    skipped = false
  } = body;

  const MIN_PLAY_SECONDS = 20;
  const counted = listeningSeconds >= MIN_PLAY_SECONDS;

  const listenPercentage =
    durationSeconds > 0 ? Math.min(100, Math.round((listeningSeconds / durationSeconds) * 100)) : 0;

  await Promise.all([
    TrackModel.findOneAndUpdate(
      { trackId },
      {
        $inc: { globalPlayCount: counted ? 1 : 0 },
        $set: { title, artist, thumbnailUrl, durationSeconds }
      },
      { upsert: true, returnDocument: 'after' }
    ),

    TrackStatModel.findOneAndUpdate(
      { userId: sessionData.user.sub, trackId },
      {
        $inc: {
          playCount: counted ? 1 : 0,
          totalListening: listenPercentage,
          skipCount: skipped ? 1 : 0
        },
        $set: { lastPlayedAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    )
  ]);

  return { success: true };
});
