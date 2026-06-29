import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!isTauri()) {
    return;
  }

  const { onOpenUrl, getCurrent } = await import('@tauri-apps/plugin-deep-link');

  const processUrl = async (urlText: string) => {
    try {
      const url = new URL(urlText);

      const isCustomScheme = url.protocol === 'ranzakord:';
      const isAppLink =
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        url.hostname === 'kord.ranzak.dev' &&
        url.pathname.startsWith('/auth');

      if (!isCustomScheme && !isAppLink) {
        return;
      }

      const token = url.searchParams.get('token');
      const remember = url.searchParams.get('remember') !== '0';

      if (!token) {
        console.warn('[DEEP_LINK] No token found in URL parameters!');
        return;
      }

      if (remember) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }

      // Run within Nuxt context to ensure Pinia and Router work
      await nuxtApp.runWithContext(async () => {
        const { fetchUser, isAuthenticated } = useAuth();
        await fetchUser();
        if (isAuthenticated.value) {
          await navigateTo('/');
        } else {
          console.error(
            '[DEEP_LINK] User is still not authenticated after fetchUser! Token might be rejected.'
          );
        }
      });
    } catch (e) {
      console.error('[DEEP_LINK] Failed to process URL:', e);
    }
  };

  // 1. Check if app was started directly via deep link (Cold Start)
  try {
    const initialUrls = await getCurrent();
    if (initialUrls && initialUrls.length > 0) {
      for (const url of initialUrls) {
        await processUrl(url);
      }
    }
  } catch (e) {
    console.error('Failed to get initial deep link:', e);
  }

  // 2. Listen for deep links while the app is running (Warm Start)
  await onOpenUrl(async (urls: string[]) => {
    for (const urlText of urls) {
      await processUrl(urlText);
      break;
    }
  });

  // 3. Fallback: Native Android evaluateJavascript Bridge!
  // This is the ultimate fallback: MainActivity.kt directly injects a CustomEvent ('android_intent')
  // into the WebView when onNewIntent is triggered, completely bypassing Tauri's event system!
  window.addEventListener('android_intent', async (e: Event) => {
    const event = e as CustomEvent<string>;
    if (event.detail && typeof event.detail === 'string') {
      await processUrl(event.detail);
    }
  });

  // 4. Manually check for deep links when app resumes focus
  window.addEventListener('focus', async () => {
    try {
      const urls = await getCurrent();
      if (urls && urls.length > 0) {
        for (const urlText of urls) {
          await processUrl(urlText);
        }
      }
    } catch {
      // Ignore
    }
  });
});
