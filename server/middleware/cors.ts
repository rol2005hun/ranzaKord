export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) return;

  const origin = getRequestHeader(event, 'origin');

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
    'Origin, Content-Type, Accept, Authorization, Cookie'
  );

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204, 'No Content');
    return 'OK';
  }
});
