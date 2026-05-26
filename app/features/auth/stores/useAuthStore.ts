import type { OAuthUser } from '../types/auth.types';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<OAuthUser | null>(null);

    const isAuthenticated = computed(() => !!user.value);
    const currentUser = computed(() => user.value);

    function setUser(data: OAuthUser | null) {
      user.value = data;
    }

    function clearSession() {
      user.value = null;
    }

    return { user, isAuthenticated, currentUser, setUser, clearSession };
  },
  {
    persist: {
      pick: ['user']
    }
  }
);
