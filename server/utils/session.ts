import type { H3Event } from 'h3';

export async function useAppSession(event: H3Event) {
  const config = useRuntimeConfig();

  const authHeader =
    (event.node?.req?.headers?.authorization as string) ||
    (event.headers && event.headers.get ? event.headers.get('authorization') : undefined);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const cookieHeader =
      (event.node?.req?.headers?.cookie as string) ||
      (event.headers && event.headers.get ? event.headers.get('cookie') : undefined) ||
      '';
    if (!cookieHeader.includes('h3=')) {
      if (event.node?.req?.headers) {
        event.node.req.headers.cookie = cookieHeader
          ? `${cookieHeader}; h3=${token}`
          : `h3=${token}`;
      }
    }
  }

  return useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 365, // 365 days
    cookie: {
      sameSite: 'none',
      secure: true,
      httpOnly: true
    }
  });
}
