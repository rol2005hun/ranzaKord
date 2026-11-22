export default defineEventHandler((event) => {
  const authHeader =
    (event.node?.req?.headers?.authorization as string) ||
    (event.headers && event.headers.get ? event.headers.get('authorization') : undefined);

  const cookieHeader =
    (event.node?.req?.headers?.cookie as string) ||
    (event.headers && event.headers.get ? event.headers.get('cookie') : undefined) ||
    '';

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (cookieHeader && !cookieHeader.includes('h3=')) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match?.[1]) {
      try {
        token = decodeURIComponent(match[1]);
      } catch {
        token = match[1];
      }
    }
  }

  if (token) {
    const newCookie = cookieHeader ? `${cookieHeader}; h3=${token}` : `h3=${token}`;

    if (event.node?.req?.headers) {
      event.node.req.headers.cookie = newCookie;
    }

    if (event.context.cookies) {
      (event.context.cookies as Record<string, string>).h3 = token;
    }
  }
});
