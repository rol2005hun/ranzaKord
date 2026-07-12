import type { ServerSession } from '../../types/auth.server.types';
import { PlaylistModel } from '../../models/Playlist';

export interface PlaylistResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}

export interface PlaylistsIndexResponse {
  myPlaylists: PlaylistResponse[];
  sharedPlaylists: PlaylistResponse[];
}

export default defineEventHandler(async (event): Promise<PlaylistsIndexResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const userSub = sessionData.user.sub;

  const playlists = await PlaylistModel.find({
    $or: [{ userId: userSub }, { collaborators: userSub }]
  })
    .sort({ updatedAt: -1 })
    .lean();

  const myPlaylists: PlaylistResponse[] = [];
  const sharedPlaylists: PlaylistResponse[] = [];

  for (const p of playlists) {
    const isOwner = p.userId === userSub;
    const item = {
      id: (p._id as { toString(): string }).toString(),
      name: p.name,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      trackCount: p.items.length,
      trackIds: p.items.map((i: { videoId: string }) => i.videoId),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      isPublic: p.isPublic !== false
    };

    if (isOwner) {
      myPlaylists.push(item);
    } else {
      sharedPlaylists.push(item);
    }
  }

  return { myPlaylists, sharedPlaylists };
});
