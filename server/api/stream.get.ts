export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing video ID' });
  }

  const innertube = await createInnertube(true);
  const info = await innertube.getInfo(videoId.trim());

  const formats = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || [])
  ];

  // Prefer audio-only formats
  let format = formats.find((f) => f.has_audio && !f.has_video && (f.url || f.signature_cipher));
  if (!format) {
    format = formats.find((f) => f.has_audio && (f.url || f.signature_cipher));
  }

  if (!format) {
    throw createError({ statusCode: 404, statusMessage: 'No audio format available' });
  }

  let streamUrl = format.url as string | undefined;
  if (!streamUrl) {
    try {
      streamUrl = await format.decipher(innertube.session.player);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw createError({ statusCode: 500, statusMessage: 'Failed to extract stream URL: ' + msg });
    }
  }

  if (!streamUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Stream URL is empty' });
  }

  // Proxy the stream through our server to bypass CORS, IP locks and Cookie requirements
  return proxyRequest(event, streamUrl, {
    headers: {
      // Pass the request's Range header if present
      ...(event.node.req.headers.range ? { range: event.node.req.headers.range } : {})
    }
  });
});
