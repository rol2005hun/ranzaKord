import type { H3Event } from 'h3';

export async function useAppSession(event: H3Event) {
  const config = useRuntimeConfig();

  const authHeader =
    (event.node?.req?.headers?.authorization as string) ||
    (event.headers && event.headers.get ? event.headers.get('authorization') : undefined);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const cookieHeader =
      (event.headers && event.headers.get ? event.headers.get('cookie') : undefined) ||
      (event.node?.req?.headers?.cookie as string) ||
      '';
    if (!cookieHeader.includes('h3=')) {
      const newCookie = cookieHeader ? `${cookieHeader}; h3=${token}` : `h3=${token}`;
      if (event.node?.req?.headers) {
        event.node.req.headers.cookie = newCookie;
      }
      if (event.headers && event.headers.set) {
        event.headers.set('cookie', newCookie);
      }
    }
  }

  const host = getRequestHeader(event, 'host') || '';
  const isSecure = !host.includes('localhost') && !host.match(/^\d{1,3}\./);

  return useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 365, // 365 days
    cookie: {
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      httpOnly: true
    }
  });
}
