export default defineNuxtPlugin(async (nuxtApp) => {
  if (!('__TAURI_INTERNALS__' in window)) {
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
        return;
      }

      if (remember) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }

      // Run within Nuxt context to ensure Pinia and Router work
      await nuxtApp.runWithContext(async () => {
        const { fetchUser } = useAuth();
        await fetchUser();
        await navigateTo('/');
      });
    } catch (e) {
      console.error('Failed to process deep link URL:', e);
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
});
