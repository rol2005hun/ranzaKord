import { describe, it, expect, vi } from 'vitest';

import corsHandler from '../../server/middleware/00.cors';

describe('00.cors server middleware', () => {
  it('skips non-api and non-auth routes', async () => {
    const headers: Record<string, string> = {};
    const event = {
      path: '/about',
      node: {
        req: {
          headers: {
            origin: 'http://tauri.localhost'
          }
        }
      },
      headers: new Headers({ origin: 'http://tauri.localhost' }),
      method: 'GET'
    } as unknown as Parameters<typeof corsHandler>[0];

    const result = await corsHandler(event);
    expect(result).toBeUndefined();
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('sets cors headers on api routes with origin', async () => {
    const headers: Record<string, string> = {};
    const event = {
      path: '/api/me/playback',
      node: {
        req: {
          headers: {
            origin: 'http://tauri.localhost',
            'access-control-request-headers': 'authorization, x-h3-session'
          }
        },
        res: {
          setHeader: vi.fn((key: string, val: string) => {
            headers[key] = val;
          }),
          removeHeader: vi.fn(),
          writeHead: vi.fn(),
          end: vi.fn()
        }
      },
      headers: new Headers({
        origin: 'http://tauri.localhost',
        'access-control-request-headers': 'authorization, x-h3-session'
      }),
      method: 'OPTIONS'
    } as unknown as Parameters<typeof corsHandler>[0];

    await corsHandler(event);
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'http://tauri.localhost'
    );
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true'
    );
    expect(event.node.res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'authorization, x-h3-session'
    );
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Access-Control-Max-Age', 86400);
  });

  it('sets fallback cors headers when no origin is provided', async () => {
    const event = {
      path: '/api/health',
      node: {
        req: {
          headers: {}
        },
        res: {
          setHeader: vi.fn()
        }
      },
      headers: new Headers(),
      method: 'GET'
    } as unknown as Parameters<typeof corsHandler>[0];

    await corsHandler(event);
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
  });
});
