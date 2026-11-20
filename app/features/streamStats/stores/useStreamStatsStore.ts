import type {
  PaginationInfo,
  StreamStatsResponse
} from '@/features/streamStats/types/streamStats.types';

export const useStreamStatsStore = defineStore('streamStats', () => {
  const data = ref<StreamStatsResponse | null>(null);
  const isLoading = ref<boolean>(false);
  const isClearing = ref<boolean>(false);
  const error = ref<string | null>(null);
  const currentPage = ref<number>(1);
  const itemsPerPage = ref<number>(25);

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

  const pagination = computed<PaginationInfo>(() => {
    if (data.value?.pagination) {
      return data.value.pagination;
    }
    const total = data.value?.totalCount ?? 0;
    return {
      page: currentPage.value,
      limit: itemsPerPage.value,
      total,
      totalPages: Math.max(1, Math.ceil(total / itemsPerPage.value))
    };
  });

  async function fetchStats(page?: number, limit?: number): Promise<void> {
    if (isLoading.value) return;
    if (page !== undefined) {
      currentPage.value = Math.max(1, page);
    }
    if (limit !== undefined) {
      itemsPerPage.value = Math.max(1, limit);
    }

    isLoading.value = true;
    error.value = null;
    try {
      const url = useApiUrl(
        `/api/stream/stats?page=${currentPage.value}&limit=${itemsPerPage.value}`
      );
      const response = await $fetch<StreamStatsResponse>(url);
      data.value = response;
      if (response.pagination) {
        currentPage.value = response.pagination.page;
        itemsPerPage.value = response.pagination.limit;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function setPage(page: number): Promise<void> {
    if (page === currentPage.value || page < 1 || page > pagination.value.totalPages) return;
    await fetchStats(page);
  }

  async function setLimit(limit: number): Promise<void> {
    if (limit === itemsPerPage.value || limit < 1) return;
    await fetchStats(1, limit);
  }

  async function clearStats(): Promise<boolean> {
    if (isClearing.value) return false;
    isClearing.value = true;
    error.value = null;
    try {
      const url = useApiUrl('/api/stream/stats');
      await $fetch(url, { method: 'DELETE' });
      currentPage.value = 1;
      data.value = {
        totalCount: 0,
        clientAverages: [],
        statusCounts: [],
        recentLogs: [],
        pagination: {
          page: 1,
          limit: itemsPerPage.value,
          total: 0,
          totalPages: 1
        }
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
    currentPage,
    itemsPerPage,
    pagination,
    totalRequests,
    cacheHits,
    resolvedCount,
    failedCount,
    cacheHitRate,
    avgResolutionTime,
    fastestClient,
    fetchStats,
    setPage,
    setLimit,
    clearStats
  };
});
