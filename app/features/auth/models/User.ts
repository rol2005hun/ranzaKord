import { Model } from 'pinia-orm';
import { Num, Str, Bool } from 'pinia-orm/decorators';

export class User extends Model {
  static override entity = 'users';

  @Num(0) declare id: number;
  @Str('') declare name: string;
  @Str('') declare email: string;
  @Bool(false) declare isAdmin: boolean;
  @Str('') declare avatarUrl: string;
}
