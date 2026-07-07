import { UserModel } from '../../models/User';
import { useAppSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionUser = session.data?.user;

  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);
  const { targetSub, action } = body;

  if (!targetSub || !['follow', 'unfollow'].includes(action)) {
    throw createError({ statusCode: 400, message: 'Invalid request' });
  }

  if (targetSub === sessionUser.sub) {
    throw createError({ statusCode: 400, message: 'Cannot follow yourself' });
  }

  const targetUser = await UserModel.findOne({ sub: targetSub });
  const currentUser = await UserModel.findOne({ sub: sessionUser.sub });

  if (!targetUser || !currentUser) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  const targetFollowers = targetUser.followers || [];
  const currentFollowing = currentUser.following || [];

  if (action === 'follow') {
    if (!targetFollowers.includes(sessionUser.sub)) {
      targetUser.followers = [...targetFollowers, sessionUser.sub];
      await targetUser.save();
    }
    if (!currentFollowing.includes(targetSub)) {
      currentUser.following = [...currentFollowing, targetSub];
      await currentUser.save();
    }
  } else if (action === 'unfollow') {
    targetUser.followers = targetFollowers.filter((id: string) => id !== sessionUser.sub);
    await targetUser.save();

    currentUser.following = currentFollowing.filter((id: string) => id !== targetSub);
    await currentUser.save();
  }

  return { success: true };
});
