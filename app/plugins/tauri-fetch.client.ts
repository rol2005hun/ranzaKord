import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin(() => {
  const isTauriProd = isTauri() && !import.meta.dev;
  const defaultBaseUrl = 'https://kord.ranzak.dev';

  globalThis.$fetch = $fetch.create({
    baseURL: isTauriProd ? defaultBaseUrl : undefined,
    onRequest({ request, options }) {
      options.credentials = 'include';

      const requestUrl = request.toString();
      const isInternalApi = requestUrl.startsWith('/api') || requestUrl.startsWith(defaultBaseUrl);

      const token = localStorage.getItem('auth_token');
      if (token && isInternalApi) {
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        options.headers = headers;
      }
    }
  });
});
