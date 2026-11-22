import { SystemConfig } from '../../../models/SystemConfig';
import { assertDeveloperSession } from '../../../utils/session';
import { getDeviceAuthStatus } from '../../../utils/youtubeDeviceAuth';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);

  const [cookieRecord, poRecord, visitorRecord, oauthRecord] = await Promise.all([
    SystemConfig.findOne({ key: 'youtube_cookies' }),
    SystemConfig.findOne({ key: 'youtube_po_token' }),
    SystemConfig.findOne({ key: 'youtube_visitor_data' }),
    SystemConfig.findOne({ key: 'youtube_oauth' })
  ]);

  return {
    hasCookies: Boolean(cookieRecord?.value),
    hasPoToken: Boolean(poRecord?.value),
    hasVisitorData: Boolean(visitorRecord?.value),
    hasOauth: Boolean(oauthRecord?.value),
    deviceAuth: getDeviceAuthStatus()
  };
});
