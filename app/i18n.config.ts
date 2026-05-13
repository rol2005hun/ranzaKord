/**
 * Auto loads all the JSON files from any `locales/` subfolder in the `app/` directory.
 *
 * Usage: Create a `locales/` folder inside any feature or shared directory:
 *   - app/features/<feature>/locales/en.json  → accessible as $t('<feature>.someKey')
 *   - app/shared/locales/en.json              → accessible as $t('someKey') globally
 */

import type { MessageSchema } from '~/types/i18n.types'

const messages: Record<string, MessageSchema> = {}

const localeFiles = import.meta.glob('./**/locales/*.json', {
  eager: true,
  import: 'default'
});

for (const path in localeFiles) {
  const match = path.match(/\/([^/]+)\/locales\/([a-z0-9-_]+)\.json$/i);

  if (match && match[1] && match[2]) {
    const parentName = match[1];
    const locale = match[2];
    const fileContent = localeFiles[path] as MessageSchema;

    if (!messages[locale]) {
      messages[locale] = {};
    }

    if (parentName === 'shared') {
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

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: messages as { en: MessageSchema },
}));
