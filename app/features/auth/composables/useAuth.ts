export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  function loginWithRanzaKonnect() {
    const isTauri = '__TAURI_INTERNALS__' in window;
    const origin = encodeURIComponent(window.location.origin);
    if (isTauri && !import.meta.dev) {
      window.location.href = `https://kord.ranzak.dev/auth/login?source=${origin}`;
    } else {
      window.location.href = `/auth/login?source=${origin}`;
    }
  }

  async function logout() {
    store.clearSession();
    await $fetch('/auth/logout', { method: 'POST' }).catch(() => null);
    await router.push('/login');
  }

  async function fetchUser() {
    try {
      const fetcher = import.meta.server
        ? (useRequestFetch() as unknown as (req: string) => Promise<unknown>)
        : ($fetch as unknown as (req: string) => Promise<unknown>);
      const user = (await fetcher('/api/me')) as unknown;
      if (user && typeof user === 'object' && 'sub' in user) {
        store.setUser(user as { sub: string; name: string; email: string; picture?: string });
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
