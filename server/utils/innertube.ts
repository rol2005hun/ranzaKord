import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import type { OAuth2Tokens } from 'youtubei.js';
import vm from 'vm';
import { SystemConfig } from '../models/SystemConfig';

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
      const configRecord = await SystemConfig.findOne({ key: 'youtube_oauth' });

      if (configRecord && configRecord.value) {
        authenticatedInstance = await Innertube.create({
          cache: new UniversalCache(false)
        });

        authenticatedInstance.session.on('update-credentials', async ({ credentials }) => {
          await SystemConfig.findOneAndUpdate(
            { key: 'youtube_oauth' },
            { value: credentials },
            { upsert: true }
          );
        });

        await authenticatedInstance.session.signIn(configRecord.value as OAuth2Tokens);
      } else {
        const config = useRuntimeConfig();
        const cookie = config.youtubeCookies as string;

        authenticatedInstance = await Innertube.create({
          cookie: cookie ? cookie : undefined,
          cache: new UniversalCache(false),
          generate_session_locally: true
        });
      }
    } catch (e) {
      console.error('Failed to initialize Innertube with cookies:', e);
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
    generate_session_locally: true,
    lang: 'en',
    location: 'US'
  });

  return anonymousInstance;
}
