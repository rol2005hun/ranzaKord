import { UserModel } from '../../models/User';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetSub = query.id as string;
  const type = query.type as string; // 'followers' or 'following'

  if (!targetSub || !['followers', 'following'].includes(type)) {
    throw createError({ statusCode: 400, message: 'Invalid or missing user ID and type' });
  }

  const user = await UserModel.findOne({ sub: targetSub }).lean();
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  const subs = type === 'followers' ? user.followers || [] : user.following || [];

  if (subs.length === 0) {
    return { users: [], anonymousCount: 0 };
  }

  const connections = await UserModel.find({ sub: { $in: subs } }).lean();

  const publicUsers = [];
  let anonymousCount = 0;

  for (const conn of connections) {
    if (conn.isPublicProfile !== false) {
      publicUsers.push({
        sub: conn.sub,
        name: conn.name,
        picture: conn.picture
      });
    } else {
      anonymousCount++;
    }
  }

  return {
    users: publicUsers,
    anonymousCount
  };
});
