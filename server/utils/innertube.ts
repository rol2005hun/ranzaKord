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
      const config = useRuntimeConfig();
      const cookie = config.youtubeCookies as string;

      authenticatedInstance = await Innertube.create({
        cookie: cookie ? cookie : undefined,
        cache: new UniversalCache(false),
        generate_session_locally: true
      });
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
