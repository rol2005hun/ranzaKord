import type { MessageSchema } from '@/types/i18n.types';

export default defineNuxtPlugin({
  name: 'i18n-locales',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const messages: Record<string, MessageSchema> = {};

    const featureLocales = import.meta.glob('../features/*/locales/*.json', {
      eager: true,
      import: 'default'
    });
    
    const sharedLocales = import.meta.glob('../shared/locales/*.json', {
      eager: true,
      import: 'default'
    });

    const localeFiles = { ...featureLocales, ...sharedLocales };

    for (const path in localeFiles) {
      // Matches: ../features/<feature>/locales/<locale>.json
      const featureMatch = path.match(/\/features\/([^/]+)\/locales\/([a-z0-9-_]+)\.json$/i);
      // Matches: ../shared/locales/<locale>.json
      const sharedMatch = path.match(/\/shared\/locales\/([a-z0-9-_]+)\.json$/i);

      const locale = featureMatch ? featureMatch[2] : (sharedMatch ? sharedMatch[1] : null);

      /* v8 ignore next */
      if (locale) {
        const fileContent = localeFiles[path] as MessageSchema;

        if (!messages[locale]) {
          messages[locale] = {};
        }

        if (featureMatch && featureMatch[1]) {
          const featureName = featureMatch[1];
          const existingMessages = (messages[locale][featureName] as MessageSchema) || {};
          messages[locale][featureName] = {
            ...existingMessages,
            ...fileContent
          };
        } else {
          messages[locale] = {
            ...messages[locale],
            ...fileContent
          };
        }
      }
    }

    for (const locale in messages) {
      const localeMessages = messages[locale];
      /* v8 ignore next */
      if (localeMessages) {
        (
          nuxtApp.$i18n as { mergeLocaleMessage: (locale: string, messages: MessageSchema) => void }
        ).mergeLocaleMessage(locale, localeMessages);
      }
    }
  }
});
