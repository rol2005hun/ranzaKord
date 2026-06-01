import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin(() => {
  const isTauriProd = isTauri() && !import.meta.dev;
  const config = useRuntimeConfig();
  const defaultBaseUrl = config.public.baseUrl;

  globalThis.$fetch = $fetch.create({
    baseURL: isTauriProd ? defaultBaseUrl : undefined,
    onRequest({ request, options }) {
      const requestUrl = request.toString();
      const isInternalApi =
        requestUrl.startsWith('/api') ||
        requestUrl.startsWith(defaultBaseUrl) ||
        requestUrl.startsWith('http://localhost') ||
        requestUrl.startsWith('http://127.0.0.1');

      if (isInternalApi) {
        options.credentials = 'include';
        const token = localStorage.getItem('auth_token');
        if (token) {
          const headers = new Headers(options.headers || {});
          headers.set('Authorization', `Bearer ${token}`);
          options.headers = headers;
        }
      }
    }
  });
});
