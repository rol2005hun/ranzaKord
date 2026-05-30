import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import plugin from '../../app/plugins/auth';
import { useAuth } from '../../app/features/auth/composables/useAuth';
import { ref } from 'vue';

vi.mock('../../app/features/auth/composables/useAuth', () => ({
  useAuth: vi.fn()
}));

describe('auth plugin', () => {
  let mockFetchUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetchUser = vi.fn();

    // Save original import.meta.server
    (globalThis as { __originalMetaServer?: boolean }).__originalMetaServer = import.meta.server;
  });

  afterEach(() => {
    // Restore import.meta.server
    import.meta.server = (globalThis as { __originalMetaServer?: boolean })
      .__originalMetaServer as boolean;
  });

  it('calls fetchUser on client side if not authenticated', async () => {
    import.meta.server = false;
    vi.mocked(useAuth).mockReturnValue({
      fetchUser: mockFetchUser,
      isAuthenticated: ref(false)
    } as unknown as ReturnType<typeof useAuth>);

    await plugin({} as import('nuxt/app').NuxtApp);
    expect(mockFetchUser).toHaveBeenCalled();
  });

  it('does not call fetchUser on client side if already authenticated', async () => {
    import.meta.server = false;
    vi.mocked(useAuth).mockReturnValue({
      fetchUser: mockFetchUser,
      isAuthenticated: ref(true)
    } as unknown as ReturnType<typeof useAuth>);

    await plugin({} as import('nuxt/app').NuxtApp);
    expect(mockFetchUser).not.toHaveBeenCalled();
  });
});
