import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useAuthStore } from '../../app/features/auth/stores/useAuthStore';
import { useStreamStatsStore } from '../../app/features/streamStats/stores/useStreamStatsStore';
import { useStreamStats } from '../../app/features/streamStats/composables/useStreamStats';

import type { StreamStatsResponse } from '../../app/features/streamStats/types/streamStats.types';

describe('streamStats', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('useAuthStore isDeveloper', () => {
    it('returns false when user is null or has standard role', () => {
      const auth = useAuthStore();
      expect(auth.isDeveloper).toBe(false);

      auth.setUser({
        sub: '1',
        name: 'User',
        email: 'user@example.com',
        picture: '',
        hasAccess: true,
        roles: ['user']
      });
      expect(auth.isDeveloper).toBe(false);
    });

    it('returns true when user has developer role', () => {
      const auth = useAuthStore();
      auth.setUser({
        sub: '2',
        name: 'Developer',
        email: 'dev@example.com',
        picture: '',
        hasAccess: true,
        roles: ['user', 'developer']
      });
      expect(auth.isDeveloper).toBe(true);
    });

    it('returns true when user has ranzaKreator or admin role', () => {
      const auth = useAuthStore();
      auth.setUser({
        sub: '3',
        name: 'Kreator',
        email: 'kreator@example.com',
        picture: '',
        hasAccess: true,
        roles: ['ranzaKreator']
      });
      expect(auth.isDeveloper).toBe(true);
    });
  });

  describe('useStreamStatsStore', () => {
    it('initializes with default empty state', () => {
      const store = useStreamStatsStore();
      expect(store.data).toBeNull();
      expect(store.totalRequests).toBe(0);
      expect(store.cacheHitRate).toBe(0);
      expect(store.avgResolutionTime).toBe(0);
      expect(store.fastestClient).toBeNull();
    });

    it('calculates derived metrics correctly', () => {
      const store = useStreamStatsStore();
      const mockData: StreamStatsResponse = {
        totalCount: 10,
        clientAverages: [
          {
            _id: 'ANDROID_VR',
            count: 3,
            avgDurationMs: 400,
            minDurationMs: 300,
            maxDurationMs: 500
          },
          {
            _id: 'VISIONOS',
            count: 2,
            avgDurationMs: 900,
            minDurationMs: 800,
            maxDurationMs: 1000
          }
        ],
        statusCounts: [
          { _id: 'hit', count: 5 },
          { _id: 'resolved', count: 5 }
        ],
        recentLogs: []
      };

      store.data = mockData;

      expect(store.totalRequests).toBe(10);
      expect(store.cacheHits).toBe(5);
      expect(store.cacheHitRate).toBe(50);
      expect(store.fastestClient).toBe('ANDROID_VR');
      expect(store.avgResolutionTime).toBe(600);
    });
  });

  describe('useStreamStats helpers', () => {
    it('formats bytes and duration properly', () => {
      const { formatBytes, formatDuration, getDurationBadgeVariant } = useStreamStats();

      expect(formatBytes(undefined)).toBe('-');
      expect(formatBytes(1048576 * 5)).toBe('5.00 MB');

      expect(formatDuration(0)).toBe('0 ms');
      expect(formatDuration(450)).toBe('450 ms');
      expect(formatDuration(1500)).toBe('1.50 s');

      expect(getDurationBadgeVariant(0)).toBe('primary');
      expect(getDurationBadgeVariant(600)).toBe('success');
      expect(getDurationBadgeVariant(1800)).toBe('warning');
      expect(getDurationBadgeVariant(3000)).toBe('danger');
    });
  });
});
