import { StreamSpeedStat } from '../../models/StreamSpeedStat';

export default defineEventHandler(async () => {
  const result = await StreamSpeedStat.deleteMany({});
  return {
    success: true,
    deletedCount: result.deletedCount
  };
});
