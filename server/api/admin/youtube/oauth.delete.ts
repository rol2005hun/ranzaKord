import { SystemConfig } from '../../../models/SystemConfig';
import { assertDeveloperSession } from '../../../utils/session';
import { resetDeviceAuth } from '../../../utils/youtubeDeviceAuth';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);
  await SystemConfig.deleteOne({ key: 'youtube_oauth' });
  resetDeviceAuth();
  return { success: true };
});
