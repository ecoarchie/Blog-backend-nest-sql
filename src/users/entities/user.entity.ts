import * as bcrypt from 'bcrypt';

export class User {

  id: number;

  login: string;

  password: string;

  email: string;

  createdAt: Date;

  isBanned: boolean;
  banDate: Date;
  banReason: string;

  confirmationCode: string;
  confirmationCodeExpirationDate: Date;
  confirmationCodeIsConfirmed: boolean;

  passwordRecoveryCode: string;
  passwordRecoveryExpirationDate: Date;
  passwordRecoveryCodeIsUsed: boolean;
}