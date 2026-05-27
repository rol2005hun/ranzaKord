export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string } };
  const localeCookie = useCookie<string>('i18n_locale', {
    maxAge: 31536000,
    sameSite: 'lax',
    path: '/'
  });

  // Sync on load
  if (i18n.locale.value && i18n.locale.value !== localeCookie.value) {
    localeCookie.value = i18n.locale.value;
  }

  // Watch for future changes
  if (import.meta.client) {
    watch(
      () => i18n.locale.value,
      (newLocale) => {
        localeCookie.value = newLocale;
      }
    );
  }
});
