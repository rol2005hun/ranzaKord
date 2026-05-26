import { UserModel } from '../../models/User';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody(event);
  const { videoId, currentTime } = body;

  if (typeof videoId !== 'string' || typeof currentTime !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' });
  }

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
});
