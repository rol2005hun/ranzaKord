import type { MessageSchema } from '@/types/i18n.types';

export default defineNuxtPlugin({
  name: 'i18n-locales',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const messages: Record<string, Record<string, MessageSchema>> = {};

    const localeFiles = import.meta.glob('../features/**/locales/**/*.json', {
      eager: true,
      import: 'default'
    });

    for (const path in localeFiles) {
      const match = path.match(/\/features\/([^/]+)\/locales\/(?:([^/]+)\/)?([a-z0-9-_]+)\.json$/i);

      if (!match || typeof match[1] !== 'string' || typeof match[3] !== 'string') {
        continue;
      }

      const featureName = match[1];
      const parentName = match[2];
      const locale = match[3];
      const fileContent = localeFiles[path] as MessageSchema;
      const localeMessages = (messages[locale] ??= {});

      const featureMessages = (localeMessages[featureName] ??= {} as MessageSchema);

      if (!parentName) {
        localeMessages[featureName] = fileContent;
      } else {
        featureMessages[parentName] = fileContent;
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
