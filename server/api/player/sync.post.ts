import { UserModel } from '../../models/User';
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

  const body = await readBody<{ videoId?: string; currentTime?: number }>(event);

  if (!body || typeof body.videoId !== 'string' || typeof body.currentTime !== 'number') {
    throw createError({ statusCode: 400, statusMessage: t('player.errors.invalidPayload') });
  }

  const { videoId, currentTime } = body;

  try {
    await UserModel.updateOne(
      { sub: sessionData.user.sub },
      {
        $set: {
          lastPlayback: {
            videoId,
            currentTime,
            updatedAt: new Date()
          }
        }
      }
    );
    return { success: true };
  } catch (error) {
    console.warn('[Sync API] Failed to update user playback status:', error);
    return { success: false };
  }
});
