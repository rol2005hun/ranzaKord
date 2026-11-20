export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') && !event.path.startsWith('/auth/')) return;

  const origin =
    (event.node?.req?.headers?.origin as string) ||
    (event.headers && event.headers.get ? event.headers.get('origin') : undefined);

  if (origin) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin);
  } else {
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
  }

  setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true');
  setResponseHeader(
    event,
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  );
  setResponseHeader(
    event,
    'Access-Control-Allow-Headers',
    'Origin, Content-Type, Accept, Authorization, Cookie, x-h3-session'
  );

  if (event.method === 'OPTIONS') {
    return sendNoContent(event);
  }

  return;
});
