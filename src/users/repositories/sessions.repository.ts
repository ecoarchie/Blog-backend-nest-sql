import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PassThrough } from 'stream';
import { User } from '../entities/user.entity';
import { CreateSessionDto } from '../dtos/create-session.dto';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource
  ) {}

  async createNewSession(createSessionDto: CreateSessionDto) {
    const sessionInsertQuery = `
    INSERT INTO public.sessions(
	 ip, "browserTitle", "lastActiveDate", "deviceId", "tokenExpireDate", "userId")
	VALUES ($1, $2, $3, $4, $5, $6)
    `

    const values = [createSessionDto.ip, createSessionDto.browserTitle, createSessionDto.lastActiveDate, createSessionDto.deviceId, createSessionDto.tokenExpireDate, createSessionDto.userId]
    await this.dataSource.query(sessionInsertQuery, values)
    return ;
  }


  async findUserByLoginOrEmail(login: string, email: string) {
  const insQuery = `
  INSERT INTO public.users(
	login, password, email)
	VALUES ($1, $2, $3);
  `;
  const passHash = await this.hashPassword('123456');
  const insVals = [login, passHash, email]
  const insertRes = await this.dataSource.query(insQuery, insVals)
  console.log("🚀 ~ file: sessions.repository.ts:37 ~ SessionsRepository ~ findUserByLoginOrEmail ~ insertRes:", insertRes)

    const query = `
    SELECT * FROM public.users
    WHERE login = $1 OR email = $2
    `;

    const values = [login, email];

    const res: User[] = await this.dataSource.query(query, values)
    const user = res[0];
    return res[0];
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 1)
  }

  async toUserDto (user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      isBanned: user.isBanned,
      banDate: user.banDate,
      banReason: user.banReason,
    }
  }
}
