const ALLOWED_HOSTS = [
  'yt3.googleusercontent.com',
  'i.ytimg.com',
  'lh3.googleusercontent.com',
  'image-cdn-ak.spotifycdn.com',
  'i.scdn.co',
  'i.imgur.com',
  'mosaic.scdn.co'
];

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' });
  }

  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    throw createError({ statusCode: 403, statusMessage: 'Host not allowed' });
  }

  try {
    const response = await $fetch.raw<ArrayBuffer>(url, {
      responseType: 'arrayBuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
    setResponseHeader(event, 'Content-Type', contentType);
    return Buffer.from(response._data as ArrayBuffer);
  } catch (error) {
    console.error('Failed to proxy image:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to proxy image' });
  }
});
