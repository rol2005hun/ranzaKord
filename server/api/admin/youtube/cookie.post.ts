import { SystemConfig } from '../../../models/SystemConfig';
import { resetAnonymousInnertube } from '../../../utils/innertube';
import { assertDeveloperSession } from '../../../utils/session';

interface CookiePayload {
  raw?: string;
  cookie?: string;
  poToken?: string;
  visitorData?: string;
}

function extractCredentials(raw: string): {
  cookie?: string;
  poToken?: string;
  visitorData?: string;
} {
  let cookie: string | undefined;
  let poToken: string | undefined;
  let visitorData: string | undefined;

  const cookieMatch = raw.match(/cookie:\s*([^\r\n]+)/i);
  if (cookieMatch?.[1]) {
    cookie = cookieMatch[1].trim();
  } else if (!raw.includes('\n') && raw.includes('=')) {
    cookie = raw.trim();
  }

  const poMatch = raw.match(/"poToken"\s*:\s*"([^"]+)"/i);
  if (poMatch?.[1]) {
    poToken = poMatch[1].trim();
  }

  const visitorMatch = raw.match(/"visitorData"\s*:\s*"([^"]+)"/i);
  if (visitorMatch?.[1]) {
    visitorData = visitorMatch[1].trim();
  }

  if (visitorData && visitorData.includes('%')) {
    try {
      visitorData = decodeURIComponent(visitorData);
    } catch {
      void 0;
    }
  }

  return { cookie, poToken, visitorData };
}

export default defineEventHandler(async (event) => {
  await assertDeveloperSession(event);

  const body = await readBody<CookiePayload>(event);
  if (!body) {
    throw createError({ statusCode: 400, message: 'Missing body' });
  }

  let cookie = body.cookie?.trim();
  let poToken = body.poToken?.trim();
  let visitorData = body.visitorData?.trim();

  if (body.raw) {
    const extracted = extractCredentials(body.raw);
    cookie = extracted.cookie || cookie;
    poToken = extracted.poToken || poToken;
    visitorData = extracted.visitorData || visitorData;
  }

  if (!cookie && !poToken && !visitorData) {
    throw createError({ statusCode: 400, message: 'No valid cookie or token data found' });
  }

  if (cookie) {
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_cookies' },
      { value: cookie },
      { upsert: true, returnDocument: 'after' }
    );
  }

  if (poToken) {
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_po_token' },
      { value: poToken },
      { upsert: true, returnDocument: 'after' }
    );
  }

  if (visitorData) {
    await SystemConfig.findOneAndUpdate(
      { key: 'youtube_visitor_data' },
      { value: visitorData },
      { upsert: true, returnDocument: 'after' }
    );
  }

  resetAnonymousInnertube();

  return {
    success: true,
    saved: {
      cookie: Boolean(cookie),
      poToken: Boolean(poToken),
      visitorData: Boolean(visitorData)
    }
  };
});
