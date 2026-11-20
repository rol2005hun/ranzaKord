import { useAppSession } from '../../utils/session';

import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event): Promise<{ url: string }> => {
  const config = useRuntimeConfig();
  const session = await useAppSession(event);
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, message: t('core.errors.unauthorized') });
  }

  if (!config.imgurClientId) {
    throw createError({ statusCode: 500, message: t('upload.errors.missingClientId') });
  }

  const body = await readBody<{ image?: string }>(event);
  const image = body?.image;

  if (!image) throw createError({ statusCode: 400, message: t('upload.errors.missingImage') });

  try {
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await $fetch<{ data: { link: string }; success: boolean }>(
      'https://api.imgur.com/3/image',
      {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${config.imgurClientId}`
        },
        body: {
          image: base64Data,
          type: 'base64'
        }
      }
    );

    if (!response.success) {
      throw createError({ statusCode: 500, message: t('upload.errors.uploadFailed') });
    }

    return { url: response.data.link };
  } catch {
    throw createError({ statusCode: 500, message: t('upload.errors.uploadFailed') });
  }
});
