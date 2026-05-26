export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  function loginWithRanzaKonnect() {
    window.location.href = '/auth/login';
  }

  async function logout() {
    store.clearSession();
    await $fetch('/auth/logout', { method: 'POST' }).catch(() => null);
    await router.push('/login');
  }

  async function fetchUser() {
    try {
      const fetcher = import.meta.server ? useRequestFetch() : $fetch;
      const user = await fetcher<{ sub: string; name: string; email: string; picture?: string }>(
        '/api/me'
      );
      store.setUser(user || null);
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
