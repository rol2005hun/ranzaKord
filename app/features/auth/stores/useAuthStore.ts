import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRepo } from 'pinia-orm';
import { User } from '../models/User';
import type { AuthSession, LoginCredentials } from '../types/auth.types';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const session = ref<AuthSession | null>(null);

    const isAuthenticated = computed(() => !!session.value?.token);

    const currentUser = computed(() => {
      return useRepo(User).all()[0] ?? null;
    });

    async function login(credentials: LoginCredentials) {
      console.log('Logging in with', credentials);

      session.value = {
        token: 'mock-token-abc123',
        expiresAt: new Date(Date.now() + 3600_000).toISOString()
      };

      useRepo(User).save({
        id: 1,
        name: 'Demo User',
        email: credentials.email,
        isAdmin: false,
        avatarUrl: ''
      });
    }

    function logout() {
      session.value = null;
      useRepo(User).flush();
    }

    return { session, isAuthenticated, currentUser, login, logout };
  },
  {
    persist: true
  }
);
