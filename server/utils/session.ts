import { getHeader } from 'h3';
import type { H3Event } from 'h3';

export async function useAppSession(event: H3Event) {
  const config = useRuntimeConfig();

  const authHeader = getHeader(event, 'authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const cookieHeader = getHeader(event, 'cookie') || '';
    if (!cookieHeader.includes('h3=')) {
      event.node.req.headers.cookie = cookieHeader ? `${cookieHeader}; h3=${token}` : `h3=${token}`;
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
