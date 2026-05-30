import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin(() => {
  if (isTauri() && !import.meta.dev) {
    const defaultBaseUrl = 'https://kord.ranzak.dev';

    globalThis.$fetch = $fetch.create({
      baseURL: defaultBaseUrl,
      onRequest({ options }) {
        options.credentials = 'include';
      }
    });
  }
});
