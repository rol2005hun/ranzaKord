import { StreamSpeedStat } from '../../models/StreamSpeedStat';
import { assertDeveloperSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);

  const [totalCount, recentLogs, clientAverages, statusCounts] = await Promise.all([
    StreamSpeedStat.countDocuments(),
    StreamSpeedStat.find().sort({ createdAt: -1 }).limit(50).lean(),
    StreamSpeedStat.aggregate([
      { $match: { status: 'resolved' } },
      {
        $group: {
          _id: '$client',
          count: { $sum: 1 },
          avgDurationMs: { $avg: '$durationMs' },
          minDurationMs: { $min: '$durationMs' },
          maxDurationMs: { $max: '$durationMs' }
        }
      },
      {
        $project: {
          count: 1,
          avgDurationMs: { $round: ['$avgDurationMs', 0] },
          minDurationMs: 1,
          maxDurationMs: 1
        }
      },
      { $sort: { avgDurationMs: 1 } }
    ]),
    StreamSpeedStat.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    totalCount,
    clientAverages,
    statusCounts,
    recentLogs
  };
});
