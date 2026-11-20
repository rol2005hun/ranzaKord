import { UserModel } from '../../models/User';
import { useAppSession } from '../../utils/session';

import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const body = await readBody<{ videoId?: string; currentTime?: number }>(event);

  if (!body || typeof body.videoId !== 'string' || typeof body.currentTime !== 'number') {
    throw createError({ statusCode: 400, message: t('player.errors.invalidPayload') });
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
  } catch {
    return { success: false };
  }
});
