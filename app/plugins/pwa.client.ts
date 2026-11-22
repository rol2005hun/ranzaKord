import { isTauriApp } from '@/utils/tauri';

export default defineNuxtPlugin(() => {
  if (import.meta.client && 'serviceWorker' in navigator && !isTauriApp()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
});
