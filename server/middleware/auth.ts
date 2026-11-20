import type { ServerSession } from '../types/auth.server.types';

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') {
    return;
  }

  const path = event.path;

  if (
    path.startsWith('/api/') &&
    !path.startsWith('/api/health') &&
    !path.startsWith('/api/proxy-image') &&
    !path.startsWith('/api/stream') &&
    !path.startsWith('/api/updater') &&
    !path.startsWith('/api/search') &&
    !path.startsWith('/api/home/featured-tracks') &&
    !path.startsWith('/api/user/profile')
  ) {
    const { t } = useServerTranslation(event);
    let sessionData: Partial<ServerSession>;

    try {
      const session = await useAppSession(event);
      sessionData = session.data as Partial<ServerSession>;
    } catch {
      throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
    }

    if (!sessionData.accessToken || !sessionData.user) {
      throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
    }
  }
});
