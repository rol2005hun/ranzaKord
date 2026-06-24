import dns from 'node:dns';

type ClientType = 'TV' | 'WEB' | 'YTMUSIC' | 'ANDROID' | 'IOS' | 'TV_EMBEDDED' | 'WEB_CREATOR';
const workingClients: ClientType[] = [
  'IOS',
  'ANDROID',
  'YTMUSIC',
  'WEB',
  'TV',
  'TV_EMBEDDED',
  'WEB_CREATOR'
];

// Force Node.js to always use IPv4. This solves the YouTube IP mismatch 403 Forbidden!
// Since youtubei.js and Node fetch might resolve DNS differently (IPv6 vs IPv4),
// YouTube detects the IP difference and blocks the stream.
dns.setDefaultResultOrder('ipv4first');

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;
  const { t } = useServerTranslation(event);

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: t('player.errors.missingVideoId') });
  }

  const innertube = await createInnertube(true);
  const debugInfo: Record<string, string> = {};

  let successfulClient: ClientType | undefined;
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

        if (workingClients[0] !== client) {
          workingClients.unshift(
            workingClients.splice(workingClients.indexOf(client), 1)[0] as ClientType
          );
        }

        successfulClient = client;
        resolvedStreamUrl = candidateUrl;
        break;
      } catch (e) {
        debugInfo[client] = e instanceof Error ? e.message : String(e);
      }
    }

    if (successfulClient && resolvedStreamUrl) {
      break;
    }
  }

  if (!successfulClient || !resolvedStreamUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: t('player.errors.extractFailed', { msg: 'All clients failed' }),
      data: { debugInfo }
    });
  }

  const reqHeaders = getRequestHeaders(event);

  // Forward everything except the headers that leak localhost
  const proxyHeaders = new Headers();
  Object.entries(reqHeaders).forEach(([key, value]) => {
    if (value && !['host', 'referer', 'origin'].includes(key.toLowerCase())) {
      proxyHeaders.set(key, value);
    }
  });

  // Set a safe referer (mimic production)
  proxyHeaders.set('referer', 'https://kord.ranzak.dev/');

  // Always set a standard web user-agent to avoid mobile client tracking mismatches
  proxyHeaders.set(
    'user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  return proxyRequest(event, resolvedStreamUrl, {
    headers: Object.fromEntries(proxyHeaders.entries())
  });
});
