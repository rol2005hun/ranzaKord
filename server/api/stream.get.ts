type ClientType =
  'ANDROID' | 'MWEB' | 'IOS' | 'YTMUSIC' | 'WEB' | 'TV' | 'TV_EMBEDDED' | 'WEB_CREATOR';

interface CachedStream {
  url: string;
  ua: string;
  expiresAt: number;
}

const streamCache = new Map<string, CachedStream>();
const STREAM_CACHE_TTL = 2 * 60 * 60 * 1000;

const defaultWorkingClients: ClientType[] = [
  'YTMUSIC',
  'WEB_CREATOR',
  'WEB',
  'MWEB',
  'ANDROID',
  'IOS',
  'TV_EMBEDDED',
  'TV'
];

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;
  const streamType = (query['type'] as string | undefined) ?? 'audio';
  const { t } = useServerTranslation(event);

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, message: t('player.errors.missingVideoId') });
  }

  const cacheKey = `${videoId.trim()}_${streamType}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    try {
      const testRes = await fetch(cached.url, {
        method: 'GET',
        headers: {
          'User-Agent': cached.ua,
          Range: 'bytes=0-'
        },
        signal: AbortSignal.timeout(1500)
      });
      if (testRes.status !== 403) {
        return proxyRequest(event, cached.url, {
          headers: {
            'User-Agent': cached.ua
          }
        });
      }
    } catch {
      streamCache.delete(cacheKey);
    }
    streamCache.delete(cacheKey);
  }

  const innertube = await createInnertube(true);
  const debugInfo: Record<string, string> = {};

  let resolvedStreamUrl: string | undefined;
  let resolvedUA: string | undefined;

  const isTvOAuth = Boolean(innertube.session.logged_in && innertube.session.oauth?.oauth2_tokens);
  const clientCandidates: ClientType[] = isTvOAuth
    ? ['TV', 'TV_EMBEDDED', 'WEB_CREATOR']
    : [...defaultWorkingClients];

  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const client of clientCandidates) {
      try {
        const info = await innertube.getBasicInfo(videoId.trim(), { client });
        const formats = [
          ...(info.streaming_data?.formats || []),
          ...(info.streaming_data?.adaptive_formats || [])
        ];

        let format;
        if (streamType === 'video') {
          format =
            formats.find(
              (f) =>
                f.has_video &&
                f.has_audio &&
                (f.url || f.signature_cipher) &&
                (f as unknown as { height?: number }).height &&
                ((f as unknown as { height?: number }).height as number) <= 720
            ) ||
            formats.find((f) => f.has_video && f.has_audio && (f.url || f.signature_cipher)) ||
            formats.find((f) => f.has_video && (f.url || f.signature_cipher));
        } else {
          format =
            formats.find((f) => f.has_audio && f.has_video && (f.url || f.signature_cipher)) ||
            formats.find((f) => f.has_audio && (f.url || f.signature_cipher));
        }

        if (!format) {
          const status = info.playability_status?.status || 'UNKNOWN';
          const reason = info.playability_status?.reason || 'No reason provided';
          debugInfo[client] =
            `No ${streamType} format found on attempt ${attempt}. Status: ${status}. Reason: ${reason}.`;
          continue;
        }

        let candidateUrl = format.url as string | undefined;
        if (!candidateUrl && (format as unknown as Record<string, unknown>).signatureCipher) {
          candidateUrl = await format.decipher(innertube.session.player);
        } else if (
          !candidateUrl &&
          (format as unknown as Record<string, unknown>).signature_cipher
        ) {
          candidateUrl = await format.decipher(innertube.session.player);
        }

        if (!candidateUrl) {
          debugInfo[client] = `Failed to extract stream URL on attempt ${attempt}.`;
          continue;
        }

        const clientUA =
          client === 'IOS'
            ? 'com.google.ios.youtube/19.28.1 (iPhone14,5; U; CPU iOS 17_5_1 like Mac OS X)'
            : client === 'ANDROID'
              ? 'com.google.android.youtube/19.29.37 (Linux; U; Android 13)'
              : client === 'MWEB'
                ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        const testRes = await fetch(candidateUrl, {
          method: 'GET',
          headers: {
            'User-Agent': clientUA,
            Range: 'bytes=0-'
          },
          signal: AbortSignal.timeout(2000)
        });

        if (testRes.status === 403) {
          debugInfo[client] = `Stream URL test returned 403 on attempt ${attempt}.`;
          continue;
        }

        const primaryIndex = defaultWorkingClients.indexOf(client);
        if (primaryIndex > 0) {
          defaultWorkingClients.splice(primaryIndex, 1);
          defaultWorkingClients.unshift(client);
        }

        resolvedStreamUrl = candidateUrl;
        resolvedUA = clientUA;
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
    const isBotChallenge = Object.values(debugInfo).some(
      (m) => m.includes('Sign in to confirm you’re not a bot') || m.includes('Please sign in')
    );
    const failureReason = isBotChallenge
      ? 'YouTube bot protection active (LOGIN_REQUIRED). Please authorize via pnpm youtube:login.'
      : 'All clients failed';

    throw createError({
      statusCode: 500,
      message: t('player.errors.extractFailed', { msg: failureReason }),
      data: { debugInfo }
    });
  }

  let expiresAt = Date.now() + STREAM_CACHE_TTL;
  try {
    const expireParam = new URL(resolvedStreamUrl).searchParams.get('expire');
    if (expireParam) {
      const expMs = Number(expireParam) * 1000;
      if (!Number.isNaN(expMs) && expMs > Date.now()) {
        expiresAt = Math.min(expiresAt, expMs - 60_000);
      }
    }
  } catch {
    expiresAt = Date.now() + STREAM_CACHE_TTL;
  }

  streamCache.set(cacheKey, {
    url: resolvedStreamUrl,
    ua:
      resolvedUA ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expiresAt
  });

  return proxyRequest(event, resolvedStreamUrl, {
    headers: {
      'User-Agent':
        resolvedUA ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
});
