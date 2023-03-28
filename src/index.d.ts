import { User } from './users/entities/user.entity';

const user: User;
declare global {
  declare namespace Express {
    export interface Request {
      user: Pick<User, 'id' | 'login'> | null;
    }
  }
}
