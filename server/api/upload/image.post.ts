import type { ServerSession } from '../../types/auth.server.types';

export default defineEventHandler(async (event): Promise<{ url: string }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionSecret as string });
  const sessionData = session.data as Partial<ServerSession>;

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  if (!config.imgurClientId) {
    throw createError({ statusCode: 500, statusMessage: 'Imgur client ID is not configured' });
  }

  const { image } = await readBody<{ image: string }>(event);
  if (!image) throw createError({ statusCode: 400, statusMessage: 'Image is required' });

  try {
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await $fetch<{ data: { link: string } }>('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${config.imgurClientId}`
      },
      body: {
        image: base64Data,
        type: 'base64'
      }
    });

    return { url: response.data.link };
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    console.error('Imgur upload error:', err.data || err.message);
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload image to Imgur' });
  }
});
