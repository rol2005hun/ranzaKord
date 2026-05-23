import type { LoginCredentials } from '../types/auth.types';

/**
 * Auth composable.
 * Exposes login/logout logic and reactive auth state to components.
 */
export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  const { t } = useI18n();

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function login(credentials: LoginCredentials) {
    isLoading.value = true;
    error.value = null;
    try {
      await store.login(credentials);
      await router.push('/');
    } catch {
      error.value = t('auth.loginError');
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    store.logout();
    await router.push('/login');
  }

  return {
    isAuthenticated: computed(() => store.isAuthenticated),
    currentUser: computed(() => store.currentUser),
    isLoading: readonly(isLoading),
    error: readonly(error),
    login,
    logout
  };
}
