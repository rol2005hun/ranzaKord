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
    const oauthTokenStr = config.youtubeOauthToken as string;
    const cookie = config.youtubeCookies as string;

    authenticatedInstance = await Innertube.create({
      cookie: !oauthTokenStr && cookie ? cookie : undefined,
      cache: new UniversalCache(false),
      generate_session_locally: true
    });

    if (config.youtubeOauthToken) {
      try {
        const credentials =
          typeof config.youtubeOauthToken === 'string'
            ? JSON.parse(config.youtubeOauthToken)
            : JSON.parse(JSON.stringify(config.youtubeOauthToken));

        await authenticatedInstance.session.signIn(credentials);
      } catch (e) {
        console.error('Failed to sign in with YouTube OAuth token:', e);
      }
    }

    return authenticatedInstance;
  }

  if (anonymousInstance) return anonymousInstance;

  anonymousInstance = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true
  });

  return anonymousInstance;
}
