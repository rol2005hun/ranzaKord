/**
 * Home feature composable.
 * Encapsulates business logic for the home feature.
 * Bridges the store and the components.
 */
export function useHome() {
  const store = useHomeStore();
  const { t } = useI18n();

  // Initialize hero data from i18n translations
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
