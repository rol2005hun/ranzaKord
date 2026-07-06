import type { ServerSession } from '../types/auth.server.types';
import { UserModel } from '../models/User';

export interface MeResponse {
  sub: string;
  name: string;
  email: string;
  picture: string;
  hasAccess: boolean;
  role?: string;
  settings?: Record<string, unknown>;
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  const { t } = useServerTranslation(event);
  let session;
  try {
    session = await useAppSession(event);
  } catch {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    await session.clear();
    throw createError({ statusCode: 401, message: t('auth.errors.sessionExpired') });
  }

  const userDoc = await UserModel.findOne({ sub: sessionData.user.sub });

  return {
    sub: sessionData.user.sub,
    name: sessionData.user.name,
    email: sessionData.user.email,
    picture: sessionData.user.picture ?? '',
    hasAccess: userDoc?.hasAccess ?? false,
    settings: userDoc?.settings,
    role: userDoc?.role ?? 'user'
  };
});
