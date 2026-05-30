import { isTauri } from '@tauri-apps/api/core';

export default defineNuxtPlugin(() => {
  if (isTauri()) {
    const defaultBaseUrl = 'https://kord.ranzak.dev';

    // Override the global $fetch
    globalThis.$fetch = $fetch.create({
      baseURL: defaultBaseUrl,
      onRequest({ options }) {
        // Ensure credentials are sent to the remote API
        options.credentials = 'include';
      }
    });
  }
});
