import { Innertube, UniversalCache, Platform } from 'youtubei.js';

import { SystemConfig } from '../models/SystemConfig';

import type { OAuth2Tokens } from 'youtubei.js';
import type { InnertubeCache } from '../types/innertube.types';

class SafeCache implements InnertubeCache {
  private memory = new Map<string, ArrayBuffer>();
  private diskCache: UniversalCache | null = null;
  public cache_dir: string;

  constructor() {
    try {
      this.diskCache = new UniversalCache(false);
      this.cache_dir = this.diskCache.cache_dir;
    } catch {
      this.diskCache = null;
      this.cache_dir = 'memory';
    }
  }

  async get(key: string): Promise<ArrayBuffer | undefined> {
    if (this.diskCache) {
      try {
        return await this.diskCache.get(key);
      } catch {
        void 0;
      }
    }
    return this.memory.get(key);
  }

  async set(key: string, value: ArrayBuffer): Promise<void> {
    this.memory.set(key, value);
    if (this.diskCache) {
      try {
        await this.diskCache.set(key, value);
      } catch {
        void 0;
      }
    }
  }

  async remove(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.diskCache) {
      try {
        await this.diskCache.remove(key);
      } catch {
        void 0;
      }
    }
  }
}

function evaluateScript(
  data: Parameters<typeof Platform.shim.eval>[0],
  _env: Parameters<typeof Platform.shim.eval>[1]
): ReturnType<typeof Platform.shim.eval> {
  return new Function(data.output)() as ReturnType<typeof Platform.shim.eval>;
}

Platform.shim.eval = evaluateScript;

let anonymousInstance: Innertube | null = null;
let authenticatedInstance: Innertube | null = null;
let cleanInstance: Innertube | null = null;
let isAuthenticating = false;
let lastAuthCheck = 0;
let lastAnonCheck = 0;
let lastCachedCookies: string | undefined = undefined;
const AUTH_CACHE_TTL = 60_000;
const ANON_CACHE_TTL = 300_000;

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

function isValidPoToken(token?: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (trimmed.length < 20) return false;
  if (trimmed.startsWith('{') || trimmed.endsWith('}')) return false;
  if (trimmed.length % 4 === 1) return false;
  return /^[A-Za-z0-9+/=_-]+$/.test(trimmed);
}

function isValidVisitorData(data?: string): boolean {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.includes('"') || trimmed.includes('{') || trimmed.includes('}')) return false;
  return /^[A-Za-z0-9+/=%_-]+$/.test(trimmed);
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

  if (!isValidPoToken(poToken)) {
    poToken = undefined;
  }
  if (!isValidVisitorData(visitorData)) {
    visitorData = undefined;
  }

  return { poToken, visitorData };
}

export function resetAnonymousInnertube(): void {
  anonymousInstance = null;
  cleanInstance = null;
  lastAnonCheck = 0;
  lastCachedCookies = undefined;
}

export async function createInnertube(withAuth = false, withCookie = true): Promise<Innertube> {
  Platform.shim.eval = evaluateScript;

  if (!withAuth && !withCookie) {
    if (cleanInstance) {
      return cleanInstance;
    }
    try {
      cleanInstance = await Innertube.create({
        cache: new SafeCache(),
        retrieve_player: true,
        lang: 'en'
      });
    } catch {
      cleanInstance = await Innertube.create({
        cache: new SafeCache(),
        retrieve_player: false,
        lang: 'en'
      });
    }
    return cleanInstance;
  }

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
            cache: new SafeCache(),
            retrieve_player: true
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
        } catch {
          authenticatedInstance = null;
        }
      }

      if (!authenticatedInstance) {
        try {
          authenticatedInstance = await Innertube.create({
            cache: new SafeCache(),
            retrieve_player: true,
            cookie: cookies,
            po_token: poToken,
            visitor_data: visitorData,
            generate_session_locally: hasPo
          });
        } catch {
          authenticatedInstance = await Innertube.create({
            cache: new SafeCache(),
            retrieve_player: true
          });
        }
      }
    } catch {
      authenticatedInstance = null;
    } finally {
      isAuthenticating = false;
    }

    if (!authenticatedInstance) {
      throw new Error('Failed to create authenticated Innertube instance.');
    }
    return authenticatedInstance;
  }

  const cookies = await getStoredCookies();
  const cookiesChanged = cookies !== lastCachedCookies;

  if (anonymousInstance && !cookiesChanged && Date.now() - lastAnonCheck < ANON_CACHE_TTL) {
    return anonymousInstance;
  }

  lastAnonCheck = Date.now();
  lastCachedCookies = cookies;

  const { poToken, visitorData } = await getStoredPoData();
  const hasPo = Boolean(poToken && visitorData);

  try {
    anonymousInstance = await Innertube.create({
      cache: new SafeCache(),
      retrieve_player: true,
      lang: 'en',
      cookie: cookies,
      po_token: hasPo ? poToken : undefined,
      visitor_data: hasPo ? visitorData : undefined,
      generate_session_locally: hasPo
    });
  } catch {
    anonymousInstance = await Innertube.create({
      cache: new SafeCache(),
      retrieve_player: true,
      lang: 'en'
    });
  }

  if (!anonymousInstance) {
    throw new Error('Failed to create anonymous Innertube instance.');
  }

  return anonymousInstance;
}
