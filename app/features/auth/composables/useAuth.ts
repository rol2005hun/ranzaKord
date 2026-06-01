export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  function loginWithRanzaKonnect() {
    const isTauri = '__TAURI_INTERNALS__' in window;
    const origin = encodeURIComponent(window.location.origin);
    const nuxtApp = useNuxtApp();
    const lang = nuxtApp.$i18n?.locale?.value || 'en';

    if (isTauri && !import.meta.dev) {
      void navigateTo(`https://kord.ranzak.dev/auth/login?source=${origin}&lang=${lang}`, {
        external: true
      });
    } else {
      void navigateTo(`/auth/login?source=${origin}&lang=${lang}`, { external: true });
    }
  }

  async function logout() {
    store.clearSession();

    if (import.meta.client) {
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
      const fetcher = import.meta.server
        ? (useRequestFetch() as unknown as (req: string) => Promise<unknown>)
        : ($fetch as unknown as (req: string) => Promise<unknown>);
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
    loginWithRanzaKonnect,
    logout,
    fetchUser
  };
}
