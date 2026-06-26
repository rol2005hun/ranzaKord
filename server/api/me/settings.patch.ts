import type { ServerSession } from '../../types/auth.server.types';
import { UserModel } from '../../models/User';

export default defineEventHandler(async (event) => {
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

  const body = await readBody(event);

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Invalid payload' });
  }

  const user = await UserModel.findOne({ sub: sessionData.user.sub });
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  // Merge existing settings with new settings
  user.settings = {
    ...user.settings,
    ...body
  };

  await user.save();

  return { success: true, settings: user.settings };
});
