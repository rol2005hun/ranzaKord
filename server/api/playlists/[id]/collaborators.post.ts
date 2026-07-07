import type { ServerSession } from '../../../types/auth.server.types';
import { PlaylistModel } from '../../../models/Playlist';
import { UserModel } from '../../../models/User';

interface CollaboratorBody {
  action: 'add' | 'remove';
  collaboratorSub: string;
}

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const config = useRuntimeConfig();
  const session = await useSession(event, {
    password: config.sessionSecret as string,
    maxAge: 60 * 60 * 24 * 30
  });
  const sessionData = session.data as Partial<ServerSession>;
  const { t } = useServerTranslation(event);

  if (!sessionData.accessToken || !sessionData.user) {
    throw createError({ statusCode: 401, statusMessage: t('core.errors.unauthorized') });
  }

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: t('playlists.errors.missingId') });

  const body = await readBody<CollaboratorBody>(event);
  if (!body?.collaboratorSub || !['add', 'remove'].includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' });
  }

  const playlist = await PlaylistModel.findOne({ _id: id, userId: sessionData.user.sub });
  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: t('playlists.errors.notFound') });
  }

  const targetUser = await UserModel.findOne({ sub: body.collaboratorSub });
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  const currentCollaborators = playlist.collaborators || [];

  if (body.action === 'add') {
    if (!currentCollaborators.includes(body.collaboratorSub)) {
      playlist.collaborators = [...currentCollaborators, body.collaboratorSub];
      await playlist.save();
    }
  } else if (body.action === 'remove') {
    playlist.collaborators = currentCollaborators.filter((sub) => sub !== body.collaboratorSub);
    await playlist.save();
  }

  return { success: true };
});
