import vm from 'node:vm';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';

import { SystemConfig } from '../models/SystemConfig';

import type { OAuth2Tokens } from 'youtubei.js';

interface EvaluatorData {
  output: string;
}

Platform.shim.eval = (client: EvaluatorData) => {
  return vm.runInNewContext(`(function() { ${client.output} })()`);
};

let anonymousInstance: Innertube | null = null;
let authenticatedInstance: Innertube | null = null;
let isAuthenticating = false;

function cleanConfigValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export async function createInnertube(withAuth = false): Promise<Innertube> {
  if (withAuth) {
    if (authenticatedInstance) return authenticatedInstance;

    if (isAuthenticating) {
      while (isAuthenticating) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (authenticatedInstance) return authenticatedInstance;
    }

    isAuthenticating = true;

    try {
      const oauthRecord = await SystemConfig.findOne({ key: 'youtube_oauth' });

      if (oauthRecord && oauthRecord.value) {
        try {
          const oauthInstance = await Innertube.create({
            cache: new UniversalCache(false)
          });

          oauthInstance.session.on('update-credentials', async ({ credentials }) => {
            await SystemConfig.findOneAndUpdate(
              { key: 'youtube_oauth' },
              { value: credentials },
              { upsert: true }
            );
          });

          oauthInstance.session.on('auth-error', () => {
            authenticatedInstance = null;
          });

          await oauthInstance.session.signIn(oauthRecord.value as OAuth2Tokens);
          authenticatedInstance = oauthInstance;
        } catch (oauthError) {
          console.error(
            'Failed to sign in with YouTube OAuth tokens, falling back to cookies:',
            oauthError
          );
        }
      }

      if (!authenticatedInstance) {
        const cookieRecord = await SystemConfig.findOne({ key: 'youtube_cookies' });
        const poTokenRecord = await SystemConfig.findOne({ key: 'youtube_po_token' });
        const visitorDataRecord = await SystemConfig.findOne({ key: 'youtube_visitor_data' });

        const runtimeConfig =
          typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : undefined;

        const cookie =
          cleanConfigValue(cookieRecord?.value) ||
          cleanConfigValue(runtimeConfig?.youtubeCookies) ||
          cleanConfigValue(process.env.NUXT_YOUTUBE_COOKIES || process.env.YOUTUBE_COOKIES);

        const poToken =
          cleanConfigValue(poTokenRecord?.value) ||
          cleanConfigValue(runtimeConfig?.youtubePoToken) ||
          cleanConfigValue(process.env.NUXT_YOUTUBE_PO_TOKEN || process.env.YOUTUBE_PO_TOKEN);

        const visitorData =
          cleanConfigValue(visitorDataRecord?.value) ||
          cleanConfigValue(runtimeConfig?.youtubeVisitorData) ||
          cleanConfigValue(
            process.env.NUXT_YOUTUBE_VISITOR_DATA || process.env.YOUTUBE_VISITOR_DATA
          );

        const instance = await Innertube.create({
          cookie: cookie || undefined,
          po_token: poToken || undefined,
          visitor_data: visitorData || undefined,
          cache: new UniversalCache(false)
        });

        instance.session.on('auth-error', () => {
          authenticatedInstance = null;
        });

        if (!cookie && !poToken) {
          console.warn(
            'Innertube initialized without YouTube credentials. Streaming may fail on datacenter IPs with LOGIN_REQUIRED.'
          );
        }

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

  anonymousInstance = await Innertube.create({
    cache: new UniversalCache(false),
    lang: 'en',
    location: 'US'
  });

  return anonymousInstance;
}
