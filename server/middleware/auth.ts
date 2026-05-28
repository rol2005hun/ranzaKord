import type { ServerSession } from '../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  if (path.startsWith('/api/') && path !== '/api/health') {
    const config = useRuntimeConfig();
    const session = await useSession(event, { password: config.sessionSecret as string });
    const sessionData = session.data as Partial<ServerSession>;
    const { t } = useServerTranslation(event);

    if (!sessionData.accessToken || !sessionData.user) {
      throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
    }
  }
});
