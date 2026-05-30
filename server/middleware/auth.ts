import type { ServerSession } from '../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const path = event.path;

  if (path.startsWith('/api/') && path !== '/api/health') {
    const config = useRuntimeConfig();
    const session = await useSession(event, {
      password: config.sessionSecret as string,
      maxAge: 60 * 60 * 24 * 30
    });
    const sessionData = session.data as Partial<ServerSession>;
    const { t } = useServerTranslation(event);

    if (!sessionData.accessToken || !sessionData.user) {
      throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
    }
  }
});
