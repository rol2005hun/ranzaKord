import { Innertube, UniversalCache, Platform } from 'youtubei.js';

import { SystemConfig } from '../models/SystemConfig';

import type { OAuth2Tokens } from 'youtubei.js';

function evaluateScript(
  data: Parameters<typeof Platform.shim.eval>[0],
  _env: Parameters<typeof Platform.shim.eval>[1]
): ReturnType<typeof Platform.shim.eval> {
  return new Function(data.output)() as ReturnType<typeof Platform.shim.eval>;
}

Platform.shim.eval = evaluateScript;

let anonymousInstance: Innertube | null = null;
let authenticatedInstance: Innertube | null = null;
let isAuthenticating = false;
let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 60_000;

async function getStoredCookies(): Promise<string | undefined> {
  try {
    const cookieRecord = await SystemConfig.findOne({ key: 'youtube_cookies' });
    if (cookieRecord && cookieRecord.value) {
      return String(cookieRecord.value).trim();
    }
  } catch {
    void 0;
  }
  return process.env.NUXT_YOUTUBE_COOKIES || process.env.YOUTUBE_COOKIES;
}

interface StoredPoData {
  poToken?: string;
  visitorData?: string;
}

async function getStoredPoData(): Promise<StoredPoData> {
  let poToken: string | undefined;
  let visitorData: string | undefined;

  try {
    const poRecord = await SystemConfig.findOne({ key: 'youtube_po_token' });
    if (poRecord && poRecord.value) {
      poToken = String(poRecord.value).trim();
    }
    const visitorRecord = await SystemConfig.findOne({ key: 'youtube_visitor_data' });
    if (visitorRecord && visitorRecord.value) {
      visitorData = String(visitorRecord.value).trim();
    }
  } catch {
    void 0;
  }

  poToken = poToken || process.env.NUXT_YOUTUBE_PO_TOKEN || process.env.YOUTUBE_PO_TOKEN;
  visitorData =
    visitorData || process.env.NUXT_YOUTUBE_VISITOR_DATA || process.env.YOUTUBE_VISITOR_DATA;

  return { poToken, visitorData };
}

export function resetAnonymousInnertube(): void {
  anonymousInstance = null;
}

export async function createInnertube(withAuth = false): Promise<Innertube> {
  Platform.shim.eval = evaluateScript;

  if (withAuth) {
    if (authenticatedInstance && Date.now() - lastAuthCheck < AUTH_CACHE_TTL) {
      return authenticatedInstance;
    }

    if (isAuthenticating) {
      while (isAuthenticating) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (authenticatedInstance) return authenticatedInstance;
    }

    isAuthenticating = true;

    try {
      lastAuthCheck = Date.now();

      let oauthTokens: OAuth2Tokens | null = null;
      try {
        const oauthRecord = await SystemConfig.findOne({ key: 'youtube_oauth' });
        if (oauthRecord && oauthRecord.value) {
          oauthTokens = oauthRecord.value as OAuth2Tokens;
        }
      } catch {
        oauthTokens = null;
      }

      if (!oauthTokens) {
        const envOAuth = process.env.NUXT_YOUTUBE_OAUTH || process.env.YOUTUBE_OAUTH;
        if (envOAuth) {
          try {
            oauthTokens = JSON.parse(envOAuth) as OAuth2Tokens;
          } catch {
            oauthTokens = null;
          }
        }
      }

      const cookies = await getStoredCookies();
      const { poToken, visitorData } = await getStoredPoData();
      const hasPo = Boolean(poToken && visitorData);

      if (oauthTokens) {
        try {
          const oauthInstance = await Innertube.create({
            cache: new UniversalCache(false),
            retrieve_player: true,
            cookie: cookies,
            po_token: poToken,
            visitor_data: visitorData,
            generate_session_locally: hasPo
          });

          oauthInstance.session.on('update-credentials', async ({ credentials }) => {
            try {
              await SystemConfig.findOneAndUpdate(
                { key: 'youtube_oauth' },
                { value: credentials },
                { upsert: true }
              );
            } catch {
              void 0;
            }
          });

          oauthInstance.session.on('auth-error', () => {
            authenticatedInstance = null;
          });

          await oauthInstance.session.signIn(oauthTokens);
          authenticatedInstance = oauthInstance;
        } catch (oauthError) {
          console.error('Failed to sign in with stored YouTube OAuth tokens:', oauthError);
          authenticatedInstance = null;
        }
      }

      if (!authenticatedInstance) {
        const instance = await Innertube.create({
          cache: new UniversalCache(false),
          retrieve_player: true,
          cookie: cookies,
          po_token: poToken,
          visitor_data: visitorData,
          generate_session_locally: hasPo
        });

        authenticatedInstance = instance;
      }
    } catch (e) {
      console.error('Failed to initialize authenticated Innertube instance:', e);
      authenticatedInstance = null;
    } finally {
      isAuthenticating = false;
    }

    if (!authenticatedInstance) {
      throw new Error('Failed to create authenticated Innertube instance.');
    }
    return authenticatedInstance;
  }

  if (anonymousInstance) return anonymousInstance;

  const cookies = await getStoredCookies();
  const { poToken, visitorData } = await getStoredPoData();
  const hasPo = Boolean(poToken && visitorData);

  anonymousInstance = await Innertube.create({
    cache: new UniversalCache(false),
    retrieve_player: true,
    lang: 'en',
    cookie: cookies,
    po_token: poToken,
    visitor_data: visitorData,
    generate_session_locally: hasPo
  });

  return anonymousInstance;
}
