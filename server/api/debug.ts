export default defineEventHandler(async (event) => {
  try {
    const innertube = await createInnertube(true);
    return {
      success: true,
      authenticated: innertube.session.logged_in,
      oauthTokenExists: !!useRuntimeConfig().youtubeOauthToken,
      cookieExists: !!useRuntimeConfig().youtubeCookies,
      clientStatus: 'OK'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
});
