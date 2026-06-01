export default defineNuxtPlugin(async () => {
  if (!('__TAURI_INTERNALS__' in window)) {
    return;
  }

  const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');

  await onOpenUrl((urls: string[]) => {
    for (const urlText of urls) {
      const url = new URL(urlText);

      if (url.protocol !== 'ranzakord:') {
        continue;
      }

      const token = url.searchParams.get('token');
      if (!token) {
        continue;
      }

      localStorage.setItem('auth_token', token);
      window.location.href = '/';
      break;
    }
  });
});
