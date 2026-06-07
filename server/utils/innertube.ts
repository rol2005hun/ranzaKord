import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import vm from 'vm';

interface EvaluatorData {
  output: string;
}

Platform.shim.eval = (client: EvaluatorData) => {
  return vm.runInNewContext(`(function() { ${client.output} })()`);
};

let anonymousInstance: Innertube | null = null;
let authenticatedInstance: Innertube | null = null;

export async function createInnertube(withAuth = false): Promise<Innertube> {
  if (withAuth) {
    if (authenticatedInstance) return authenticatedInstance;

    const config = useRuntimeConfig();
    const envOauthTokenStr = config.youtubeOauthToken as string;
    const cookie = config.youtubeCookies as string;

    authenticatedInstance = await Innertube.create({
      cookie: !envOauthTokenStr && cookie ? cookie : undefined,
      cache: new UniversalCache(false),
      generate_session_locally: true
    });

    try {
      const { SystemConfigModel } = await import('../models/SystemConfig');
      let tokenToUse: unknown = null;

      // 1. Try to get token from MongoDB
      const dbConfig = await SystemConfigModel.findOne({ key: 'youtube_oauth_token' }).lean();

      if (dbConfig && dbConfig.value) {
        tokenToUse = dbConfig.value;
      } else if (envOauthTokenStr) {
        // 2. Fallback to Environment Variable
        tokenToUse =
          typeof envOauthTokenStr === 'string'
            ? JSON.parse(envOauthTokenStr)
            : JSON.parse(JSON.stringify(envOauthTokenStr));

        // Save the env token to DB so it can be refreshed
        await SystemConfigModel.findOneAndUpdate(
          { key: 'youtube_oauth_token' },
          { value: tokenToUse },
          { upsert: true }
        );
      }

      if (tokenToUse) {
        // Listen for token auto-refreshes by youtubei.js
        authenticatedInstance.session.on('update-credentials', async ({ credentials }) => {
          try {
            await SystemConfigModel.findOneAndUpdate(
              { key: 'youtube_oauth_token' },
              { value: credentials },
              { upsert: true }
            );
            console.log('[Innertube] YouTube OAuth token automatically refreshed and saved to DB!');
          } catch (dbErr) {
            console.error('[Innertube] Failed to save refreshed token to DB:', dbErr);
          }
        });

        // @ts-expect-error: youtubei.js credentials type is internal
        await authenticatedInstance.session.signIn(tokenToUse);
      }
    } catch (e) {
      console.error('Failed to sign in with YouTube OAuth token or access DB:', e);
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
