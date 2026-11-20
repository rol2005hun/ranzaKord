import { StreamSpeedStat } from '../../models/StreamSpeedStat';
import { assertDeveloperSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);
  const result = await StreamSpeedStat.deleteMany({});
  return {
    success: true,
    deletedCount: result.deletedCount
  };
});
