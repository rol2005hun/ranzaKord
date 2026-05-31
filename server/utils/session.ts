import type { H3Event } from 'h3';

export async function useAppSession(event: H3Event) {
  const config = useRuntimeConfig();

  return useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  });
}
