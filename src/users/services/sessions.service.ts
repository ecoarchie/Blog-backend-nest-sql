import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { SessionsRepository } from '../repositories/sessions.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
  ){}

  async createNewSession(
    refreshToken: string,
    ip: string,
    browserTitle: string,
  ) {
    const tokenData: any = jwt.verify(refreshToken, process.env.SECRET);
    const tokenExpireDate = tokenData.exp;
    const tokenIssuedDate = tokenData.iat;
    const { deviceId, userId } = tokenData;
    return this.sessionsRepository.createNewSession({
      ip,
      browserTitle,
      deviceId,
      lastActiveDate: new Date(tokenIssuedDate * 1000),
      tokenExpireDate: new Date(tokenExpireDate * 1000),
      userId,
    });
  }
}