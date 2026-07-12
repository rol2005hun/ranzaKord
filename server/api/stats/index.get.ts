import { TrackStatModel } from '../../models/TrackStat';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;

  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const userId = sessionData.user.sub;

  const [topTracks, totalStats] = await Promise.all([
    TrackStatModel.aggregate([
      { $match: { userId } },
      { $sort: { playCount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'tracks',
          localField: 'trackId',
          foreignField: 'trackId',
          as: 'trackDetails'
        }
      },
      { $unwind: '$trackDetails' },
      {
        $project: {
          trackId: 1,
          playCount: 1,
          title: '$trackDetails.title',
          artist: '$trackDetails.artist',
          thumbnailUrl: '$trackDetails.thumbnailUrl',
          durationSeconds: '$trackDetails.durationSeconds'
        }
      }
    ]),
    TrackStatModel.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'tracks',
          localField: 'trackId',
          foreignField: 'trackId',
          as: 'trackDetails'
        }
      },
      { $unwind: '$trackDetails' },
      {
        $group: {
          _id: null,
          totalListenSeconds: {
            $sum: {
              $multiply: ['$trackDetails.durationSeconds', { $divide: ['$totalListening', 100] }]
            }
          }
        }
      }
    ])
  ]);

  const allStats = await TrackStatModel.aggregate([
    { $match: { userId } },
    {
      $lookup: {
        from: 'tracks',
        localField: 'trackId',
        foreignField: 'trackId',
        as: 'trackDetails'
      }
    },
    { $unwind: '$trackDetails' },
    {
      $project: {
        artist: '$trackDetails.artist',
        playCount: 1
      }
    }
  ]);

  const artistMap = new Map<string, number>();
  for (const stat of allStats) {
    if (!stat.artist) continue;
    const separatorRe = /,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i;
    const artists = stat.artist
      .split(separatorRe)
      .map((s: string) => s.trim())
      .filter(Boolean);

    for (const a of artists) {
      artistMap.set(a, (artistMap.get(a) || 0) + stat.playCount);
    }
  }

  const topArtists = Array.from(artistMap.entries())
    .map(([name, playCount]) => ({ name, playCount }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 20);

  const totalListenSeconds = totalStats.length > 0 ? totalStats[0].totalListenSeconds : 0;

  return {
    topTracks,
    topArtists,
    totalListenSeconds: Math.round(totalListenSeconds)
  };
});
