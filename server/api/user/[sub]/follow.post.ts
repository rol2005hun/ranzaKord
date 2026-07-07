import type { ServerSession } from '../../../types/auth.server.types';
import { UserModel } from '../../../models/User';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const targetSub = getRouterParam(event, 'sub');
  if (!targetSub) throw createError({ statusCode: 400, statusMessage: 'Missing target sub' });

  if (targetSub === sessionData.user.sub) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot follow yourself' });
  }

  const body = await readBody<{ action: 'follow' | 'unfollow' }>(event);
  if (!body || !['follow', 'unfollow'].includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' });
  }

  const currentUser = await UserModel.findOne({ sub: sessionData.user.sub });
  const targetUser = await UserModel.findOne({ sub: targetSub });

  if (!currentUser || !targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  if (!targetUser.isPublicProfile) {
    throw createError({ statusCode: 403, statusMessage: 'Profile is private' });
  }

  if (body.action === 'follow') {
    if (!targetUser.followers?.includes(currentUser.sub)) {
      targetUser.followers?.push(currentUser.sub);
    }
    if (!currentUser.following?.includes(targetUser.sub)) {
      currentUser.following?.push(targetUser.sub);
    }
  } else {
    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter((s) => s !== currentUser.sub);
    }
    if (currentUser.following) {
      currentUser.following = currentUser.following.filter((s) => s !== targetUser.sub);
    }
  }

  await targetUser.save();
  await currentUser.save();

  return { success: true };
});
