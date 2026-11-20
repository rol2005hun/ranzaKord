import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin({
  name: 'tauri-fetch',
  enforce: 'pre',
  setup(nuxtApp) {
    const config = useRuntimeConfig();
    const rawBaseUrl = config.public.baseUrl || 'https://kord.ranzak.dev';
    const defaultBaseUrl = rawBaseUrl.replace(/\/+$/, '');

    if (import.meta.test && !process.env.TEST_TAURI_FETCH) return;

    const customFetch = $fetch.create({
      baseURL: isTauri() ? defaultBaseUrl : undefined,
      onRequest({ request, options }) {
        const requestUrl = request.toString();
        const isInternalApi =
          requestUrl.startsWith('/api') ||
          requestUrl.startsWith('/auth') ||
          Boolean(defaultBaseUrl && requestUrl.startsWith(defaultBaseUrl)) ||
          requestUrl.startsWith('http://localhost') ||
          requestUrl.startsWith('http://127.0.0.1');

        if (isInternalApi) {
          options.credentials = isTauri() ? 'omit' : 'include';
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (token) {
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            headers.set('x-h3-session', token);
            options.headers = headers;
          }
        }
      }
    });

    globalThis.$fetch = customFetch;
    nuxtApp.$fetch = customFetch;

    return {
      provide: {
        fetch: customFetch
      }
    };
  }
});
