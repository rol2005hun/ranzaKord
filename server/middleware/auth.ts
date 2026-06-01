import type { ServerSession } from '../types/auth.server.types';

export default defineEventHandler(async (event) => {
  if (event.node.req.method === 'OPTIONS') {
    return;
  }

  const path = event.path;

  if (
    path.startsWith('/api/') &&
    !path.startsWith('/api/health') &&
    !path.startsWith('/api/image') &&
    !path.startsWith('/api/stream')
  ) {
    const session = await useAppSession(event);
    const sessionData = session.data as Partial<ServerSession>;
    const { t } = useServerTranslation(event);

    if (!sessionData.accessToken || !sessionData.user) {
      throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
    }
  }
});
