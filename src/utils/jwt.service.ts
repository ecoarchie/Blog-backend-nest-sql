import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtService {
  async createJwtAccessToken(userId: string) {
    const token = jwt.sign({ userId: userId }, process.env.SECRET, {
      expiresIn: 10,
    });
    return token;
  }

  async createJwtRefresh(userId: string, deviceId: string) {
    const token = jwt.sign({ userId, deviceId }, process.env.SECRET, {
      expiresIn: 20,
    });
    return token;
  }

  async getUserIdFromAccessToken(token: string): Promise<string | null> {
    try {
      const result: any = jwt.verify(token, process.env.SECRET);
      return result.userId;
    } catch (error) {
      return null;
    }
  }

  async getExpDateFromRefreshToken(refreshToken: string) {
    const tokenRes: any = jwt.verify(refreshToken, process.env.SECRET);
    return tokenRes.exp;
  }
}
