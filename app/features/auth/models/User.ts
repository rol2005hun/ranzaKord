import { Model } from 'pinia-orm';
import { Num, Str, Bool } from 'pinia-orm/decorators';

/**
 * Pinia ORM User model.
 * Represents an authenticated user entity in the ORM repository.
 *
 * Usage:
 *   import { useRepo } from 'pinia-orm'
 *   const repo = useRepo(User)
 *   repo.save({ id: 1, name: 'Alice', email: 'alice@example.com' })
 *   const users = repo.all()
 */
export class User extends Model {
  static entity = 'users';

  @Num(0) declare id: number;
  @Str('') declare name: string;
  @Str('') declare email: string;
  @Bool(false) declare isAdmin: boolean;
  @Str('') declare avatarUrl: string;
}
