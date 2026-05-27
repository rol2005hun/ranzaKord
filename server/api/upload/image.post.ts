import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event): Promise<{ url: string }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  if (!config.imgurClientId) {
    throw createError({ statusCode: 500, statusMessage: t('upload.errors.missingClientId') });
  }

  const { image } = await readBody<{ image: string }>(event);
  if (!image)
    throw createError({ statusCode: 400, statusMessage: t('upload.errors.missingImage') });

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
      throw createError({ statusCode: 500, statusMessage: t('upload.errors.uploadFailed') });
    }

    return { url: response.data.link };
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    console.error('Imgur upload error:', err.data || err.message);
    throw createError({ statusCode: 500, statusMessage: t('upload.errors.uploadFailed') });
  }
});
