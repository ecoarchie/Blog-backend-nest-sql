import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { User } from '../entities/user.entity';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { SessionsRepository } from './sessions.repository';
import { BanUserDto } from '../dtos/ban-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async findUserByLoginOrEmail(login: string, email: string): Promise<User> {
    const query = `
    SELECT * FROM public.users
    WHERE login = $1 OR email = $2
    `;

    const values = [login, email];

    const res: User[] = await this.dataSource.query(query, values);
    const user = res[0];
    return res[0];
  }

  async createUser(dto: CreateUserInputDto): Promise<User['id']> {
    const insQuery = `
  INSERT INTO public.users(
	login, "passwordHash", email)
	VALUES ($1, $2, $3);
  `;

    const passHash = await this.hashPassword(dto.password);
    const insVals = [dto.login, passHash, dto.email];
    const insertRes = await this.dataSource.query(insQuery, insVals);
    const query = `
    SELECT * FROM public.users
    WHERE login = $1 AND email = $2
    `;
    const values = [dto.login, dto.email];
    const user = await this.dataSource.query(query, values);
    return user[0].id;
  }

  async deleteUserById(id: string): Promise<User['id'] | null> {
    const searchQuery = `
      SELECT id FROM public.users
	    WHERE id = $1;
    `;
    const user = await this.dataSource.query(searchQuery, [id]);
    if (user.length === 0) return null;

    const deleteQuery = `
      DELETE FROM public.users
	    WHERE id = $1;
    `;
    await this.dataSource.query(deleteQuery, [id]);
    await this.sessionsRepository.deleteAllUserSessions(user.id);

    return user[0].id;
  }

  async findUserById(newUserId: string): Promise<User> {
    const query = `
    SELECT * FROM public.users
    WHERE id = $1 
    `;
    const values = [newUserId];
    const user = await this.dataSource.query(query, values);
    return user[0];
  }

  async findUserByEmail(email: string): Promise<User> {
    const query = `
    SELECT * FROM public.users
    WHERE email = $1 
    `;
    const values = [email];
    const user = await this.dataSource.query(query, values);
    return user[0];
  }

  async updateUserBanInfo(
    userId: string,
    banUserDto: BanUserDto,
  ): Promise<void> {
    let isBanned: boolean;
    let banReason: string;
    let banDate: Date;

    isBanned = banUserDto.isBanned;
    if (!banUserDto.isBanned) {
      banReason = null;
      banDate = null;
    } else {
      banReason = banUserDto.banReason;
      banDate = new Date();
    }
    const updateQuery = `
      UPDATE public.users
	      SET "isBanned"=$1, "banDate"=$2, "banReason"=$3
	      WHERE id = $4;
    `;
    const updateResult = await this.dataSource.query(updateQuery, [
      isBanned,
      banDate,
      banReason,
      userId,
    ]);
  }

  async setNewPasswordRecoveryCode(user: User) {
    const query = `
      UPDATE public.users
        SET "passwordRecoveryCode"=$1, "passwordRecoveryExpirationDate"=$2, "passwordRecoveryCodeIsUsed"=$3
        WHERE id=$4
    `;
    const values = [
      user.passwordRecoveryCode,
      user.passwordRecoveryExpirationDate,
      user.passwordRecoveryCodeIsUsed,
      user.id,
    ];
    await this.dataSource.query(query, values);
  }

  async updateEmailConfirmationCode(
    code: string,
    userId: string,
  ): Promise<void> {
    const updateQuery = `
      UPDATE public.users
	      SET "confirmationCode"=$1
	      WHERE id = $2;
    `;
    const updateResult = await this.dataSource.query(updateQuery, [
      code,
      userId,
    ]);
  }

  async findUserByConfirmCode(code: string): Promise<User> {
    const query = `
    SELECT * FROM public.users
    WHERE "confirmationCode" = $1 
    `;
    const values = [code];
    const user = await this.dataSource.query(query, values);
    return user.length !== 0 ? user[0] : null;
  }
  //
  async findUserByRecoveryCode(code: string): Promise<User> {
    const query = `
    SELECT * FROM public.users
    WHERE "passwordRecoveryCode" = $1 
    `;
    const values = [code];
    const user = await this.dataSource.query(query, values);
    return user.length !== 0 ? user[0] : null;
  }

  async setEmailIsConfirmedToTrue(userId: string): Promise<void> {
    const updateQuery = `
      UPDATE public.users
	      SET "confirmationCodeIsConfirmed"=TRUE
	      WHERE id = $1;
    `;
    const res = await this.dataSource.query(updateQuery, [userId]);
  }

  async saveUser(user: User): Promise<void> {
    const query = `
      UPDATE public.users
	      SET login=$1, email=$2, "passwordHash"=$3, "createdAt"=$4, "isBanned"=$5, "banDate"=$6, 
          "banReason"=$7, "confirmationCode"=$8, "confirmationCodeExpirationDate"=$9,
          "confirmationCodeIsConfirmed"=$10, "passwordRecoveryCode"=$11, "passwordRecoveryExpirationDate"=$12,
          "passwordRecoveryCodeIsUsed"=$13
        WHERE id=$14;
    `;
    const values = [
      user.login,
      user.email,
      user.passwordHash,
      user.createdAt,
      user.isBanned,
      user.banDate,
      user.banReason,
      user.confirmationCode,
      user.confirmationCodeExpirationDate,
      user.confirmationCodeIsConfirmed,
      user.passwordRecoveryCode,
      user.passwordRecoveryExpirationDate,
      user.passwordRecoveryCodeIsUsed,
      user.id,
    ];

    const result = await this.dataSource.query(query, values);
  }

  async deleteAllUsers() {
    const query = `
    DELETE FROM public.users
    `;
    await this.dataSource.query(query);
  }

  async deleteAllSessions() {
    const query = `
    DELETE FROM public.sessions
    `;
    await this.dataSource.query(query);
  }

  private toPlainUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      isBanned: user.isBanned,
      banReason: user.banReason,
      banDate: user.banDate,
    };
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 1);
  }
}
