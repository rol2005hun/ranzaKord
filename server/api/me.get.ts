import type { ServerSession } from '../types/auth.server.types';

export interface MeResponse {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  const config = useRuntimeConfig();
  const { t } = useServerTranslation(event);
  let session;
  try {
    session = await useSession(event, { password: config.sessionSecret as string });
  } catch {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    await session.clear();
    throw createError({ statusCode: 401, statusMessage: t('auth.errors.sessionExpired') });
  }

  return {
    sub: sessionData.user.sub,
    name: sessionData.user.name,
    email: sessionData.user.email,
    picture: sessionData.user.picture ?? ''
  };
});
