export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;
  const { t } = useServerTranslation(event);

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: t('player.errors.missingVideoId') });
  }

  const innertube = await createInnertube(true);
  let info = await innertube.getInfo(videoId.trim());
  let formats = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || [])
  ];

  if (formats.length === 0) {
    info = await innertube.getInfo(videoId.trim(), { client: 'IOS' });
    formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || [])
    ];
  }

  if (formats.length === 0) {
    info = await innertube.getInfo(videoId.trim(), { client: 'ANDROID' });
    formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || [])
    ];
  }

  let format = formats.find((f) => f.has_audio && !f.has_video && (f.url || f.signature_cipher));
  if (!format) {
    format = formats.find((f) => f.has_audio && (f.url || f.signature_cipher));
  }

  if (!format) {
    throw createError({ statusCode: 404, statusMessage: t('player.errors.noAudioFormat') });
  }

  let streamUrl = format.url as string | undefined;
  if (!streamUrl) {
    try {
      streamUrl = await format.decipher(innertube.session.player);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw createError({
        statusCode: 500,
        statusMessage: t('player.errors.extractFailed', { msg })
      });
    }
  }

  if (!streamUrl) {
    throw createError({ statusCode: 500, statusMessage: t('player.errors.emptyStream') });
  }

  const response = await fetch(streamUrl, {
    headers: {
      ...(event.node.req.headers.range ? { range: event.node.req.headers.range as string } : {})
    }
  });

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: response.statusText });
  }

  for (const [key, value] of response.headers.entries()) {
    setHeader(event, key, value);
  }

  if (!response.body) {
    throw createError({ statusCode: 500, statusMessage: t('player.errors.emptyStream') });
  }

  setResponseStatus(event, response.status);
  return sendStream(event, response.body as ReadableStream);
});
