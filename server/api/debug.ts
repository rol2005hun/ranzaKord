import { Innertube, UniversalCache } from 'youtubei.js';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const oauthTokenStr = config.youtubeOauthToken as string;
  const cookie = config.youtubeCookies as string;

  let parseError = null;
  let signInError = null;
  let parsedCredentials = null;
  let isLoggedIn = false;

  if (config.youtubeOauthToken) {
    try {
      parsedCredentials = typeof config.youtubeOauthToken === 'string'
        ? JSON.parse(config.youtubeOauthToken)
        : JSON.parse(JSON.stringify(config.youtubeOauthToken));
    } catch (e: unknown) {
      parseError = e instanceof Error ? e.message : String(e);
    }
  }

  if (parsedCredentials) {
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true
      });
      await yt.session.signIn(parsedCredentials);
      isLoggedIn = yt.session.logged_in;
    } catch (e: unknown) {
      signInError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    success: true,
    authenticated: isLoggedIn,
    oauthTokenStrLength: oauthTokenStr ? oauthTokenStr.length : 0,
    cookieExists: !!cookie,
    parseError,
    signInError,
    parsedCredentialsPreview: parsedCredentials ? Object.keys(parsedCredentials) : null
  };
});
