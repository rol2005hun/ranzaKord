export function useHome() {
  const store = useHomeStore();
  const nuxtApp = useNuxtApp();
  const t = nuxtApp.$i18n.t;

  function setup() {
    if (!store.isInitialized) {
      store.initialize({
        title: t('home.title'),
        subtitle: t('home.subtitle'),
        ctaLabel: t('home.cta'),
        ctaHref: '/'
      });
    }
  }

  return {
    hero: computed(() => store.hero),
    setup
  };
}
