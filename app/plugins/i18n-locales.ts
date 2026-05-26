import type { MessageSchema } from '@/types/i18n.types';

export default defineNuxtPlugin({
  name: 'i18n-locales',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const messages: Record<string, MessageSchema> = {};

    const localeFiles = import.meta.glob('../../shared/locales/**/*.json', {
      eager: true,
      import: 'default'
    });

    for (const path in localeFiles) {
      // Matches: ../../shared/locales/<feature>/<locale>.json or ../../shared/locales/<locale>.json
      const match = path.match(/\/shared\/locales\/(?:([^/]+)\/)?([a-z0-9-_]+)\.json$/i);

      /* v8 ignore next */
      if (match && match[2]) {
        const parentName = match[1]; // may be undefined for root locales
        const locale = match[2];
        const fileContent = localeFiles[path] as MessageSchema;

        if (!messages[locale]) {
          messages[locale] = {};
        }

        if (!parentName || parentName === 'shared') {
          messages[locale] = {
            ...messages[locale],
            ...fileContent
          };
        } else {
          const existingMessages = (messages[locale][parentName] as MessageSchema) || {};
          messages[locale][parentName] = {
            ...existingMessages,
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
