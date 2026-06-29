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
        (url.protocol === 'https:' || url.protocol === 'http:') && url.pathname.startsWith('/auth');

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
    } catch (err) {
      console.error('[DEEP_LINK] Failed to process URL:', err);
    }
  };

  // Register the official Tauri deep link listener (Mac, Android, iOS, Windows with single-instance)
  try {
    await onOpenUrl((urls: string[]) => {
      for (const url of urls) {
        processUrl(url);
      }
    });
  } catch (e) {
    console.error('[DEEP_LINK] Failed to register onOpenUrl listener:', e);
  }

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
