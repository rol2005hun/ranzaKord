import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { useNetworkStatus } from '@/features/core/composables/useNetworkStatus';

const fetchMock = vi.hoisted(() => vi.fn());
mockNuxtImport('$fetch', () => fetchMock);

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides network state refs', () => {
    const { isOnline, isServerReachable, isOffline } = useNetworkStatus();
    expect(isOnline).toBeDefined();
    expect(isServerReachable).toBeDefined();
    expect(typeof isOffline.value).toBe('boolean');
  });

  it('updates isOffline when offline', () => {
    const { isOnline, isOffline } = useNetworkStatus();
    isOnline.value = false;
    expect(isOffline.value).toBe(true);

    isOnline.value = true;
    expect(isOffline.value).toBe(false);
  });
});
