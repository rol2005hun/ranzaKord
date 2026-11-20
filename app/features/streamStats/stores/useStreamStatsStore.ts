import type { StreamStatsResponse } from '@/features/streamStats/types/streamStats.types';

export const useStreamStatsStore = defineStore('streamStats', () => {
  const data = ref<StreamStatsResponse | null>(null);
  const isLoading = ref<boolean>(false);
  const isClearing = ref<boolean>(false);
  const error = ref<string | null>(null);

  const totalRequests = computed<number>(() => data.value?.totalCount ?? 0);

  const cacheHits = computed<number>(() => {
    return data.value?.statusCounts.find((s) => s._id === 'hit')?.count ?? 0;
  });

  const resolvedCount = computed<number>(() => {
    return data.value?.statusCounts.find((s) => s._id === 'resolved')?.count ?? 0;
  });

  const failedCount = computed<number>(() => {
    return data.value?.statusCounts.find((s) => s._id === 'failed')?.count ?? 0;
  });

  const cacheHitRate = computed<number>(() => {
    if (!data.value || data.value.totalCount === 0) return 0;
    return Math.round((cacheHits.value / data.value.totalCount) * 100);
  });

  const avgResolutionTime = computed<number>(() => {
    const resolved = data.value?.clientAverages || [];
    if (resolved.length === 0) return 0;
    const totalCount = resolved.reduce((acc, c) => acc + c.count, 0);
    if (totalCount === 0) return 0;
    const weightedSum = resolved.reduce((acc, c) => acc + c.avgDurationMs * c.count, 0);
    return Math.round(weightedSum / totalCount);
  });

  const fastestClient = computed<string | null>(() => {
    const clients = data.value?.clientAverages || [];
    if (clients.length === 0) return null;
    return clients[0]?._id ?? null;
  });

  async function fetchStats(): Promise<void> {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const url = useApiUrl('/api/stream/stats');
      const response = await $fetch<StreamStatsResponse>(url);
      data.value = response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function clearStats(): Promise<boolean> {
    if (isClearing.value) return false;
    isClearing.value = true;
    error.value = null;
    try {
      const url = useApiUrl('/api/stream/stats');
      await $fetch(url, { method: 'DELETE' });
      data.value = {
        totalCount: 0,
        clientAverages: [],
        statusCounts: [],
        recentLogs: []
      };
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      isClearing.value = false;
    }
  }

  return {
    data,
    isLoading,
    isClearing,
    error,
    totalRequests,
    cacheHits,
    resolvedCount,
    failedCount,
    cacheHitRate,
    avgResolutionTime,
    fastestClient,
    fetchStats,
    clearStats
  };
});
