import { isTauriApp } from '@/utils/tauri';

declare global {
  interface Window {
    __TAURI_FETCH_HOOKED__?: boolean;
  }
}

export default defineNuxtPlugin({
  name: 'tauri-fetch',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    const isTauri = isTauriApp();
    const rawBaseUrl = (config.public.baseUrl as string) || '';
    const defaultBaseUrl = rawBaseUrl.replace(/\/+$/, '');

    if (typeof window !== 'undefined' && !window.__TAURI_FETCH_HOOKED__) {
      window.__TAURI_FETCH_HOOKED__ = true;
      const nativeFetch = window.fetch;
      window.fetch = async function (
        input: RequestInfo | URL,
        init?: RequestInit
      ): Promise<Response> {
        const requestUrl =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : (input as Request).url;

        let rewrittenUrl = requestUrl;
        if (isTauri && defaultBaseUrl) {
          if (
            rewrittenUrl.startsWith('http://tauri.localhost') ||
            rewrittenUrl.startsWith('https://tauri.localhost')
          ) {
            rewrittenUrl = rewrittenUrl.replace(/^https?:\/\/[^/]+/, defaultBaseUrl);
          } else if (
            (rewrittenUrl.startsWith('/api') || rewrittenUrl.startsWith('/auth')) &&
            !rewrittenUrl.startsWith('http')
          ) {
            rewrittenUrl = `${defaultBaseUrl}${rewrittenUrl}`;
          }
        }

        const isInternalApi =
          rewrittenUrl.startsWith('/api') ||
          rewrittenUrl.startsWith('/auth') ||
          Boolean(defaultBaseUrl && rewrittenUrl.startsWith(defaultBaseUrl)) ||
          rewrittenUrl.startsWith('http://localhost') ||
          rewrittenUrl.startsWith('http://127.0.0.1') ||
          rewrittenUrl.includes('192.168.');

        if (isInternalApi) {
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (token) {
            const headers = new Headers(
              init?.headers || (input instanceof Request ? input.headers : {})
            );
            if (!headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
            }
            if (!headers.has('x-h3-session')) {
              headers.set('x-h3-session', token);
            }
            init = {
              ...init,
              headers
            };
          }
        }

        if (rewrittenUrl !== requestUrl) {
          if (input instanceof Request) {
            input = new Request(rewrittenUrl, input);
          } else {
            input = rewrittenUrl;
          }
        }

        return nativeFetch.call(this, input, init);
      };
    }

    if (import.meta.test && !process.env.TEST_TAURI_FETCH) return;

    const customFetch = $fetch.create({
      baseURL: isTauri ? defaultBaseUrl || undefined : undefined,
      onRequest(context) {
        let requestUrl =
          typeof context.request === 'string' ? context.request : context.request.url;

        if (isTauri && defaultBaseUrl) {
          if (
            requestUrl.startsWith('http://tauri.localhost') ||
            requestUrl.startsWith('https://tauri.localhost')
          ) {
            requestUrl = requestUrl.replace(/^https?:\/\/[^/]+/, defaultBaseUrl);
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
          requestUrl.startsWith('http://127.0.0.1') ||
          requestUrl.includes('192.168.');

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
