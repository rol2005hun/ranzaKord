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

  const host = getRequestHeader(event, 'host');
  const protocol = host?.includes('localhost') || host?.match(/^\d{1,3}\./) ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/auth/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.ranzakonnectClientId as string,
    redirect_uri: redirectUri,
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
