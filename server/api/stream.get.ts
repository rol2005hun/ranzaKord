type ClientType = 'TV' | 'WEB' | 'YTMUSIC' | 'ANDROID' | 'IOS' | 'TV_EMBEDDED' | 'WEB_CREATOR';
const workingClients: ClientType[] = [
  'ANDROID',
  'IOS',
  'YTMUSIC',
  'WEB',
  'TV',
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

  const innertube = await createInnertube(false);
  const debugInfo: Record<string, string> = {};

  let resolvedStreamUrl: string | undefined;

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

        let candidateUrl = format.url as string | undefined;
        if (!candidateUrl) {
          candidateUrl = await format.decipher(innertube.session.player);
        }

        if (!candidateUrl) {
          debugInfo[client] = `Failed to extract stream URL on attempt ${attempt}.`;
          continue;
        }

        const testRes = await fetch(candidateUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (testRes.status === 403) {
          debugInfo[client] = `Stream URL HEAD returned 403 on attempt ${attempt}.`;
          continue;
        }

        if (workingClients[0] !== client) {
          workingClients.unshift(
            workingClients.splice(workingClients.indexOf(client), 1)[0] as ClientType
          );
        }

        resolvedStreamUrl = candidateUrl;
        break;
      } catch (e) {
        debugInfo[client] = e instanceof Error ? e.message : String(e);
      }
    }

    if (resolvedStreamUrl) {
      break;
    }
  }

  if (!resolvedStreamUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: t('player.errors.extractFailed', { msg: 'All clients failed' }),
      data: { debugInfo }
    });
  }

  return proxyRequest(event, resolvedStreamUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
});
