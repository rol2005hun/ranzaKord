export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query['url'] as string | undefined;

  const { t } = useServerTranslation(event);

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    throw createError({ statusCode: 400, message: t('core.errors.missingUrl') });
  }

  try {
    return proxyRequest(event, url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://music.youtube.com/'
      },
      onResponse(event) {
        setHeader(event, 'Cache-Control', 'public, max-age=604800, immutable');
      }
    });
  } catch {
    throw createError({ statusCode: 500, message: t('core.errors.proxyFailed') });
  }
});
