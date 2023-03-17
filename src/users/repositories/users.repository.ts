import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async findUserByLoginOrEmail(login: string, email: string) {
    const query = `
    SELECT * FROM public.users
    WHERE login = $1 OR email = $2
    `;

    const values = [login, email];

    const res: User[] = await this.dataSource.query(query, values);
    const user = res[0];
    return res[0];
  }

  async createUser(dto: CreateUserInputDto) {
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

  async findUserById(newUserId: string) {
    const query = `
    SELECT * FROM public.users
    WHERE id = $1 
    `;
    const values = [newUserId];
    const user = await this.dataSource.query(query, values);
    return this.toPlainUserDto(user[0]);
  }

  async updateUserBanInfo(updatedUser: Partial<User>): Promise<void> {
    const updateQuery = `
      UPDATE public.users
	      SET "isBanned"=$1, "banDate"=$2, "banReason"=$3
	      WHERE id = $4;
    `;
    const updateResult = await this.dataSource.query(updateQuery, [
      updatedUser.isBanned,
      updatedUser.banDate,
      updatedUser.banReason,
      updatedUser.id,
    ]);
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
