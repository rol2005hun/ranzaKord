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
          console.error('Failed to sign in with stored YouTube OAuth tokens:', oauthError);
          authenticatedInstance = null;
        }
      }

      if (!authenticatedInstance) {
        const instance = await Innertube.create({
          cache: new UniversalCache(false)
        });

        console.warn(
          'YouTube OAuth is not configured in database. Run `pnpm youtube:login` to enable streaming on datacenter IPs.'
        );

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
