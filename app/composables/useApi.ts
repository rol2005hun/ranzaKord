import type { ApiResponse } from '@/types';

export function useApi() {
  const customFetch = $fetch.create({
    baseURL: '/api'
  });

  const fetchData = async <T>(
    url: string,
    options?: Parameters<typeof customFetch>[1]
  ): Promise<ApiResponse<T>> => {
    const authStore = useAuthStore();
    const nuxtApp = useNuxtApp();
    const toast = useToast();

    // DEMO MÓD LOGIKA
    if (authStore.currentUser?.isDemo) {
      const method = (options?.method || 'GET').toUpperCase();

      // Módosító kérések blokkolása
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        toast.info(nuxtApp.$i18n.t('core.demoModeToast'));
        return { data: {} as T, status: 200 };
      }

      // Lejátszási listák lekérésekor a demo listát adjuk vissza
      if (method === 'GET' && url.includes('/playlists')) {
        // Dinamikus import, hogy elkerüljük a körkörös hivatkozást betöltéskor
        const { DEMO_PLAYLIST } = await import('@/features/core/utils/demoData');

        if (url === '/playlists') {
          return { data: [DEMO_PLAYLIST] as unknown as T, status: 200 };
        }
        if (url.includes('/playlists/demo-playlist-1')) {
          return { data: DEMO_PLAYLIST as unknown as T, status: 200 };
        }
      }
    }

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
