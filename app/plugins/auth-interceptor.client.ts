import type { FetchRequest, FetchOptions } from 'ofetch';

export default defineNuxtPlugin({
  name: 'auth-interceptor',
  enforce: 'post',
  setup() {
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

          const authStore = useAuthStore();
          authStore.clearSession();

          if (
            window.location.pathname !== '/login' &&
            !window.location.pathname.startsWith('/auth/save-token')
          ) {
            window.location.href = '/login';
          }
        }
        throw error;
      }
    }) as typeof $fetch;
  }
});
