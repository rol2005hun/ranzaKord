import type { UseAuthReturn } from '../types/auth.types';

import { isTauri as checkIsTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

export function useAuth(): UseAuthReturn {
  const store = useAuthStore();
  const isTauri = computed(() => import.meta.client && checkIsTauri());

  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();
  const requestFetch = import.meta.server
    ? (useRequestFetch() as unknown as (req: string) => Promise<unknown>)
    : null;
  const globalFetch = $fetch as unknown as (req: string) => Promise<unknown>;

  async function loginWithRanzaKonnect(rememberMe: boolean = false): Promise<void> {
    const origin = encodeURIComponent(window.location.origin);
    const lang = nuxtApp.$i18n?.locale?.value || 'en';
    const desktopAuth = isTauri.value ? '&desktop=1' : '';
    const rememberAuth = rememberMe ? '&remember=1' : '';
    const baseUrl = isTauri.value ? config.public.baseUrl : window.location.origin;
    const loginUrl = isTauri.value
      ? `${baseUrl}/auth/login?source=${origin}&lang=${lang}${desktopAuth}${rememberAuth}`
      : `/auth/login?source=${origin}&lang=${lang}${desktopAuth}${rememberAuth}`;

    if (isTauri.value) {
      await openUrl(loginUrl);
    } else {
      window.location.assign(loginUrl);
    }
  }

  async function logout() {
    await $fetch('/auth/logout', { method: 'POST' }).catch(() => null);

    if (import.meta.client) {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
      window.location.href = '/login';
    } else {
      store.clearSession();
    }
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
