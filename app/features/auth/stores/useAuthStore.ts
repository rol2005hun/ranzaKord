import type { OAuthUser } from '../types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<OAuthUser | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const currentUser = computed(() => user.value);

  function setUser(data: OAuthUser | null) {
    user.value = data;
  }

  function clearSession() {
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem('ranzakord_demo_session');
    }
  }

  function loginAsDemo() {
    user.value = {
      sub: 'demo-user-id',
      name: 'Demo Felhasználó',
      email: 'demo@ranzakord.app',
      picture: '',
      hasAccess: true,
      roles: ['user'],
      isDemo: true
    };
    if (import.meta.client) {
      localStorage.setItem('ranzakord_demo_session', 'true');
    }
  }

  return { user, isAuthenticated, currentUser, setUser, clearSession, loginAsDemo };
});
