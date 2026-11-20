import { isTauriApp } from '@/utils/tauri';

export default defineNuxtPlugin({
  name: 'tauri-fetch',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    const rawBaseUrl = config.public.baseUrl || 'https://kord.ranzak.dev';
    const defaultBaseUrl = rawBaseUrl.replace(/\/+$/, '');

    if (import.meta.test && !process.env.TEST_TAURI_FETCH) return;

    const isTauri = isTauriApp();

    const customFetch = $fetch.create({
      baseURL: isTauri ? defaultBaseUrl : undefined,
      onRequest(context) {
        let requestUrl =
          typeof context.request === 'string' ? context.request : context.request.url;

        if (isTauri) {
          if (requestUrl.startsWith('http://tauri.localhost/')) {
            requestUrl = requestUrl.replace('http://tauri.localhost', defaultBaseUrl);
            context.request = requestUrl;
            context.options.baseURL = undefined;
          } else if (
            (requestUrl.startsWith('/api') || requestUrl.startsWith('/auth')) &&
            !context.options.baseURL
          ) {
            context.options.baseURL = defaultBaseUrl;
          }
        }

        const isInternalApi =
          requestUrl.startsWith('/api') ||
          requestUrl.startsWith('/auth') ||
          Boolean(defaultBaseUrl && requestUrl.startsWith(defaultBaseUrl)) ||
          requestUrl.startsWith('http://localhost') ||
          requestUrl.startsWith('http://127.0.0.1');

        if (isInternalApi) {
          context.options.credentials = isTauri ? 'omit' : 'include';
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (token) {
            const headers = new Headers(context.options.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            headers.set('x-h3-session', token);
            context.options.headers = headers;
          }
        }
      }
    });

    globalThis.$fetch = customFetch;

    return {
      provide: {
        fetch: customFetch
      }
    };
  }
});
