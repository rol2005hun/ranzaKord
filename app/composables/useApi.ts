import type { ApiResponse } from '@/types';

export function useApi() {
  const customFetch = $fetch.create({
    baseURL: '/api'
  });

  const fetchData = async <T>(
    url: string,
    options?: Parameters<typeof customFetch>[1]
  ): Promise<ApiResponse<T>> => {
    try {
      const data = await customFetch<T>(url, options);
      return { data: data as T, status: 200 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw createError({ statusCode: 500, statusMessage: message });
    }
  };

  return { fetchData, customFetch };
}
