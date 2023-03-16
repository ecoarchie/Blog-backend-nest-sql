import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserPaginatorOptions } from '../dtos/users-paginator';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource
  ){}
  async findAll(userPaginatorOptions: UserPaginatorOptions) {
    const banStatus = userPaginatorOptions.banStatus === 'all' ? null : userPaginatorOptions.banStatus === 'banned' ? true : false;
    const searchLoginTerm = userPaginatorOptions.searchLoginTerm ? '%' + userPaginatorOptions.searchLoginTerm + '%' : '%';
    const searchEmailTerm = userPaginatorOptions.searchEmailTerm ? '%' + userPaginatorOptions.searchEmailTerm + '%' : '%';
    const sortBy = userPaginatorOptions.sortBy ;
    console.log("🚀 ~ file: users.query-repository.ts:17 ~ UsersQueryRepository ~ findAll ~ sortBy:", sortBy)
    const sortDirection = userPaginatorOptions.sortDirection;
    const pageNumber = userPaginatorOptions.pageNumber;
    const pageSize = userPaginatorOptions.pageSize;
    const query = `
    SELECT * FROM public.users
    WHERE login LIKE $1 AND email LIKE $2 
    ORDER BY $3 desc
    --LIMIT $3 OFFSET $4 
    `
    const values = [searchLoginTerm, searchEmailTerm, sortBy]
    const users = await this.dataSource.query(query, values);
    console.log("🚀 ~ file: users.query-repository.ts:28 ~ UsersQueryRepository ~ findAll ~ values:", values)
    console.log("🚀 ~ file: users.query-repository.ts:16 ~ UsersQueryRepository ~ findAll ~ users:", users)
    const a = "AND ('isBanned' = $3 OR 'isBanned' IS NULL)";
    
    const totalCount = users.length;
    
    const pagesCount = Math.ceil(totalCount / userPaginatorOptions.pageSize);
    return {
      pagesCount,
      page: userPaginatorOptions.pageNumber,
      pageSize: userPaginatorOptions.pageSize,
      totalCount,
      items: users.map(this.toUserDto),
    };

  }

  async findUserById(newUserId: number) {
    console.log("🚀 ~ file: users.query-repository.ts:47 ~ UsersQueryRepository ~ findUserById ~ newUserId:", newUserId)
    const query = `
    SELECT * FROM public.users
    WHERE id = $1 
    `
    const values = [newUserId]
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
        banDate: user.banDate
      }
    };
  }
}

