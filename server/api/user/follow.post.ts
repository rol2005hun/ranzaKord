import type { ServerSession } from '../../types/auth.server.types';
import { UserModel } from '../../models/User';
import type { Types } from 'mongoose';
import { useAppSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const body = await readBody<{ action: 'follow' | 'unfollow'; targetSub: string }>(event);
  if (!body || !['follow', 'unfollow'].includes(body.action) || !body.targetSub) {
    throw createError({ statusCode: 400, message: 'Invalid request' });
  }

  if (body.targetSub === sessionData.user.sub) {
    throw createError({ statusCode: 400, message: 'Cannot follow yourself' });
  }

  const currentUser = await UserModel.findOne({ sub: sessionData.user.sub });
  const targetUser = await UserModel.findOne({ sub: body.targetSub });

  if (!currentUser || !targetUser) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  if (!targetUser.isPublicProfile) {
    throw createError({ statusCode: 403, message: 'Profile is private' });
  }

  if (body.action === 'follow') {
    if (!targetUser.followers?.includes(currentUser.sub)) {
      targetUser.followers?.push(currentUser.sub);
    }
    if (!currentUser.following?.includes(targetUser.sub)) {
      currentUser.following?.push(targetUser.sub);
    }
  } else {
    if (targetUser.followers && Array.isArray(targetUser.followers)) {
      (targetUser.followers as Types.Array<string>).pull(currentUser.sub);
    }
    if (currentUser.following && Array.isArray(currentUser.following)) {
      (currentUser.following as Types.Array<string>).pull(targetUser.sub);
    }
  }

  await targetUser.save();
  await currentUser.save();

  return { success: true };
});
