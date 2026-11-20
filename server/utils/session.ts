import { useSession, unsealSession, getRequestHeader, createError } from 'h3';

import { UserModel } from '../models/User';

import type { H3Event, Session, SessionConfig } from 'h3';
import type { ServerSession } from '../types/auth.server.types';

export function getSessionConfig(event: H3Event): SessionConfig {
  const config = useRuntimeConfig();
  const host = getRequestHeader(event, 'host') || '';
  const isSecure = !host.includes('localhost') && !host.match(/^\d{1,3}\./);
  const rawSecret = (config.sessionSecret as string) || process.env.NUXT_SESSION_SECRET || '';
  const sessionSecret = rawSecret.length >= 32 ? rawSecret : 'dev-secret-min-32-characters-long';

  return {
    name: 'h3',
    password: sessionSecret,
    maxAge: 60 * 60 * 24 * 365,
    cookie: {
      sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
      secure: isSecure,
      httpOnly: true
    }
  };
}

export async function useAppSession(event: H3Event) {
  const sessionConfig = getSessionConfig(event);
  const sessionName = sessionConfig.name || 'h3';

  const authHeader =
    getRequestHeader(event, 'authorization') ||
    (event.node?.req?.headers?.authorization as string) ||
    (event.headers && event.headers.get ? event.headers.get('authorization') : undefined);

  const customHeader =
    getRequestHeader(event, 'x-h3-session') ||
    (event.node?.req?.headers?.['x-h3-session'] as string) ||
    (event.headers && event.headers.get ? event.headers.get('x-h3-session') : undefined);

  let rawToken = customHeader;
  if (!rawToken && authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  }

  if (rawToken) {
    let token: string;
    try {
      token = decodeURIComponent(rawToken);
    } catch {
      token = rawToken;
    }

    try {
      const unsealed = await unsealSession(event, sessionConfig, token);
      if (unsealed && typeof unsealed === 'object') {
        const fullSession: Session = {
          id: unsealed.id || 'session',
          createdAt: unsealed.createdAt || Date.now(),
          data: (unsealed.data || {}) as Record<string, unknown>
        };
        if (!event.context.sessions) {
          event.context.sessions = {} as Record<string, Session>;
        }
        (event.context.sessions as Record<string, Session>)[sessionName] = fullSession;
        return useSession(event, sessionConfig);
      }
    } catch {
      try {
        const unsealedRaw = await unsealSession(event, sessionConfig, rawToken);
        if (unsealedRaw && typeof unsealedRaw === 'object') {
          const fullSession: Session = {
            id: unsealedRaw.id || 'session',
            createdAt: unsealedRaw.createdAt || Date.now(),
            data: (unsealedRaw.data || {}) as Record<string, unknown>
          };
          if (!event.context.sessions) {
            event.context.sessions = {} as Record<string, Session>;
          }
          (event.context.sessions as Record<string, Session>)[sessionName] = fullSession;
          return useSession(event, sessionConfig);
        }
      } catch {
        void 0;
      }
    }

    const cookieHeader =
      (event.headers && event.headers.get ? event.headers.get('cookie') : undefined) ||
      (event.node?.req?.headers?.cookie as string) ||
      '';
    if (!cookieHeader.includes('session=') && !cookieHeader.includes('h3=')) {
      const newCookie = cookieHeader ? `${cookieHeader}; h3=${token}` : `h3=${token}`;
      if (event.node?.req?.headers) {
        event.node.req.headers.cookie = newCookie;
      }
      if (event.headers && event.headers.set) {
        event.headers.set('cookie', newCookie);
      }
    }
  }

  return useSession(event, sessionConfig);
}

export async function assertDeveloperSession(event: H3Event): Promise<ServerSession> {
  const { t } = useServerTranslation(event);
  let session;
  try {
    session = await useAppSession(event);
  } catch {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const sessionData = session.data as Partial<ServerSession>;
  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
    await session.clear();
    throw createError({ statusCode: 401, message: t('auth.errors.sessionExpired') });
  }

  const userDoc = await UserModel.findOne({ sub: sessionData.user.sub });
  const roles = (userDoc?.roles || []).map((r) => r.toLowerCase());
  const isDev = roles.some((r) => ['developer', 'dev', 'admin', 'ranzakreator'].includes(r));
  if (!isDev) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  return sessionData as ServerSession;
}
