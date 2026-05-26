import { Innertube, UniversalCache } from 'youtubei.js';

let anonymousInstance: Innertube | null = null;
let authenticatedInstance: Innertube | null = null;

export async function createInnertube(withAuth = false): Promise<Innertube> {
  if (withAuth) {
    if (authenticatedInstance) return authenticatedInstance;

    const config = useRuntimeConfig();
    const cookie = config.youtubeCookies as string;

    authenticatedInstance = await Innertube.create({
      cookie,
      cache: new UniversalCache(false),
      generate_session_locally: true
    });

    return authenticatedInstance;
  }

  if (anonymousInstance) return anonymousInstance;

  anonymousInstance = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true
  });

  return anonymousInstance;
}
