import { UserModel } from '../../models/User';
import { PlaylistModel } from '../../models/Playlist';
import { useAppSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetSub = query.id as string;

  if (!targetSub) {
    throw createError({ statusCode: 400, message: 'User ID is required' });
  }

  const session = await useAppSession(event);
  const sessionUser = session.data?.user;
  const isSelf = sessionUser?.sub === targetSub;

  const user = await UserModel.findOne({ sub: targetSub }).lean();
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  const isPublic = user.isPublicProfile !== false;

  const profileInfo = {
    sub: user.sub,
    name: user.name,
    picture: user.picture,
    isPublicProfile: isPublic,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    isFollowing: sessionUser ? (user.followers || []).includes(sessionUser.sub) : false
  };

  if (!isPublic && !isSelf) {
    throw createError({ statusCode: 404, message: 'Profile not found' });
  }

  const showPlaylists = user.showPlaylists !== false;
  let playlists: Record<string, unknown>[] = [];

  if (showPlaylists || isSelf) {
    const queryCond: Record<string, unknown> = { userId: targetSub };
    if (!isSelf) {
      queryCond.isPublic = { $ne: false };
    }

    const userPlaylists = await PlaylistModel.find(queryCond).sort({ updatedAt: -1 }).lean();

    playlists = userPlaylists.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      trackCount: p.items?.length || 0,
      isPublic: p.isPublic !== false
    }));
  }

  return {
    profile: profileInfo,
    playlists
  };
});
