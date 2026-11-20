import { isTauriApp } from '@/utils/tauri';

export const useApiUrl = (path: string): string => {
  const config = useRuntimeConfig();
  const rawBaseUrl = (config.public.baseUrl as string) || '';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const isTauri =
    (typeof window !== 'undefined' && window.location.origin.includes('tauri.localhost')) ||
    (import.meta.client && isTauriApp());

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.startsWith('http://tauri.localhost') || path.startsWith('https://tauri.localhost')) {
      return baseUrl ? path.replace(/^https?:\/\/[^/]+/, baseUrl) : path;
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (isTauri && baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
};
