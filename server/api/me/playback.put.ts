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

  const { videoId, currentTime, title, artist, thumbnailUrl, durationSeconds } = body;

  if (typeof videoId !== 'string' || typeof currentTime !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid body parameters'
    });
  }

  const update: Record<string, unknown> = {
    videoId,
    currentTime,
    updatedAt: new Date()
  };

  if (typeof title === 'string') update.title = title;
  if (typeof artist === 'string') update.artist = artist;
  if (typeof thumbnailUrl === 'string') update.thumbnailUrl = thumbnailUrl;
  if (typeof durationSeconds === 'number') update.durationSeconds = durationSeconds;

  const updatedUser = await UserModel.findOneAndUpdate(
    { sub: sessionData.user.sub },
    {
      $set: {
        lastPlayback: update
      }
    },
    { returnDocument: 'after' }
  );

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    });
  }

  return { success: true };
});
