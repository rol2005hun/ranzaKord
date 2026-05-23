export function useHome() {
  const store = useHomeStore();
  const { t } = useI18n();

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
