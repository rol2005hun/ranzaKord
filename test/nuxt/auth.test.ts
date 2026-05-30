import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../app/features/auth/stores/useAuthStore';
import { useAuth } from '../../app/features/auth/composables/useAuth';

describe('Auth Module', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });

    // Mock globalThis.$fetch
    globalThis.$fetch = vi.fn() as unknown as typeof globalThis.$fetch;
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
      store.setUser({ sub: '1', name: 'Test User', email: '' });
      expect(store.user).toEqual({ sub: '1', name: 'Test User', email: '' });
      expect(store.isAuthenticated).toBe(true);
    });

    it('clears session', () => {
      document.cookie = 'session=123; other=456';
      const store = useAuthStore();
      store.setUser({ sub: '1', name: 'Test', email: '' });
      store.clearSession();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);

      // Cookie is cleared by setting expires in the past. Hard to test exact value of document.cookie
      // because JSDOM cookie handling is complex, but we can verify it ran without errors.
    });
  });

  describe('useAuth', () => {
    it('returns currentUser and isAuthenticated', () => {
      const { currentUser, isAuthenticated } = useAuth();
      expect(currentUser.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
    });

    it('login sets location href', async () => {
      const { loginWithRanzaKonnect } = useAuth();
      loginWithRanzaKonnect();
      expect(window.location.href).toContain('/auth/login');
    });

    it('logout calls clearSession and fetches logout endpoint', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue(null);
      const store = useAuthStore();
      const clearSessionSpy = vi.spyOn(store, 'clearSession');
      const { logout } = useAuth();

      await logout();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
      expect(clearSessionSpy).toHaveBeenCalled();
    });

    it('fetchUser sets user on success', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ sub: '2', name: 'Fetched User' });
      const store = useAuthStore();
      const { fetchUser } = useAuth();

      await fetchUser();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/me');
      expect(store.user).toEqual({ sub: '2', name: 'Fetched User' });
    });

    it('fetchUser sets user to null on failure', async () => {
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('Auth failed'));
      const store = useAuthStore();
      const setUserSpy = vi.spyOn(store, 'setUser');
      const { fetchUser } = useAuth();

      await fetchUser();

      expect(setUserSpy).toHaveBeenCalledWith(null);
    });
  });
});
