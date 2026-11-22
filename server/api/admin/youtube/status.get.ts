import { SystemConfig } from '../../../models/SystemConfig';
import { assertDeveloperSession } from '../../../utils/session';
import { getDeviceAuthStatus, resetDeviceAuth } from '../../../utils/youtubeDeviceAuth';

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);

  const [cookieRecord, poRecord, visitorRecord, oauthRecord] = await Promise.all([
    SystemConfig.findOne({ key: 'youtube_cookies' }),
    SystemConfig.findOne({ key: 'youtube_po_token' }),
    SystemConfig.findOne({ key: 'youtube_visitor_data' }),
    SystemConfig.findOne({ key: 'youtube_oauth' })
  ]);

  const hasOauth = Boolean(oauthRecord?.value);
  const deviceAuth = getDeviceAuthStatus();
  if (!hasOauth && deviceAuth.status === 'success') {
    resetDeviceAuth();
  }

  return {
    hasCookies: Boolean(cookieRecord?.value),
    hasPoToken: Boolean(poRecord?.value),
    hasVisitorData: Boolean(visitorRecord?.value),
    hasOauth,
    deviceAuth: getDeviceAuthStatus()
  };
});
