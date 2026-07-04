export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' });
  }

  // Set long cache headers since album art is immutable
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
  // Allow cross-origin access so the canvas can read it
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');

  try {
    return await proxyRequest(event, url);
  } catch (error) {
    console.error('Failed to proxy image:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to proxy image' });
  }
});
