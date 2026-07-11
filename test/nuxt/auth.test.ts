import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { setActivePinia, createPinia } from 'pinia';

import { useAuthStore } from '../../app/features/auth/stores/useAuthStore';
import { useAuth } from '../../app/features/auth/composables/useAuth';

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn()
}));
mockNuxtImport('navigateTo', () => mockNavigateTo);

describe('Auth Module', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });

    // Mock window.location
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        assign
      }
    });

    // Mock globalThis.$fetch
    fetchMock = vi.fn();
    globalThis.$fetch = fetchMock as unknown as typeof globalThis.$fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuthStore', () => {
    it('initializes with null user', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('sets user correctly', () => {
      const store = useAuthStore();
      store.setUser({ sub: '1', name: 'Test User', email: '', hasAccess: true });
      expect(store.user).toEqual({ sub: '1', name: 'Test User', email: '', hasAccess: true });
      expect(store.isAuthenticated).toBe(true);
    });

    it('clears session', () => {
      document.cookie = 'session=123; other=456';
      const store = useAuthStore();
      store.setUser({ sub: '1', name: 'Test', email: '', hasAccess: true });
      store.clearSession();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);

      // Cookie is cleared by setting expires in the past. Hard to test exact value of document.cookie
      // because JSDOM cookie handling is complex, but we can verify it ran without errors.
    });

    it('logs in as demo user', () => {
      const store = useAuthStore();
      store.loginAsDemo();

      expect(store.user).not.toBeNull();
      expect(store.user?.isDemo).toBe(true);
      expect(store.user?.sub).toBe('demo-user-id');
      expect(store.isAuthenticated).toBe(true);
      // It should also set localStorage
      expect(localStorage.getItem('ranzakord_demo_session')).toBe('true');
    });
  });

  describe('useAuth', () => {
    it('returns currentUser and isAuthenticated', () => {
      const { currentUser, isAuthenticated } = useAuth();
      expect(currentUser.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
    });

    it('login opens the auth URL', async () => {
      const { loginWithRanzaKonnect } = useAuth();
      await loginWithRanzaKonnect();
      expect(window.location.assign).toHaveBeenCalledWith(
        '/auth/login?source=http%3A%2F%2Flocalhost%3A3000&lang=en'
      );
    });

    it('logout fetches logout endpoint and hard reloads to login', async () => {
      fetchMock.mockResolvedValue(null);
      const { logout } = useAuth();
      mockNavigateTo.mockClear();

      await logout();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
      expect(mockNavigateTo).toHaveBeenCalledWith('/login');
    });

    it('fetchUser sets user on success', async () => {
      fetchMock.mockResolvedValue({ sub: '2', name: 'Fetched User' });
      const store = useAuthStore();
      const { fetchUser } = useAuth();

      await fetchUser();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/me');
      expect(store.user).toEqual({ sub: '2', name: 'Fetched User' });
    });

    it('fetchUser sets user to null on failure', async () => {
      fetchMock.mockRejectedValue(new Error('Auth failed'));
      const store = useAuthStore();
      const setUserSpy = vi.spyOn(store, 'setUser');
      const { fetchUser } = useAuth();

      await fetchUser();

      expect(setUserSpy).toHaveBeenCalledWith(null);
    });
  });
});
