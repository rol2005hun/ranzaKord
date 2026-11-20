import { resetAnonymousInnertube } from '../utils/innertube';

import type { H3Event } from 'h3';
import type { Innertube } from 'youtubei.js';

type ClientType =
  | 'ANDROID'
  | 'ANDROID_VR'
  | 'VISIONOS'
  | 'MWEB'
  | 'IOS'
  | 'YTMUSIC'
  | 'WEB'
  | 'TV'
  | 'TV_SIMPLY'
  | 'TV_EMBEDDED'
  | 'WEB_CREATOR';

interface CachedStream {
  url: string;
  client: ClientType;
  contentLength?: number;
  mimeType?: string;
  expiresAt: number;
}

interface CandidateSpec {
  client: ClientType;
  useAuth: boolean;
}

interface DecipherResult {
  url?: string;
  error?: string;
}

interface StreamFetchResult {
  res: Response | null;
  statusText?: string;
  isFatalError?: boolean;
  isRangeNotSatisfiable?: boolean;
}

interface ByteRange {
  start: number;
  end: number;
}

interface CandidateFormat {
  url?: string;
  mime_type?: string;
  content_length?: number;
  has_video?: boolean;
  has_audio?: boolean;
  decipher?: (player: unknown) => Promise<string>;
}

const streamCache = new Map<string, CachedStream>();
const inFlightDiscovery = new Map<string, Promise<CachedStream | null>>();
const STREAM_CACHE_TTL = 2 * 60 * 60 * 1000;
const CHUNK_SIZE = 512 * 1024;
const MAX_DISCOVERY_TIME_MS = 25000;
const CLIENT_TIMEOUT_MS = 5000;
const STREAM_CONNECT_TIMEOUT_MS = 6000;

function isPlayableFormat(format: CandidateFormat): boolean {
  const raw = format as unknown as { signature_cipher?: string; cipher?: string };
  return Boolean(format.url || raw.signature_cipher || raw.cipher);
}

function parseByteRange(clientRange: string | undefined): ByteRange {
  if (!clientRange) {
    return { start: 0, end: CHUNK_SIZE - 1 };
  }
  const match = /^bytes=(\d+)-(\d+)?$/i.exec(clientRange.trim());
  if (!match || !match[1]) {
    return { start: 0, end: CHUNK_SIZE - 1 };
  }
  const start = Number.parseInt(match[1], 10);
  if (Number.isNaN(start)) {
    return { start: 0, end: CHUNK_SIZE - 1 };
  }
  if (match[2]) {
    const end = Number.parseInt(match[2], 10);
    if (!Number.isNaN(end) && end >= start) {
      if (end - start + 1 > CHUNK_SIZE) {
        return { start, end: start + CHUNK_SIZE - 1 };
      }
      return { start, end };
    }
  }
  return { start, end: start + CHUNK_SIZE - 1 };
}

function getValidRange(range: ByteRange, contentLength?: number): ByteRange | null {
  if (contentLength && contentLength > 0) {
    if (range.start >= contentLength) {
      return null;
    }
    const end = Math.min(range.end, contentLength - 1);
    const start = Math.min(range.start, end);
    return { start, end };
  }
  return range;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const ANDROID_USER_AGENT = 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip';

const IOS_USER_AGENT = 'com.google.ios.youtube/19.09.3 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X)';

async function fetchYouTubeStream(
  url: string,
  client: ClientType,
  range: ByteRange
): Promise<StreamFetchResult> {
  const rangeHeader = `bytes=${range.start}-${range.end}`;

  let userAgent = DEFAULT_USER_AGENT;
  if (client === 'ANDROID' || client === 'ANDROID_VR') {
    userAgent = ANDROID_USER_AGENT;
  } else if (client === 'IOS' || client === 'VISIONOS') {
    userAgent = IOS_USER_AGENT;
  }

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    Accept: '*/*',
    'Accept-Encoding': 'identity',
    Range: rangeHeader
  };

  if (client === 'YTMUSIC') {
    headers['Origin'] = 'https://music.youtube.com';
    headers['Referer'] = 'https://music.youtube.com/';
  } else if (client === 'MWEB' || client === 'WEB') {
    headers['Origin'] = 'https://www.youtube.com';
    headers['Referer'] = 'https://www.youtube.com/';
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(STREAM_CONNECT_TIMEOUT_MS)
      });
      if (res.status === 200 || res.status === 206) {
        return { res };
      }
      if (res.status === 416) {
        res.body?.cancel();
        return { res: null, statusText: 'Range Not Satisfiable', isRangeNotSatisfiable: true };
      }
      if (res.status === 403 || res.status === 410) {
        const statusText = `HTTP ${res.status} ${res.statusText}`;
        res.body?.cancel();
        return { res: null, statusText, isFatalError: true };
      }
      res.body?.cancel();
    } catch (err) {
      if (attempt === 1) {
        return { res: null, statusText: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  return { res: null, statusText: 'Upstream fetch failed after retries' };
}

async function pipeUpstreamResponse(
  event: H3Event,
  upstreamRes: Response,
  range?: ByteRange,
  contentLength?: number,
  cachedEntry?: CachedStream
): Promise<unknown> {
  const isRangedRequest = Boolean(range);
  const responseStatus = isRangedRequest ? 206 : upstreamRes.status;
  setResponseStatus(event, responseStatus);

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Accept, Origin, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Accept-Ranges': 'bytes'
  });

  const contentType = upstreamRes.headers.get('content-type') || 'audio/mp4';
  setResponseHeader(event, 'content-type', contentType);

  let finalContentLength = contentLength;
  const upstreamRange = upstreamRes.headers.get('content-range');
  if (upstreamRange) {
    const match = /\/(\d+)$/.exec(upstreamRange);
    if (match?.[1]) {
      const parsedTotal = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsedTotal) && parsedTotal > 0) {
        finalContentLength = parsedTotal;
        if (cachedEntry) {
          cachedEntry.contentLength = parsedTotal;
        }
      }
    }
  }

  if (isRangedRequest && range) {
    const rawLen = upstreamRes.headers.get('content-length');
    const actualLength = rawLen ? Number.parseInt(rawLen, 10) : range.end - range.start + 1;
    const totalStr = finalContentLength ? String(finalContentLength) : '*';
    const contentRange = upstreamRange || `bytes ${range.start}-${range.end}/${totalStr}`;
    setResponseHeader(event, 'content-range', contentRange);
    setResponseHeader(event, 'content-length', actualLength);
  } else {
    const upstreamLength = upstreamRes.headers.get('content-length');
    if (upstreamLength) {
      setResponseHeader(event, 'content-length', Number.parseInt(upstreamLength, 10));
    }
  }

  if (!upstreamRes.body) {
    return send(event, '');
  }
  return sendStream(event, upstreamRes.body);
}

async function fetchBasicInfoWithTimeout(
  innertube: Innertube,
  videoId: string,
  client: ClientType,
  timeoutMs: number
) {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout fetching stream info for client ${client}`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([innertube.getBasicInfo(videoId, { client }), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function extractCandidateUrl(
  format: CandidateFormat,
  primaryPlayer: unknown,
  fallbackPlayer?: unknown
): Promise<DecipherResult> {
  const raw = format as unknown as { signature_cipher?: string; cipher?: string };
  if (typeof format.decipher === 'function' && (raw.signature_cipher || raw.cipher)) {
    let decipherErr: string | undefined;
    try {
      const result = await format.decipher(primaryPlayer);
      if (result && result.length > 0) return { url: result };
    } catch (err) {
      decipherErr = err instanceof Error ? err.message : String(err);
    }
    if (fallbackPlayer && fallbackPlayer !== primaryPlayer) {
      try {
        const result = await format.decipher(fallbackPlayer);
        if (result && result.length > 0) return { url: result };
      } catch (err) {
        decipherErr = err instanceof Error ? err.message : String(err);
      }
    }
    return { error: decipherErr || 'Deciphering produced empty URL' };
  }
  return { url: format.url };
}

function parseCacheExpiry(streamUrl: string): number {
  try {
    const expireParam = new URL(streamUrl).searchParams.get('expire');
    if (expireParam) {
      const expMs = Number(expireParam) * 1000;
      if (!Number.isNaN(expMs) && expMs > Date.now()) {
        return Math.min(Date.now() + STREAM_CACHE_TTL, expMs - 60_000);
      }
    }
  } catch {
    void 0;
  }
  return Date.now() + STREAM_CACHE_TTL;
}

async function discoverStream(
  vid: string,
  streamType: string,
  debugInfo: Record<string, string>
): Promise<CachedStream | null> {
  const innertube = await createInnertube(true);
  const isTvOAuth = Boolean(innertube.session.logged_in && innertube.session.oauth?.oauth2_tokens);
  const candidateSpecs: CandidateSpec[] = isTvOAuth
    ? [
        { client: 'TV_SIMPLY', useAuth: true },
        { client: 'TV', useAuth: true },
        { client: 'TV_EMBEDDED', useAuth: true },
        { client: 'ANDROID_VR', useAuth: false },
        { client: 'VISIONOS', useAuth: false },
        { client: 'ANDROID', useAuth: false },
        { client: 'YTMUSIC', useAuth: false },
        { client: 'IOS', useAuth: false },
        { client: 'MWEB', useAuth: false },
        { client: 'WEB', useAuth: false }
      ]
    : [
        { client: 'TV_SIMPLY', useAuth: false },
        { client: 'ANDROID_VR', useAuth: false },
        { client: 'VISIONOS', useAuth: false },
        { client: 'ANDROID', useAuth: false },
        { client: 'YTMUSIC', useAuth: false },
        { client: 'IOS', useAuth: false },
        { client: 'MWEB', useAuth: false },
        { client: 'WEB', useAuth: false }
      ];

  const startTime = Date.now();
  let anonInnertube: Innertube | null = null;

  for (const candidate of candidateSpecs) {
    if (Date.now() - startTime > MAX_DISCOVERY_TIME_MS) {
      debugInfo['timeout'] = 'Max discovery time exceeded, aborting candidate loop';
      break;
    }

    try {
      const targetInnertube = candidate.useAuth
        ? innertube
        : (anonInnertube ??= await createInnertube(false));

      const info = await fetchBasicInfoWithTimeout(
        targetInnertube,
        vid,
        candidate.client,
        CLIENT_TIMEOUT_MS
      );

      const formats = [
        ...(info.streaming_data?.formats || []),
        ...(info.streaming_data?.adaptive_formats || [])
      ] as CandidateFormat[];

      const candidateFormats: CandidateFormat[] = [];
      if (streamType === 'video') {
        const v720 = formats.filter(
          (f) =>
            f.has_video &&
            f.has_audio &&
            isPlayableFormat(f) &&
            (f as unknown as { height?: number }).height &&
            ((f as unknown as { height?: number }).height as number) <= 720
        );
        const vAny = formats.filter((f) => f.has_video && f.has_audio && isPlayableFormat(f));
        candidateFormats.push(...v720, ...vAny);
      } else {
        const audioOnly = formats.filter((f) => f.has_audio && !f.has_video && isPlayableFormat(f));
        const audioCombined = formats.filter((f) => f.has_audio && isPlayableFormat(f));
        candidateFormats.push(...audioOnly, ...audioCombined);
      }

      if (candidateFormats.length === 0) {
        const status = info.playability_status?.status || 'UNKNOWN';
        const reason = info.playability_status?.reason || 'No reason provided';
        debugInfo[candidate.client] =
          `No ${streamType} format found. Status: ${status}. Reason: ${reason}.`;
        continue;
      }

      for (const format of candidateFormats) {
        const decipherResult = await extractCandidateUrl(
          format,
          targetInnertube.session.player,
          innertube.session.player
        );

        const candidateUrl = decipherResult.url;
        if (!candidateUrl) {
          debugInfo[candidate.client] = decipherResult.error
            ? `Failed to decipher stream URL: ${decipherResult.error}`
            : 'Failed to extract stream URL.';
          continue;
        }

        const testRange: ByteRange = { start: 0, end: 1024 };
        const { res: streamRes, statusText } = await fetchYouTubeStream(
          candidateUrl,
          candidate.client,
          testRange
        );

        if (!streamRes) {
          debugInfo[candidate.client] = `Stream fetch failed: ${statusText || 'unknown error'}`;
          continue;
        }
        streamRes.body?.cancel();

        if (format.content_length && format.content_length > 1048576) {
          const testRange2: ByteRange = { start: 1048576, end: 1049600 };
          const { res: streamRes2 } = await fetchYouTubeStream(
            candidateUrl,
            candidate.client,
            testRange2
          );
          if (!streamRes2) {
            debugInfo[candidate.client] =
              'Stream capped at 1MB by YouTube anti-bot restriction, trying fallback format';
            continue;
          }
          streamRes2.body?.cancel();
        }

        return {
          url: candidateUrl,
          client: candidate.client,
          contentLength: format.content_length,
          mimeType: format.mime_type,
          expiresAt: parseCacheExpiry(candidateUrl)
        };
      }
    } catch (e) {
      debugInfo[candidate.client] = e instanceof Error ? e.message : String(e);
    }
  }

  resetAnonymousInnertube();
  return null;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoId = query['v'] as string | undefined;
  const streamType = (query['type'] as string | undefined) ?? 'audio';
  const shouldRedirect = query['redirect'] === '1' || query['redirect'] === 'true';
  const { t } = useServerTranslation(event);
  const clientRange = getRequestHeader(event, 'range');
  const parsedRange = parseByteRange(clientRange);

  if (!videoId || videoId.trim().length === 0) {
    throw createError({ statusCode: 400, message: t('player.errors.missingVideoId') });
  }

  const vid = videoId.trim();
  const cacheKey = `${vid}_${streamType}`;
  const cached = streamCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    const validRange = getValidRange(parsedRange, cached.contentLength);
    if (!validRange) {
      setResponseStatus(event, 416);
      setResponseHeader(event, 'content-range', `bytes */${cached.contentLength || '*'}`);
      setResponseHeader(event, 'content-length', 0);
      return '';
    }

    if (shouldRedirect) {
      return sendRedirect(event, cached.url, 302);
    }

    const {
      res: cachedRes,
      isFatalError,
      isRangeNotSatisfiable
    } = await fetchYouTubeStream(cached.url, cached.client, validRange);

    if (cachedRes) {
      return pipeUpstreamResponse(event, cachedRes, validRange, cached.contentLength, cached);
    }

    if (isRangeNotSatisfiable) {
      setResponseStatus(event, 416);
      setResponseHeader(event, 'content-range', `bytes */${cached.contentLength || '*'}`);
      setResponseHeader(event, 'content-length', 0);
      return '';
    }

    if (isFatalError) {
      streamCache.delete(cacheKey);
    }
  }

  const debugInfo: Record<string, string> = {};

  let discoveryPromise = inFlightDiscovery.get(cacheKey);
  if (!discoveryPromise) {
    discoveryPromise = discoverStream(vid, streamType, debugInfo);
    inFlightDiscovery.set(cacheKey, discoveryPromise);
  }

  const discovered = await discoveryPromise.finally(() => {
    inFlightDiscovery.delete(cacheKey);
  });

  if (discovered) {
    streamCache.set(cacheKey, discovered);

    const validRange = getValidRange(parsedRange, discovered.contentLength);
    if (!validRange) {
      setResponseStatus(event, 416);
      setResponseHeader(event, 'content-range', `bytes */${discovered.contentLength || '*'}`);
      setResponseHeader(event, 'content-length', 0);
      return '';
    }

    if (shouldRedirect) {
      return sendRedirect(event, discovered.url, 302);
    }

    const {
      res: streamRes,
      statusText,
      isRangeNotSatisfiable
    } = await fetchYouTubeStream(discovered.url, discovered.client, validRange);

    if (streamRes) {
      return pipeUpstreamResponse(
        event,
        streamRes,
        validRange,
        discovered.contentLength,
        discovered
      );
    }

    if (isRangeNotSatisfiable) {
      setResponseStatus(event, 416);
      setResponseHeader(event, 'content-range', `bytes */${discovered.contentLength || '*'}`);
      setResponseHeader(event, 'content-length', 0);
      return '';
    }

    debugInfo[discovered.client] = `Stream fetch failed: ${statusText || 'unknown error'}`;
  }

  const isBotChallenge = Object.values(debugInfo).some(
    (m) => m.includes('Sign in to confirm you') || m.includes('Please sign in')
  );
  const isIpBlocked = Object.values(debugInfo).every(
    (m) =>
      m.includes('LOGIN_REQUIRED') ||
      m.includes('Sign in to confirm you') ||
      m.includes('This video is unavailable') ||
      m.includes('UNPLAYABLE')
  );
  const failureReason =
    isBotChallenge && isIpBlocked
      ? 'YouTube IP block on server (datacenter IP). This video cannot be streamed from this server.'
      : isBotChallenge
        ? 'YouTube bot protection active (LOGIN_REQUIRED). Please authorize via pnpm youtube:login.'
        : 'All clients failed';

  throw createError({
    statusCode: 500,
    message: t('player.errors.extractFailed', { msg: failureReason }),
    data: { debugInfo }
  });
});
