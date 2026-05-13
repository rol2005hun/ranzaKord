import type { ApiResponse } from '~/types';

/**
 * Global API composable.
 * Wraps $fetch with common error handling and response typing.
 *
 * Usage: const { fetchData } = useApi()
 *        const result = await fetchData<User>('/api/users')
 */
export function useApi() {
  const fetchData = async <T>(
    url: string,
    options?: Parameters<typeof $fetch>[1]
  ): Promise<ApiResponse<T>> => {
    try {
      const data = await $fetch<T>(url, options);
      return { data, status: 200 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw createError({ statusCode: 500, statusMessage: message });
    }
  };

  return { fetchData };
}
