import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserPaginator } from '../dtos/users-paginator';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findAll(userPaginatorOptions: UserPaginator) {
    const banStatus =
      userPaginatorOptions.banStatus === 'all'
        ? `${true} OR "isBanned" = ${false}`
        : userPaginatorOptions.banStatus === 'banned'
        ? true
        : false;
    const searchLoginTerm = userPaginatorOptions.searchLoginTerm
      ? '%' + userPaginatorOptions.searchLoginTerm + '%'
      : '%';
    const searchEmailTerm = userPaginatorOptions.searchEmailTerm
      ? '%' + userPaginatorOptions.searchEmailTerm + '%'
      : '%';
    const sortBy = userPaginatorOptions.sortBy;
    const sortDirection = userPaginatorOptions.sortDirection;
    const pageSize = userPaginatorOptions.pageSize;
    const skip =
      (userPaginatorOptions.pageNumber - 1) * userPaginatorOptions.pageSize;
    const query = `
    SELECT * FROM public.users
    WHERE LOWER(login) LIKE LOWER($1) AND email LIKE $2 AND ("isBanned" = ${banStatus}) 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $3 OFFSET $4 
    `;
    const values = [searchLoginTerm, searchEmailTerm, pageSize, skip];
    console.log(values);
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.users
    WHERE login LIKE $1 AND email LIKE $2 AND ("isBanned" = ${banStatus}) 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchLoginTerm,
      searchEmailTerm,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / userPaginatorOptions.pageSize);
    return {
      pagesCount,
      page: userPaginatorOptions.pageNumber,
      pageSize: userPaginatorOptions.pageSize,
      totalCount,
      items: users.map(this.toUserDto),
    };
  }

  async findUserById(newUserId: string) {
    const query = `
    SELECT * FROM public.users
    WHERE id = $1 
    `;
    const values = [newUserId];
    const user = await this.dataSource.query(query, values);
    return this.toUserDto(user[0]);
  }

  async getUserLoginById(id: string): Promise<User['login']> {
    const user = await this.findUserById(id);
    return user.login;
  }

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

  private toUserDto(user: User) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: user.isBanned,
        banReason: user.banReason,
        banDate: user.banDate,
      },
    };
  }
}
