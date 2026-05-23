import type { ApiResponse } from '~/types';

/**
 * Global API composable.
 * Wraps $fetch with common interceptors (auth, error handling).
 */
export function useApi() {
  const customFetch = $fetch.create({
    baseURL: '/api', // Change this to your actual API base URL
    onRequest({ request: _request, options: _options }) {
      // Set headers, e.g., Authorization token
      // const token = useCookie('auth-token').value;
      // if (token) {
      //   _options.headers = _options.headers || {};
      //   (_options.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      // }
    },
    onResponseError({ request: _request, response, options: _options }) {
      // Handle global response errors
      if (response.status === 401) {
        // e.g. navigateTo('/login');
      }
    }
  });

  const fetchData = async <T>(
    url: string,
    options?: Parameters<typeof customFetch>[1]
  ): Promise<ApiResponse<T>> => {
    try {
      const data = await customFetch<T>(url, options);
      return { data, status: 200 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw createError({ statusCode: 500, statusMessage: message });
    }
  };

  return { fetchData, customFetch };
}
