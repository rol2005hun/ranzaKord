export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client || !('__TAURI_INTERNALS__' in window)) return;

  nuxtApp.hook('page:finish', () => {
    const titlebarTitle = document.getElementById('static-tauri-titlebar-title');
    if (titlebarTitle) {
      let title = document.title;
      if (title.includes(' | ')) {
        title = title.split(' | ')[0] || title;
      }
      titlebarTitle.innerText = title;
    }
  });
});
