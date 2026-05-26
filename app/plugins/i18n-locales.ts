import type { MessageSchema } from '@/types/i18n.types';

export default defineNuxtPlugin({
  name: 'i18n-locales',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const messages: Record<string, Record<string, MessageSchema>> = {};

    const featureLocales = import.meta.glob('../features/**/locales/**/*.json', {
      eager: true,
      import: 'default'
    });

    const sharedLocales = import.meta.glob('../shared/locales/*.json', {
      eager: true,
      import: 'default'
    });

    const localeFiles = { ...featureLocales, ...sharedLocales };

    for (const path in localeFiles) {
      const featureMatch = path.match(/\/features\/([^/]+)\/locales\/(?:([^/]+)\/)?([a-z0-9-_]+)\.json$/i);
      const sharedMatch = path.match(/\/shared\/locales\/([a-z0-9-_]+)\.json$/i);

      const locale = featureMatch ? featureMatch[3] : (sharedMatch ? sharedMatch[1] : null);
      if (!locale) continue;

      const fileContent = localeFiles[path] as MessageSchema;
      const localeMessages = (messages[locale] ??= {});

      if (sharedMatch) {
        Object.assign(localeMessages, fileContent);
      } else if (featureMatch && typeof featureMatch[1] === 'string') {
        const featureName = featureMatch[1];
        const parentName = featureMatch[2];
        
        const featureMessages = (localeMessages[featureName] ??= {} as MessageSchema);

        if (!parentName) {
          Object.assign(featureMessages, fileContent);
        } else {
          featureMessages[parentName] = fileContent;
        }
      }
    }

    for (const locale in messages) {
      const localeMessages = messages[locale];
      if (localeMessages) {
        (
          nuxtApp.$i18n as { mergeLocaleMessage: (locale: string, messages: MessageSchema) => void }
        ).mergeLocaleMessage(locale, localeMessages as MessageSchema);
      }
    }
  }
});
