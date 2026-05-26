import { Model } from 'pinia-orm';
import { Num, Str, HasMany, Uid } from 'pinia-orm/dist/decorators';
import { PlaylistTrack } from './PlaylistTrack';

export class Playlist extends Model {
  static override entity = 'playlists';

  @Uid() declare id: string;
  @Str('') declare name: string;
  @Num(0) declare createdAt: number;

  @HasMany(() => PlaylistTrack, 'playlist_id') declare tracks: PlaylistTrack[];
}
