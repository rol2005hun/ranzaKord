import type { H3Event } from 'h3';

export async function useAppSession(event: H3Event) {
  const config = useRuntimeConfig();

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
