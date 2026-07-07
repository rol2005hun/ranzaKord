import type { ServerSession } from '../../types/auth.server.types';
import { UserModel } from '../../models/User';

export default defineEventHandler(async (event) => {
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

  const query = getQuery(event);
  const search = (query.q as string) || '';

  if (!search || search.length < 2) {
    return { users: [] };
  }

  const users = await UserModel.find({
    isPublicProfile: true,
    name: { $regex: search, $options: 'i' }
  })
    .select('sub name picture')
    .limit(10)
    .lean();

  return {
    users: users.map((u) => ({
      sub: u.sub,
      name: u.name,
      picture: u.picture || ''
    }))
  };
});
