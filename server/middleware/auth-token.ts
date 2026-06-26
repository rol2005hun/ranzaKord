export default defineEventHandler((event) => {
  const authHeader =
    (event.node?.req?.headers?.authorization as string) ||
    (event.headers && event.headers.get ? event.headers.get('authorization') : undefined);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const existingCookie =
        (event.node?.req?.headers?.cookie as string) ||
        (event.headers && event.headers.get ? event.headers.get('cookie') : undefined);
      const newCookie = existingCookie ? `${existingCookie}; h3=${token}` : `h3=${token}`;

      if (event.node?.req?.headers) {
        event.node.req.headers.cookie = newCookie;
      }

      // Ensure h3's internal cookie cache is updated if it was already parsed
      if (event.context.cookies) {
        (event.context.cookies as Record<string, string>).h3 = token;
      }
    }
  }
});
