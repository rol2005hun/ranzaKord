import { usePwaInstall } from '@/composables/usePwaInstall';
import { isTauriApp } from '@/utils/tauri';

export default defineNuxtPlugin(() => {
  if (import.meta.client && !isTauriApp()) {
    usePwaInstall();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }
});
