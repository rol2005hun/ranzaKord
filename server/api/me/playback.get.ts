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

  const user = await UserModel.findOne({ sub: sessionData.user.sub });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    });
  }

  return { lastPlayback: user.lastPlayback || null };
});
