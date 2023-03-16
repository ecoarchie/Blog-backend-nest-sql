export class CreateSessionDto {
  ip: string;
  browserTitle: string;
  lastActiveDate: Date;
  deviceId: string;
  tokenExpireDate: Date;
  userId: number;
}