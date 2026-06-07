import type { H3Event } from 'h3';
import type { ServerSession } from '../../types/auth.server.types';
import mongoose from 'mongoose';
import { PlaylistModel, type IPlaylistItem } from '../../models/Playlist';

export interface PlaylistTrackArtist {
  name: string;
  channelId?: string;
}

export interface PlaylistTrackResponse {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  artists?: PlaylistTrackArtist[];
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
  return getRouterParam(event, 'id') ?? event.context.params?.id;
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

  const sortBy = query.sortBy as string;
  const sortOrder = (query.sortOrder as string) || 'asc';
  const search = query.search as string;

  let filteredItems = playlist.items;

  function normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  if (search) {
    const searchLower = normalizeText(search);
    filteredItems = playlist.items.filter((item: IPlaylistItem) => {
      const matchTitle = item.title && normalizeText(item.title).includes(searchLower);
      const matchArtist = item.artist && normalizeText(item.artist).includes(searchLower);
      return matchTitle || matchArtist;
    });
  }

  if (sortBy) {
    filteredItems.sort((a: IPlaylistItem, b: IPlaylistItem) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'hu-HU');
      } else if (sortBy === 'duration') {
        comparison = a.durationMs - b.durationMs;
      } else if (sortBy === 'date') {
        const timeA = new Date(a.addedAt).getTime();
        const timeB = new Date(b.addedAt).getTime();
        comparison = timeA - timeB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  const tracks =
    typeof limit === 'number' ? filteredItems.slice(offset, offset + limit) : filteredItems;

  return {
    id: (playlist._id as { toString(): string }).toString(),
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: playlist.imageUrl || '',
    tracks: tracks.map((item: IPlaylistItem) => ({
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      artistId: item.artistId,
      artists: item.artists ?? [],
      thumbnailUrl: item.thumbnailUrl,
      durationMs: item.durationMs,
      addedAt: item.addedAt.toISOString()
    })),
    trackCount: filteredItems.length,
    trackIds: filteredItems.map((i: IPlaylistItem) => i.videoId),
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString()
  };
});
