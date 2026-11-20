import { isTauriApp } from '@/utils/tauri';

export const useApiUrl = (path: string): string => {
  const config = useRuntimeConfig();
  const base = (config.public.baseUrl || 'https://kord.ranzak.dev').replace(/\/+$/, '');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.startsWith('http://tauri.localhost/')) {
      return path.replace('http://tauri.localhost', base);
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.client && isTauriApp()) {
    return `${base}${normalizedPath}`;
  }

  return normalizedPath;
};
