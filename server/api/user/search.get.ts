import { UserModel } from '../../models/User';
import { useAppSession } from '../../utils/session';

import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const query = getQuery(event);
  const search = (query.q as string) || '';

  if (!search || search.length < 2) {
    return { users: [] };
  }

  const users = await UserModel.find({
    isPublicProfile: { $ne: false },
    sub: { $ne: sessionData.user.sub },
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
