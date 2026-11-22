import { defineEventHandler, setResponseHeader, sendNoContent } from 'h3';

import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  if (
    !event.path.startsWith('/api/') &&
    !event.path.startsWith('/auth/') &&
    !event.path.startsWith('/up')
  ) {
    return;
  }

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

  const reqHeaders =
    (event.node?.req?.headers?.['access-control-request-headers'] as string) ||
    (event.headers && event.headers.get
      ? event.headers.get('access-control-request-headers')
      : undefined);

  if (reqHeaders) {
    setResponseHeader(event, 'Access-Control-Allow-Headers', reqHeaders);
  } else {
    setResponseHeader(
      event,
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, Authorization, Cookie, x-h3-session, Cache-Control, Pragma, X-Requested-With, Range'
    );
  }

  setResponseHeader(event, 'Access-Control-Max-Age', 86400);

  if (event.method === 'OPTIONS') {
    return sendNoContent(event);
  }

  return;
});
