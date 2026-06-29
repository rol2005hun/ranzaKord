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

  const host = getRequestHeader(event, 'host');
  const protocol = host?.includes('localhost') || host?.match(/^\d{1,3}\./) ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/auth/callback`;

  const tokenResponse = await $fetch<OAuthTokenResponse>(
    `https://${config.ranzakonnectDomain}/api/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
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
  const rememberMe = session.data['rememberMe'] as boolean | undefined;

  await session.update({
    oauthState: null,
    authSource: null,
    desktopAuth: false,
    rememberMe,
    accessToken: 'valid',
    expiresAt: rememberMe
      ? Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      : Date.now() + (tokenResponse.expires_in || 86400) * 1000,
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
    const newHeaders = [...cookies];

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      if (typeof cookie === 'string' && cookie.startsWith('h3=')) {
        sessionToken = (cookie.split(';')[0] || '').substring(3);

        if (!rememberMe) {
          cookie = cookie.replace(/Max-Age=\d+;?\s*/i, '').replace(/Expires=[^;]+;?\s*/i, '');
          newHeaders[i] = cookie;
        }
      }
    }

    if (!rememberMe) {
      setResponseHeader(event, 'set-cookie', newHeaders);
    }
  }

  const isTauriApp = desktopAuth || (authSource && authSource.includes('tauri.localhost'));

  if (isTauriApp) {
    const lang = (session.data['lang'] as string) || 'en';
    const localeObj = lang === 'hu' ? huLocale : enLocale;
    const tl = (key: 'successTitle' | 'successMessage' | 'closeWindow' | 'openAppManually') =>
      localeObj.callback[key];

    const rememberParam = rememberMe ? '1' : '0';
    const deepLinkUrl = `ranzakord://auth?token=${encodeURIComponent(sessionToken)}&remember=${rememberParam}`;
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
            --color-bg: #0b0b12;
            --color-card: #12121c;
            --color-text-primary: #e8e8f0;
            --color-text-secondary: #8b8b9e;
            --color-brand: #7c3aed;
            --color-brand-light: #9353d3;
            --radius-xl: 16px;
            --radius-lg: 8px;
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
          .container { 
            position: relative;
            z-index: 1;
            text-align: center; 
            padding: 3.5rem 2.5rem; 
            background: var(--color-card); 
            border-radius: var(--radius-xl); 
            border: 1px solid rgba(255, 255, 255, 0.03); 
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); 
            max-width: 380px; 
            width: 90%; 
            animation: fadeIn 0.5s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 2.5rem;
          }
          .logo .note {
            color: var(--color-brand);
            font-size: 1.25rem;
          }
          .logo .ranza {
            color: var(--color-brand-light);
          }
          .logo .kord {
            color: var(--color-text-primary);
          }
          h1 { 
            margin: 0 0 1rem 0; 
            font-size: 1.5rem; 
            font-weight: 700;
            color: var(--color-text-primary);
          }
          p { 
            margin: 0 0 2.5rem 0; 
            color: var(--color-text-secondary); 
            line-height: 1.6; 
            font-size: 0.95rem;
          }
          button { 
            background: #3b1480; 
            color: #d8b4fe; 
            border: none; 
            padding: 0.875rem 1.5rem; 
            border-radius: var(--radius-lg); 
            font-size: 0.95rem; 
            cursor: pointer; 
            transition: var(--transition-base); 
            width: 100%; 
            font-weight: 600; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
          }
          button:hover { 
            background: #4c1d95; 
            color: #e9d5ff;
          }
          .manual-link { 
            display: inline-block; 
            margin-top: 2rem; 
            font-size: 0.75rem; 
            color: rgba(255,255,255,0.3); 
            text-decoration: none; 
            transition: var(--transition-base); 
          }
          .manual-link:hover { 
            color: rgba(255,255,255,0.6); 
          }
          .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(216, 180, 254, 0.3);
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span class="note">♪</span>
            <div><span class="ranza">ranza</span><span class="kord">Kord</span></div>
          </div>
          <h1>${tl('successTitle')}</h1>
          <p>${tl('successMessage')}</p>
          <button onclick="window.close()">
            <div class="spinner"></div>
            ${tl('closeWindow')}
          </button>
          <a class="manual-link" href="${deepLinkUrl}">${tl('openAppManually')}</a>
        </div>
        <script>
          window.onload = function() {
            window.location.href = "${deepLinkUrl}";
            document.addEventListener("visibilitychange", function() {
              if (document.visibilityState === "hidden") {
                window.close();
              }
            });
          }
        </script>
      </body>
      </html>
    `;
  }

  const redirectUrl =
    authSource && !authSource.includes('tauri.localhost')
      ? `${authSource}/auth/save-token?token=${encodeURIComponent(sessionToken)}&remember=${rememberMe ? '1' : '0'}`
      : `/auth/save-token?token=${encodeURIComponent(sessionToken)}&remember=${rememberMe ? '1' : '0'}`;

  return sendRedirect(event, redirectUrl, 302);
});
