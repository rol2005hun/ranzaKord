import { TrackModel } from '../../models/Track';
import { TrackStatModel } from '../../models/TrackStat';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;

  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
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

  if (
    !body ||
    typeof body.trackId !== 'string' ||
    typeof body.listeningSeconds !== 'number' ||
    typeof body.durationSeconds !== 'number'
  ) {
    throw createError({ statusCode: 400, statusMessage: t('player.errors.invalidPayload') });
  }

  const {
    trackId,
    title = '',
    artist = '',
    thumbnailUrl = '',
    durationSeconds,
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
