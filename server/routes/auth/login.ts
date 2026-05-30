import { randomBytes } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const state = randomBytes(16).toString('hex');

  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  await session.update({ oauthState: state });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.ranzakonnectClientId as string,
    redirect_uri: `${config.public.baseUrl}/auth/callback`,
    state,
    scope: 'openid profile email'
  });

  return sendRedirect(
    event,
    `https://${config.ranzakonnectDomain}/oauth/authorize?${params.toString()}`,
    302
  );
});
