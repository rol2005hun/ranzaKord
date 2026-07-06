import { Model } from 'pinia-orm';
import { Num, Str, Uid } from 'pinia-orm/dist/decorators';

export class PlaylistTrack extends Model {
  static override entity = 'playlist_tracks';

  @Uid() declare id: string;
  @Str('') declare playlist_id: string;
  @Str('') declare videoId: string;
  @Str('') declare title: string;
  @Str('') declare artist: string;
  @Str('') declare thumbnailUrl: string;
  @Num(0) declare durationSeconds: number;
  @Num(0) declare order: number;
}
