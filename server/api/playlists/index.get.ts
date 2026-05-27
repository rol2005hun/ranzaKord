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
}

export default defineEventHandler(async (event): Promise<PlaylistResponse[]> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const playlists = await PlaylistModel.find({ userId: sessionData.user.sub })
    .sort({ updatedAt: -1 })
    .lean();

  return playlists.map((p) => ({
    id: (p._id as { toString(): string }).toString(),
    name: p.name,
    description: p.description || '',
    imageUrl: p.imageUrl || '',
    trackCount: p.items.length,
    trackIds: p.items.map((i: { videoId: string }) => i.videoId),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));
});
