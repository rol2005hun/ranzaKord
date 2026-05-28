type ClientType = 'TV' | 'WEB' | 'YTMUSIC' | 'ANDROID' | 'IOS' | 'TV_EMBEDDED' | 'WEB_CREATOR';
const workingClients: ClientType[] = [
  'TV',
  'WEB',
  'YTMUSIC',
  'ANDROID',
  'IOS',
  'TV_EMBEDDED',
  'WEB_CREATOR'
];

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;
  const { t } = useServerTranslation(event);

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: t('player.errors.missingVideoId') });
  }

  const innertube = await createInnertube(true);
  const debugInfo: Record<string, string> = {};

  let successfulResponse: Response | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const client of workingClients) {
      try {
        const info = await innertube.getBasicInfo(videoId.trim(), { client });
        const formats = [
          ...(info.streaming_data?.formats || []),
          ...(info.streaming_data?.adaptive_formats || [])
        ];

        let format = formats.find(
          (f) => f.has_audio && !f.has_video && (f.url || f.signature_cipher)
        );
        if (!format) {
          format = formats.find((f) => f.has_audio && (f.url || f.signature_cipher));
        }

        if (!format) {
          debugInfo[client] = `No audio format found on attempt ${attempt}.`;
          continue;
        }

        let streamUrl = format.url as string | undefined;
        if (!streamUrl) {
          streamUrl = await format.decipher(innertube.session.player);
        }

        if (!streamUrl) {
          debugInfo[client] = `Failed to extract stream URL on attempt ${attempt}.`;
          continue;
        }

        const response = await fetch(streamUrl, {
          headers: {
            ...(event.node.req.headers.range
              ? { range: event.node.req.headers.range as string }
              : {})
          }
        });

        if (response.ok && response.body) {
          successfulResponse = response;
          if (workingClients[0] !== client) {
            workingClients.unshift(
              workingClients.splice(workingClients.indexOf(client), 1)[0] as ClientType
            );
          }
          break;
        } else {
          debugInfo[client] = `Fetch returned ${response.status} ${response.statusText}`;
        }
      } catch (e) {
        debugInfo[client] = e instanceof Error ? e.message : String(e);
      }
    }

    if (successfulResponse) {
      break;
    }
  }

  if (!successfulResponse) {
    throw createError({
      statusCode: 500,
      statusMessage: t('player.errors.extractFailed', { msg: 'All clients failed' }),
      data: { debugInfo }
    });
  }

  for (const [key, value] of successfulResponse.headers.entries()) {
    setHeader(event, key, value);
  }

  setResponseStatus(event, successfulResponse.status);
  return sendStream(event, successfulResponse.body as ReadableStream);
});
