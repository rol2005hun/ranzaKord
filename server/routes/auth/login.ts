import { randomBytes } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const state = randomBytes(16).toString('hex');
  const desktopAuth = query.desktop === '1';
  const rememberMe = query.remember === '1';

  const session = await useAppSession(event);
  await session.update({
    oauthState: state,
    authSource: query.source || null,
    desktopAuth,
    rememberMe,
    lang: query.lang || 'en'
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.ranzakonnectClientId as string,
    redirect_uri: `${config.public.baseUrl}/auth/callback`,
    state,
    scope: 'openid profile email'
  });

  if (query.lang) {
    params.set('lang', query.lang as string);
  }

  return sendRedirect(
    event,
    `https://${config.ranzakonnectDomain}/oauth/authorize?${params.toString()}`,
    302
  );
});
