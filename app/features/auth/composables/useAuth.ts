import type { UseAuthReturn } from '../types/auth.types';

export function useAuth(): UseAuthReturn {
  const store = useAuthStore();
  const router = useRouter();
  const isTauri = computed(() => import.meta.client && '__TAURI_INTERNALS__' in window);

  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();
  const requestFetch = import.meta.server
    ? (useRequestFetch() as unknown as (req: string) => Promise<unknown>)
    : null;
  const globalFetch = $fetch as unknown as (req: string) => Promise<unknown>;

  async function loginWithRanzaKonnect(): Promise<void> {
    const origin = encodeURIComponent(window.location.origin);
    const lang = nuxtApp.$i18n?.locale?.value || 'en';
    const desktopAuth = isTauri.value ? '&desktop=1' : '';
    const baseUrl = config.public.baseUrl;
    const loginUrl = isTauri.value
      ? `${baseUrl}/auth/login?source=${origin}&lang=${lang}${desktopAuth}`
      : `/auth/login?source=${origin}&lang=${lang}${desktopAuth}`;

    if (isTauri.value) {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(loginUrl);
    } else {
      window.location.assign(loginUrl);
    }
  }

  async function logout() {
    store.clearSession();

    if (import.meta.client) {
      localStorage.removeItem('auth_token');
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
    }

    $fetch('/auth/logout', { method: 'POST' }).catch(() => null);
    await router.push('/login');
  }

  async function fetchUser() {
    try {
      const fetcher = import.meta.server && requestFetch ? requestFetch : globalFetch;
      const user = (await fetcher('/api/me')) as unknown;
      if (user && typeof user === 'object' && 'sub' in user) {
        store.setUser(
          user as { sub: string; name: string; email: string; picture?: string; hasAccess: boolean }
        );
      } else {
        store.setUser(null);
      }
    } catch {
      store.setUser(null);
    }
  }

  return {
    isAuthenticated: computed(() => store.isAuthenticated),
    currentUser: computed(() => store.currentUser),
    isTauri,
    loginWithRanzaKonnect,
    logout,
    fetchUser
  };
}
