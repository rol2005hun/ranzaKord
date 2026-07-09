export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    throw createError({ statusCode: 400, message: 'Invalid URL' });
  }

  try {
    const buffer = await $fetch<ArrayBuffer>(url, {
      responseType: 'arrayBuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    // Allow cross-origin access so the canvas can read it
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
    // Set long cache headers since album art is immutable, but ONLY if successful!
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
    setResponseHeader(event, 'Content-Type', 'image/jpeg');
    return Buffer.from(buffer);
  } catch (error) {
    console.error('Failed to proxy image:', error);
    throw createError({ statusCode: 500, message: 'Failed to proxy image' });
  }
});
