import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserPaginator, UserPaginatorOptions } from '../dtos/users-paginator';
import { User } from '../entities/user.entity';
import format from 'pg-format';

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
    WHERE login LIKE $1 AND email LIKE $2 AND ("isBanned" = ${banStatus}) 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $3 OFFSET $4 
    `;
    const values = [searchLoginTerm, searchEmailTerm, pageSize, skip];
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.users
    WHERE login LIKE $1 AND email LIKE $2 AND ("isBanned" = ${banStatus}) 
    `;
    const totalCount = await this.dataSource.query(totalCountQuery, [
      searchLoginTerm,
      searchEmailTerm,
    ]);

    const pagesCount = Math.ceil(totalCount / userPaginatorOptions.pageSize);
    return {
      pagesCount,
      page: userPaginatorOptions.pageNumber,
      pageSize: userPaginatorOptions.pageSize,
      totalCount: Number(totalCount[0].count),
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
