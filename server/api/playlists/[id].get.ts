import type { H3Event } from 'h3';
import type { ServerSession } from '../../types/auth.server.types';
import mongoose from 'mongoose';
import { PlaylistModel } from '../../models/Playlist';

export interface PlaylistTrackResponse {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnailUrl: string;
  durationMs: number;
  addedAt: string;
}

export interface PlaylistDetailResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tracks: PlaylistTrackResponse[];
  trackCount: number;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

function parseNonNegativeInteger(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }

  if (Array.isArray(value)) {
    return parseNonNegativeInteger(value[0]);
  }

  return undefined;
}

function resolvePlaylistId(event: H3Event): string | undefined {
  const queryId = getQuery(event).id;
  if (typeof queryId === 'string' && queryId.length > 0) {
    return queryId;
  }

  const routeId = getRouterParam(event, 'id') ?? event.context.params?.id;
  if (routeId) {
    return routeId;
  }

  const pathname = getRequestURL(event).pathname;
  const pathMatch = pathname.match(/\/api\/playlists\/([^/]+)$/);
  return pathMatch?.[1];
}

export default defineEventHandler(async (event): Promise<PlaylistDetailResponse> => {
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

  const id = resolvePlaylistId(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingId') });

  if (!mongoose.isValidObjectId(id)) {
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });
  }

  const playlist = await PlaylistModel.findOne({
    _id: id,
    userId: sessionData.user.sub
  }).lean();

  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });
  }

  const query = getQuery(event);
  const offsetValue = query.offset as unknown;
  const limitValue = query.limit as unknown;
  const offset = parseNonNegativeInteger(offsetValue) ?? 0;
  const limit = parseNonNegativeInteger(limitValue);
  const tracks =
    typeof limit === 'number' ? playlist.items.slice(offset, offset + limit) : playlist.items;

  return {
    id: (playlist._id as { toString(): string }).toString(),
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: playlist.imageUrl || '',
    tracks: tracks.map((item) => ({
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      artistId: item.artistId,
      thumbnailUrl: item.thumbnailUrl,
      durationMs: item.durationMs,
      addedAt: item.addedAt.toISOString()
    })),
    trackCount: playlist.items.length,
    trackIds: playlist.items.map((i: { videoId: string }) => i.videoId),
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString()
  };
});
