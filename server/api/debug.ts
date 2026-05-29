export default defineEventHandler(async () => {
  try {
    const innertube = await createInnertube(true);
    return {
      success: true,
      authenticated: innertube.session.logged_in,
      oauthTokenExists: !!useRuntimeConfig().youtubeOauthToken,
      cookieExists: !!useRuntimeConfig().youtubeCookies,
      clientStatus: 'OK'
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    };
  }
});
