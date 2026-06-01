import type { OAuthTokenResponse, OAuthUser } from '../../types/auth.server.types';
import { UserModel } from '../../models/User';
import enLocale from '../../../app/features/auth/locales/en.json';
import huLocale from '../../../app/features/auth/locales/hu.json';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const error = query['error'] as string | undefined;
  if (error) {
    return sendRedirect(event, '/login', 302);
  }

  const code = query['code'] as string | undefined;
  const state = query['state'] as string | undefined;

  const { t } = useServerTranslation(event);

  if (!code || !state) {
    throw createError({ statusCode: 400, message: t('auth.errors.missingParams') });
  }

  const session = await useAppSession(event);

  if (session.data['oauthState'] !== state) {
    throw createError({ statusCode: 400, message: t('auth.errors.invalidState') });
  }

  const tokenResponse = await $fetch<OAuthTokenResponse>(
    `https://${config.ranzakonnectDomain}/api/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${config.public.baseUrl}/auth/callback`,
        client_id: config.ranzakonnectClientId as string,
        client_secret: config.ranzakonnectClientSecret as string
      }).toString()
    }
  );

  const userInfo = await $fetch<OAuthUser>(
    `https://${config.ranzakonnectDomain}/api/oauth/userinfo`,
    {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
    }
  );

  await UserModel.findOneAndUpdate(
    { sub: userInfo.sub },
    {
      sub: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture ?? ''
    },
    { upsert: true, returnDocument: 'after' }
  );

  const authSource = session.data['authSource'] as string | undefined;
  const desktopAuth = session.data['desktopAuth'] as boolean | undefined;

  await session.update({
    oauthState: null,
    authSource: null,
    desktopAuth: false,
    accessToken: 'valid',
    expiresAt: Date.now() + (tokenResponse.expires_in || 2592000) * 1000,
    user: {
      sub: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture ?? ''
    }
  });

  const setCookieHeaders = getResponseHeader(event, 'set-cookie');
  let sessionToken = '';
  if (setCookieHeaders) {
    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const cookie of cookies) {
      if (typeof cookie === 'string' && cookie.startsWith('h3=')) {
        sessionToken = (cookie.split(';')[0] || '').substring(3);
        break;
      }
    }
  }

  const isTauriApp = desktopAuth || (authSource && authSource.includes('tauri.localhost'));

  if (isTauriApp) {
    const lang = (session.data['lang'] as string) || 'en';
    const localeObj = lang === 'hu' ? huLocale : enLocale;
    const tl = (key: 'successTitle' | 'successMessage' | 'closeWindow' | 'openAppManually') =>
      localeObj.callback[key];

    const deepLinkUrl = `ranzakord://auth?token=${encodeURIComponent(sessionToken)}`;
    setResponseHeader(event, 'content-type', 'text/html');
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${tl('successTitle')}</title>
        <style>
          :root {
            --color-bg: #09090f;
            --color-text-primary: #e8e8f0;
            --color-text-secondary: #9090b0;
            --radius-xl: 24px;
            --radius-lg: 12px;
            --radius-full: 9999px;
            --transition-base: all 0.2s ease;
          }
          body { 
            font-family: system-ui, -apple-system, 'Inter', sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background-color: var(--color-bg); 
            color: var(--color-text-primary); 
            overflow: hidden;
          }
          .bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
          }
          .orb {
            position: absolute;
            border-radius: var(--radius-full);
          }
          .orb-1 {
            width: 500px; height: 500px;
            background: radial-gradient(circle, hsla(265, 75%, 40%, 0.15) 0%, transparent 60%);
            top: -150px; left: -150px;
          }
          .orb-2 {
            width: 400px; height: 400px;
            background: radial-gradient(circle, hsla(195, 80%, 40%, 0.12) 0%, transparent 60%);
            bottom: -100px; right: -100px;
          }
          .container { 
            position: relative;
            z-index: 1;
            text-align: center; 
            padding: 3rem 2.5rem; 
            background: rgba(255, 255, 255, 0.03); 
            border-radius: var(--radius-xl); 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.4); 
            max-width: 420px; 
            width: 90%; 
            animation: fadeIn 0.5s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: var(--radius-full);
            background: hsla(142, 70%, 50%, 0.1);
            margin-bottom: 1.5rem;
          }
          .icon-wrapper svg {
            width: 40px;
            height: 40px;
            color: #4ade80;
          }
          h1 { 
            margin: 0 0 1rem 0; 
            font-size: 1.75rem; 
            font-weight: 700;
            color: var(--color-text-primary);
          }
          p { 
            margin: 0 0 2.5rem 0; 
            color: var(--color-text-secondary); 
            line-height: 1.6; 
            font-size: 1rem;
          }
          button { 
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
            color: white; 
            border: none; 
            padding: 1rem 1.5rem; 
            border-radius: var(--radius-lg); 
            font-size: 1rem; 
            cursor: pointer; 
            transition: var(--transition-base); 
            width: 100%; 
            font-weight: 600; 
            box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
          }
          button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
          }
          button:active {
            transform: translateY(0);
          }
          .manual-link { 
            display: inline-block; 
            margin-top: 1.5rem; 
            font-size: 0.875rem; 
            color: var(--color-text-secondary); 
            text-decoration: none; 
            transition: var(--transition-base); 
          }
          .manual-link:hover { 
            color: var(--color-text-primary); 
          }
        </style>
      </head>
      <body>
        <div class="bg">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
        </div>
        <div class="container">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1>${tl('successTitle')}</h1>
          <p>${tl('successMessage')}</p>
          <button onclick="window.close()">${tl('closeWindow')}</button>
          <br />
          <a class="manual-link" href="${deepLinkUrl}">${tl('openAppManually')}</a>
        </div>
        <script>
          window.onload = function() {
            window.location.href = "${deepLinkUrl}";
            setTimeout(() => { window.close(); }, 3000);
          }
        </script>
      </body>
      </html>
    `;
  }

  const redirectUrl = authSource
    ? `${authSource}/auth/save-token?token=${encodeURIComponent(sessionToken)}`
    : `/auth/save-token?token=${encodeURIComponent(sessionToken)}`;
  return sendRedirect(event, redirectUrl, 302);
});
