import { isTauri } from '@tauri-apps/api/core';

export const useApiUrl = (path: string) => {
  const config = useRuntimeConfig();

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const isTauriProd = import.meta.client && isTauri() && !import.meta.dev;

  if (isTauriProd) {
    return `${config.public.baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
};
