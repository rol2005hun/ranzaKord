import { describe, it, expect, vi, beforeEach } from 'vitest';
import middleware from '../../app/middleware/auth.global';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { useAuthStore } from '../../app/features/auth/stores/useAuthStore';
import { createPinia, setActivePinia } from 'pinia';

mockNuxtImport('navigateTo', () => {
  return (path: string) => ({ path });
});

mockNuxtImport('defineNuxtRouteMiddleware', () => (fn: (to: { path: string }) => void) => fn);

describe('auth.global.ts middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  const getMiddleware = () => {
    return middleware as unknown as (to: { path: string }) => { path: string } | undefined;
  };

  it('redirects to login if not authenticated', () => {
    const fn = getMiddleware();
    const authStore = useAuthStore();
    authStore.setUser(null); // not authenticated

    const result = fn({ path: '/' });
    expect(result).toEqual({ path: '/login' });
  });

  it('allows public routes if not authenticated', () => {
    const fn = getMiddleware();
    const authStore = useAuthStore();
    authStore.setUser(null); // not authenticated

    expect(fn({ path: '/login' })).toBeUndefined();
    expect(fn({ path: '/auth/save-token' })).toBeUndefined();
  });

  it('redirects to / if authenticated and trying to access /login', () => {
    const fn = getMiddleware();
    const authStore = useAuthStore();
    authStore.setUser({ sub: '1', name: 'Test', email: '', hasAccess: true }); // authenticated

    const result = fn({ path: '/login' });
    expect(result).toEqual({ path: '/' });
  });

  it('allows other routes if authenticated', () => {
    const fn = getMiddleware();
    const authStore = useAuthStore();
    authStore.setUser({ sub: '1', name: 'Test', email: '', hasAccess: true }); // authenticated

    expect(fn({ path: '/' })).toBeUndefined();
    expect(fn({ path: '/search' })).toBeUndefined();
  });
});
