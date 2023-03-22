import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { CreateSessionDto } from '../dtos/create-session.dto';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async createNewSession(createSessionDto: CreateSessionDto): Promise<void> {
    const sessionInsertQuery = `
    INSERT INTO public.sessions(
	 ip, "title", "lastActiveDate", "deviceId", "tokenExpireDate", "userId")
	VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
      createSessionDto.ip,
      createSessionDto.browserTitle,
      createSessionDto.lastActiveDate,
      createSessionDto.deviceId,
      createSessionDto.tokenExpireDate,
      createSessionDto.userId,
    ];
    await this.dataSource.query(sessionInsertQuery, values);
    return;
  }

  async updateSession(
    sessionId: number,
    ip: string,
    browserTitle: string,
    newActiveDate: number,
    newTokenExpDate: number,
  ): Promise<void> {
    const query = `
     UPDATE public.sessions
      SET "ip"=$1, "title"=$2, "lastActiveDate"=$3, "tokenExpireDate"=$4
      WHERE id=$5
    `;
    const values = [
      ip,
      browserTitle,
      new Date(newActiveDate * 1000),
      new Date(newTokenExpDate * 1000),
      sessionId,
    ];
    await this.dataSource.query(query, values);
  }

  async deleteSession(id: number) {
    const query = `
      DELETE FROM public.sessions
        WHERE id=$1
    `;

    await this.dataSource.query(query, [id]);
  }

  async findUserByLoginOrEmail(login: string, email: string): Promise<User> {
    const insQuery = `
  INSERT INTO public.users(
	login, password, email)
	VALUES ($1, $2, $3);
  `;
    const passHash = await this.hashPassword('123456');
    const insVals = [login, passHash, email];
    const insertRes = await this.dataSource.query(insQuery, insVals);

    const query = `
    SELECT * FROM public.users
    WHERE login = $1 OR email = $2
    `;

    const values = [login, email];

    const res: User[] = await this.dataSource.query(query, values);
    const user = res[0];
    return user;
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const deleteQuery = `
      DELETE FROM public.sessions
      WHERE "userId" = $1;
    `;
    await this.dataSource.query(deleteQuery, [userId]);
  }

  async verifySessionByToken(token: string): Promise<Session | null> {
    try {
      const tokenData: any = jwt.verify(token, process.env.SECRET as jwt.Secret);
      if (tokenData.exp < Date.now() / 1000) {
        return null;
      }
      const lastActiveDate = new Date(tokenData.iat * 1000);
      const deviceId = tokenData.deviceId;
      const userId = tokenData.userId;
      const query = `
        SELECT * FROM public.sessions
        WHERE "lastActiveDate"=$1 AND
        "deviceId"=$2 AND
        "userId"=$3
      `;
      const values = [lastActiveDate, deviceId, userId];
      const result = await this.dataSource.query(query, values);
      return result[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getActiveSessions(refreshToken: string) {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const query = `
    SELECT ip, title, "lastActiveDate", "deviceId" FROM public.sessions
    WHERE "userId"=$1

`;
    const sessionFound = await this.dataSource.query(query, [userId]);
    if (sessionFound.length === 0) throw new UnauthorizedException();

    return sessionFound;
  }

  async deleteRestSessions(refreshToken: string): Promise<void> {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const deviceId = validSession.deviceId;
    const deleteQuery = `
    DELETE FROM public.sessions
	    WHERE "userId"=$1 AND "deviceId"!=$2;
    `;
    await this.dataSource.query(deleteQuery, [userId, deviceId]);
    return;
  }

  async deleteAllBannedUserSessions(userId: string): Promise<void> {
    const deleteQuery = `
    DELETE FROM public.sessions
      WHERE "userId"=$1
    `;
    await this.dataSource.query(deleteQuery, [userId]);
  }

  async deleteDeviceSessions(
    refreshToken: string,
    deviceId: string,
  ): Promise<void> {
    const validSession = await this.verifySessionByToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const sessionQuery = `
    SELECT * FROM public.sessions
      WHERE "deviceId"=$1
    `;
    const foundDeviceSession = await this.dataSource.query(sessionQuery, [
      deviceId,
    ]);
    console.log(foundDeviceSession);
    if (foundDeviceSession.length === 0) {
      throw new NotFoundException();
    }
    if (foundDeviceSession[0].userId !== userId) {
      throw new ForbiddenException();
    } else {
      const deleteQuery = `
      DELETE FROM public.sessions
        WHERE "deviceId"=$1
      `;
      try {
        await this.dataSource.query(deleteQuery, [deviceId]);
      } catch (error) {
        console.log(error);
        console.log('cannot delete device session');
        throw new BadRequestException();
      }
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 1);
  }

  async toUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      isBanned: user.isBanned,
      banDate: user.banDate,
      banReason: user.banReason,
    };
  }
}
