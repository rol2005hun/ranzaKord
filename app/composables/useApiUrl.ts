import { isTauriApp } from '@/utils/tauri';

export const useApiUrl = (path: string): string => {
  const config = useRuntimeConfig();
  const rawBaseUrl = (config.public.baseUrl as string) || 'https://kord.ranzak.dev';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const isTauri =
    (typeof window !== 'undefined' && window.location.origin.includes('tauri.localhost')) ||
    (import.meta.client && isTauriApp());

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.startsWith('http://tauri.localhost') || path.startsWith('https://tauri.localhost')) {
      return path.replace(/^https?:\/\/[^/]+/, baseUrl);
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (isTauri) {
    return `${baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
};
