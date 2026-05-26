export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query['url'] as string | undefined;

  if (!url || !url.startsWith('http')) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://music.youtube.com/'
      }
    });

    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: response.statusText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    setHeader(event, 'Content-Type', contentType);
    setHeader(event, 'Cache-Control', 'public, max-age=86400, immutable');

    return Buffer.from(arrayBuffer);
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Failed to proxy image' });
  }
});
