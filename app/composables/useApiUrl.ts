import { isTauriApp } from '@/utils/tauri';

export const useApiUrl = (path: string): string => {
  const config = useRuntimeConfig();
  const isTauri = import.meta.client && isTauriApp();
  const tauriBase = (config.public.tauriBaseUrl || 'https://kord.ranzak.dev').replace(/\/+$/, '');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (isTauri) {
      if (
        path.startsWith('http://tauri.localhost/') ||
        path.startsWith('http://localhost:3000/') ||
        path.startsWith('http://127.0.0.1:3000/') ||
        /^http:\/\/192\.168\.\d+\.\d+:3000\//.test(path)
      ) {
        return path.replace(/^https?:\/\/[^/]+/, tauriBase);
      }
    }
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (isTauri) {
    return `${tauriBase}${normalizedPath}`;
  }

  return normalizedPath;
};
