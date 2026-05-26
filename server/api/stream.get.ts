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

  const format = info.chooseFormat({ type: 'audio', quality: 'best' });

  if (!format) {
    throw createError({ statusCode: 404, statusMessage: 'No audio format available' });
  }

  const streamUrl: string = await format.decipher(innertube.session.player);
  const mimeType = format.mime_type ?? 'audio/webm';
  const durationMs =
    'approx_duration_ms' in format && typeof format.approx_duration_ms === 'string'
      ? parseInt(format.approx_duration_ms, 10)
      : 0;

  return { url: streamUrl, mimeType, durationMs };
});
