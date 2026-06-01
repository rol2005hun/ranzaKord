import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import plugin from '../../app/plugins/auth-interceptor.client';
import { useAuthStore } from '../../app/features/auth/stores/useAuthStore';

vi.mock('../../app/features/auth/stores/useAuthStore', () => ({
  useAuthStore: vi.fn()
}));

describe('auth-interceptor.client plugin', () => {
  let originalFetch: import('vitest').Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    originalFetch = vi.fn();
    globalThis.$fetch = originalFetch as unknown as typeof globalThis.$fetch;

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'test=123; session=abc'
    });

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost:3000/test', pathname: '/test' }
    });
  });

  afterEach(() => {
    globalThis.$fetch = originalFetch as unknown as typeof globalThis.$fetch;
  });

  it('passes successful requests through', async () => {
    originalFetch.mockResolvedValue('success');
    plugin({} as import('nuxt/app').NuxtApp);

    const result = await globalThis.$fetch('/api/test');
    expect(result).toBe('success');
    expect(originalFetch).toHaveBeenCalledWith('/api/test', undefined);
  });

  it('throws non-401 errors', async () => {
    const error = new Error('Not found');
    (error as { response?: { status: number } }).response = { status: 404 };
    originalFetch.mockRejectedValue(error);

    plugin({} as import('nuxt/app').NuxtApp);
    await expect(globalThis.$fetch('/api/test')).rejects.toThrow('Not found');
  });

  it('handles 401 errors by clearing session and redirecting', async () => {
    const error = new Error('Unauthorized');
    (error as { response?: { status: number } }).response = { status: 401 };
    originalFetch.mockRejectedValue(error);

    const mockClearSession = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue({
      clearSession: mockClearSession
    } as unknown as ReturnType<typeof useAuthStore>);

    plugin({} as import('nuxt/app').NuxtApp);

    await expect(globalThis.$fetch('/api/test')).rejects.toThrow('Unauthorized');

    expect(mockClearSession).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });
});
