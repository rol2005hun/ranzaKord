import { ofetch } from 'ofetch';
import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event) => {
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  const body = await readBody<{ text: string; targetLang?: string }>(event);

  if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
    throw createError({ statusCode: 400, message: t('core.errors.invalidInput') });
  }

  const targetLang = body.targetLang || 'hu';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(body.text)}`;
    const response = await ofetch(url, {
      parseResponse: JSON.parse
    });

    if (Array.isArray(response) && Array.isArray(response[0])) {
      const translatedText = response[0]
        .map((x: unknown[]) => x[0] as string)
        .filter(Boolean)
        .join('');
      return { translatedText };
    }

    throw new Error('Invalid translation response format');
  } catch (error) {
    console.error('Translation error:', error);
    throw createError({ statusCode: 500, message: 'Translation failed' });
  }
});
