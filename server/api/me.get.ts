import type { ServerSession } from '../types/auth.server.types';

export interface MeResponse {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    await session.clear();
    throw createError({ statusCode: 401, statusMessage: 'Session expired' });
  }

  return {
    sub: sessionData.user.sub,
    name: sessionData.user.name,
    email: sessionData.user.email,
    picture: sessionData.user.picture ?? ''
  };
});
