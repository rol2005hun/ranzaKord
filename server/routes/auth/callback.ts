import type { OAuthTokenResponse, OAuthUser } from '../../types/auth.server.types';
import { UserModel } from '../../models/User';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const error = query['error'] as string | undefined;
  if (error) {
    return sendRedirect(event, '/login', 302);
  }

  const code = query['code'] as string | undefined;
  const state = query['state'] as string | undefined;

  const { t } = useServerTranslation(event);

  if (!code || !state) {
    throw createError({ statusCode: 400, statusMessage: t('auth.errors.missingParams') });
  }

  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });

  if (session.data['oauthState'] !== state) {
    throw createError({ statusCode: 400, statusMessage: t('auth.errors.invalidState') });
  }

  const tokenResponse = await $fetch<OAuthTokenResponse>(
    `https://${config.ranzakonnectDomain}/api/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${config.public.baseUrl}/auth/callback`,
        client_id: config.ranzakonnectClientId as string,
        client_secret: config.ranzakonnectClientSecret as string
      }).toString()
    }
  );

  const userInfo = await $fetch<OAuthUser>(
    `https://${config.ranzakonnectDomain}/api/oauth/userinfo`,
    {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    }
  );

  await UserModel.findOneAndUpdate(
    { sub: userInfo.sub },
    {
      sub: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture ?? ''
    },
    { upsert: true, returnDocument: 'after' }
  );

  await session.update({
    oauthState: null,
    accessToken: 'valid',
    expiresAt: Date.now() + (tokenResponse.expires_in || 2592000) * 1000,
    user: {
      sub: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture ?? ''
    }
  });

  return sendRedirect(event, '/', 302);
});
