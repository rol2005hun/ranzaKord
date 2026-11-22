import { assertDeveloperSession } from '../../../utils/session';
import { startDeviceAuth } from '../../../utils/youtubeDeviceAuth';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);
  const result = await startDeviceAuth();
  return result;
});
