import {User} from "../src/users/entities/user.entity"

declare global {
  declare namespace Express {
    export interface Request {
      user: Pick<User, 'id' | 'login'> | null;
    }
  }
}
