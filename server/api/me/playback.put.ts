import { UserModel } from '../../models/User';

import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  let session;
  try {
    session = await useAppSession(event);
  } catch {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const body = await readBody(event);

  const { videoId, currentTime } = body;

  if (typeof videoId !== 'string' || typeof currentTime !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body parameters'
    });
  }

  const updatedUser = await UserModel.findOneAndUpdate(
    { sub: sessionData.user.sub },
    {
      $set: {
        lastPlayback: {
          videoId,
          currentTime,
          updatedAt: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    });
  }

  return { success: true };
});
