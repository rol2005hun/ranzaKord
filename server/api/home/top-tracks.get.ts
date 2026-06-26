import { TrackStatModel } from '../../models/TrackStat';
import { TrackModel } from '../../models/Track';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const userId = sessionData.user.sub;

  const stats = await TrackStatModel.find({ userId })
    .sort({ playCount: -1, totalListening: -1, skipCount: 1 })
    .limit(20)
    .lean();

  if (!stats.length) {
    return [];
  }

  const trackIds = stats.map((s) => s.trackId);

  const tracks = await TrackModel.find({ trackId: { $in: trackIds } }).lean();

  const trackMap = new Map(tracks.map((t) => [t.trackId, t]));

  return stats.flatMap((s) => {
    const track = trackMap.get(s.trackId);
    if (!track) return [];
    return [
      {
        id: track.trackId,
        type: 'song' as const,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        durationSeconds: track.durationSeconds
      }
    ];
  });
});
