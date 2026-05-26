import type { ServerSession } from '../types/auth.server.types';

export interface StreamResponse {
  url: string;
  mimeType: string;
  durationMs: number;
}

export default defineEventHandler(async (event): Promise<StreamResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

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

  const format = formats.find((f) => f.has_audio && (f.url || f.signature_cipher));

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
  const mimeType = format.mime_type ?? 'audio/webm';
  const durationMs =
    'approx_duration_ms' in format && typeof format.approx_duration_ms === 'string'
      ? parseInt(format.approx_duration_ms, 10)
      : 0;

  return { url: streamUrl, mimeType, durationMs };
});
