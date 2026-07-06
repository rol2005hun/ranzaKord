import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin({
  name: 'tauri-fetch',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    const defaultBaseUrl = config.public.baseUrl;

    globalThis.$fetch = $fetch.create({
      baseURL: isTauri() ? defaultBaseUrl : undefined,
      onRequest({ request, options }) {
        const requestUrl = request.toString();
        const isInternalApi =
          requestUrl.startsWith('/api') ||
          requestUrl.startsWith(defaultBaseUrl) ||
          requestUrl.startsWith('http://localhost') ||
          requestUrl.startsWith('http://127.0.0.1');

        if (isInternalApi) {
          options.credentials = isTauri() ? 'omit' : 'include';
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (token) {
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            options.headers = headers;
          }
        }
      }
    });
  }
});
