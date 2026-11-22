import { setResponseHeader } from 'h3';

import type { H3Event } from 'h3';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event: H3Event) => {
    const path = event.path || '';
    if (path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/up')) {
      const origin =
        (event.node?.req?.headers?.origin as string) ||
        (event.headers && event.headers.get ? event.headers.get('origin') : undefined);

      if (origin) {
        setResponseHeader(event, 'Access-Control-Allow-Origin', origin);
        setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true');
      }
    }
  });

  nitroApp.hooks.hook('error', async (_error, { event }) => {
    if (event) {
      const h3Event = event as H3Event;
      const path = h3Event.path || '';
      if (path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/up')) {
        const origin =
          (h3Event.node?.req?.headers?.origin as string) ||
          (h3Event.headers && h3Event.headers.get ? h3Event.headers.get('origin') : undefined);

        if (origin) {
          setResponseHeader(h3Event, 'Access-Control-Allow-Origin', origin);
          setResponseHeader(h3Event, 'Access-Control-Allow-Credentials', 'true');
        }
      }
    }
  });
});
