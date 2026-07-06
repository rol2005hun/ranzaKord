import type { FetchRequest, FetchOptions } from 'ofetch';

export default defineNuxtPlugin({
  name: 'auth-interceptor',
  enforce: 'post',
  setup(nuxtApp) {
    const originalFetch = globalThis.$fetch as (
      request: FetchRequest,
      options?: FetchOptions
    ) => Promise<unknown>;

    globalThis.$fetch = (async (request: FetchRequest, options?: FetchOptions) => {
      try {
        return await originalFetch(request, options);
      } catch (error: unknown) {
        const fetchError = error as { response?: { status?: number } };
        if (fetchError?.response?.status === 401 && import.meta.client) {
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
          });

          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');

          const authStore = useAuthStore();
          authStore.clearSession();

          if (
            window.location.pathname !== '/login' &&
            !window.location.pathname.startsWith('/auth/save-token')
          ) {
            nuxtApp.runWithContext(() => {
              navigateTo('/login');
            });
          }
        }
        throw error;
      }
    }) as typeof $fetch;
  }
});
