import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreatePostDto } from '../posts/dtos/createPost.dto';
import { BanUserByBloggerDto } from '../users/dtos/ban-user-by-blogger.dto';
import { BannedUsersPaginator } from '../users/dtos/banned-users-paginator';
import { DataSource } from 'typeorm';
import { BanBlogDto } from './dtos/banBlog.dto';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createBlog(
    blogDto: CreateBlogDto,
    currentUserId: string,
  ): Promise<string> {
    const createQuery = `
      INSERT INTO public.blogs(name, description, "websiteUrl", "ownerId")
        VALUES ($1, $2, $3, $4)
      `;

    const result = await this.dataSource.query(createQuery, [
      blogDto.name,
      blogDto.description,
      blogDto.websiteUrl,
      currentUserId,
    ]);
    return result[0];
  }

  async updateBlog(blogId: string, updateBlogDto: UpdateBlogDto) {
    const updateQuery = `
      UPDATE public.blogs
	      SET "name"=$1, "description"=$2, "websiteUrl"=$3
	      WHERE id = $4;
    `;
    await this.dataSource.query(updateQuery, [
      updateBlogDto.name,
      updateBlogDto.description,
      updateBlogDto.websiteUrl,
      blogId,
    ]);
  }

  async findBlogWithOwnerById(blogId: string): Promise<Partial<Blog> | null> {
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership", "ownerId" FROM public.blogs
    WHERE id=$1
    `;
    const result = await this.dataSource.query(query, [blogId]);
    return result[0];
  }

  async findAllBannedUsers(blogId: string, paginator: BannedUsersPaginator) {
    const searchLoginTerm = paginator.searchLoginTerm
      ? '%' + paginator.searchLoginTerm + '%'
      : '%';
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT users.id, users."login", banned_users_for_blogs."isBanned", banned_users_for_blogs."banDate", banned_users_for_blogs."banReason" FROM public.banned_users_for_blogs
    LEFT JOIN users ON users.id = banned_users_for_blogs."userId"
    WHERE LOWER(users."login") LIKE LOWER($1) AND "blogId" = $2 AND banned_users_for_blogs."isBanned"=$3 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $4 OFFSET $5 
    `;
    const values = [searchLoginTerm, blogId, true, pageSize, skip];
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT users.id, users."login", banned_users_for_blogs."isBanned", banned_users_for_blogs."banDate", banned_users_for_blogs."banReason" FROM public.banned_users_for_blogs
    LEFT JOIN users ON users.id = banned_users_for_blogs."userId"
    WHERE LOWER(users."login") LIKE LOWER($1) AND "blogId" = $2 AND banned_users_for_blogs."isBanned"=$3 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchLoginTerm,
      blogId,
      true,
    ]);
    const totalCount = Number(result.length);

    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: users,
    };
  }

  async createPost(createPostDto: CreatePostDto, blogId: string) {
    const query = `
    INSERT INTO public.blogposts(title, "shortDescription", content, "blogId")
	    VALUES ($1, $2, $3, $4)
    `;
    const result = await this.dataSource.query(query, [
      createPostDto.title,
      createPostDto.shortDescription,
      createPostDto.content,
      blogId,
    ]);
  }

  async deleteBlogById(blogId: string) {
    const query = `
    DELETE FROM public.blogs
	  WHERE id=$1;
`;
    await this.dataSource.query(query, [blogId]);
  }

  async updateBanStatusOfUserInBlog(
    banUserByBloggerDto: BanUserByBloggerDto,
    userId: string,
  ) {
    const query = `
    SELECT id FROM public.banned_users_for_blogs
    WHERE "userId"=$1
`;
    const unbanUserQuery = `
    UPDATE public.banned_users_for_blogs
	  SET "isBanned"=$1, "banReason"=null, "banDate"=null
	  WHERE "userId"=$2 AND "blogId"=$3; 
`;

    const banExistingUserQuery = `
    UPDATE public.banned_users_for_blogs
	  SET "isBanned"=$1, "banReason"=$2, "banDate"=now()
	  WHERE "userId"=$3 AND "blogId"=$4; 
`;

    const banNewUserQuery = `
    INSERT INTO public.banned_users_for_blogs(
	"userId", "blogId", "isBanned", "banReason")
	VALUES ($1, $2, $3, $4);
`;
    const userInBanList = await this.dataSource.query(query, [userId]);

    if (!banUserByBloggerDto.isBanned) {
      if (userInBanList.length !== 1) return;
      await this.dataSource.query(unbanUserQuery, [
        false,
        userId,
        banUserByBloggerDto.blogId,
      ]);
      return;
    }
    if (userInBanList.length === 1) {
      await this.dataSource.query(banExistingUserQuery, [
        true,
        banUserByBloggerDto.banReason,
        userId,
        banUserByBloggerDto.blogId,
      ]);
    } else {
      await this.dataSource.query(banNewUserQuery, [
        userId,
        banUserByBloggerDto.blogId,
        true,
        banUserByBloggerDto.banReason,
      ]);
    }
  }

  async setBanStatusToBlog(banBlogDto: BanBlogDto, blogId: string) {
    const isBanned = banBlogDto.isBanned;
    const banDate = isBanned ? new Date() : null;
    const query = `
    UPDATE public.blogs
	  SET "isBanned"=$1, "banDate"=$2
	  WHERE id=$3;
`;
    await this.dataSource.query(query, [isBanned, banDate, blogId]);
  }

  async bindBlogToUser(userId: string, blogId: string) {
    const query = `
    UPDATE public.blogs
	  SET "ownerId"=$1
	  WHERE id=$2;
`;
    await this.dataSource.query(query, [userId, blogId]);
  }

  async deleteAllBlogs() {
    const query = `
    DELETE FROM public.blogs
`;
    await this.dataSource.query(query);
  }
}
