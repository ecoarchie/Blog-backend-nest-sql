import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findAllBlogs(blogsPaginatorQuery: BlogsPaginator) {
    const searchNameTerm = blogsPaginatorQuery.searchNameTerm
      ? '%' + blogsPaginatorQuery.searchNameTerm + '%'
      : '%';
    const sortBy = blogsPaginatorQuery.sortBy;
    const sortDirection = blogsPaginatorQuery.sortDirection;
    const pageSize = blogsPaginatorQuery.pageSize;
    const skip =
      (blogsPaginatorQuery.pageNumber - 1) * blogsPaginatorQuery.pageSize;
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $2 OFFSET $3 
    `;
    const values = [searchNameTerm, pageSize, skip];
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchNameTerm,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / blogsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: blogsPaginatorQuery.pageNumber,
      pageSize: blogsPaginatorQuery.pageSize,
      totalCount,
      items: users,
    };
  }

  async findAllBlogsWithOwnerInfo(blogsPaginatorQuery: BlogsPaginator) {
    const searchNameTerm = blogsPaginatorQuery.searchNameTerm
      ? '%' + blogsPaginatorQuery.searchNameTerm + '%'
      : '%';
    const sortBy = blogsPaginatorQuery.sortBy;
    const sortDirection = blogsPaginatorQuery.sortDirection;
    const pageSize = blogsPaginatorQuery.pageSize;
    const skip =
      (blogsPaginatorQuery.pageNumber - 1) * blogsPaginatorQuery.pageSize;
    const query = `
    SELECT blogs.id, name, "description", "websiteUrl", blogs."createdAt", "isMembership", users.id "userId",
    users.login "userLogin", blogs."isBanned", blogs."banDate" FROM public.blogs
    LEFT JOIN users ON users.id=blogs."ownerId"
    WHERE LOWER(name) LIKE LOWER($1) 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $2 OFFSET $3 
    `;
    const values = [searchNameTerm, pageSize, skip];
    const blogs = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(*) FROM public.blogs
    LEFT JOIN users ON users.id=blogs."ownerId"
    WHERE LOWER(name) LIKE LOWER($1) 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchNameTerm,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / blogsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: blogsPaginatorQuery.pageNumber,
      pageSize: blogsPaginatorQuery.pageSize,
      totalCount,
      items: blogs.map(this.toSaBlogViewModel),
    };
  }

  toSaBlogViewModel(b: any) {
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      websiteUrl: b.websiteUrl,
      createdAt: b.createdAt,
      isMembership: b.isMembership,
      blogOwnerInfo: {
        userId: b.userId,
        userLogin: b.userLogin,
      },
      banInfo: {
        isBanned: b.isBanned,
        banDate: b.banDate,
      },
    };
  }

  async findNotBannedBlogById(id: string): Promise<Partial<Blog>> {
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE id=$1 AND "isBanned"=$2 
    `;
    const result = await this.dataSource.query(query, [id, false]);
    return result[0];
  }

  async findBlogById(newBlogId: string): Promise<Partial<Blog>> {
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE id=$1 and "isBanned"=$2
    `;
    const result = await this.dataSource.query(query, [newBlogId, false]);
    return result[0];
  }

  async findLatestCreatedBlog(userId: string): Promise<Partial<Blog>> {
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE "ownerId"=$1
    ORDER BY "createdAt" DESC
    LIMIT 1
    `;
    const result = await this.dataSource.query(query, [userId]);
    return result[0];
  }

  async findAllBlogsForCurrentUser(
    blogsPaginatorQuery: BlogsPaginator,
    currentUserId: string,
  ): Promise<BlogsPagination> {
    const searchNameTerm = blogsPaginatorQuery.searchNameTerm
      ? '%' + blogsPaginatorQuery.searchNameTerm + '%'
      : '%';
    const sortBy = blogsPaginatorQuery.sortBy;
    const sortDirection = blogsPaginatorQuery.sortDirection;
    const pageSize = blogsPaginatorQuery.pageSize;
    const skip =
      (blogsPaginatorQuery.pageNumber - 1) * blogsPaginatorQuery.pageSize;
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) AND "isBanned" = $2 AND "ownerId"=$5 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $3 OFFSET $4 
    `;
    const values = [searchNameTerm, false, pageSize, skip, currentUserId];
    const users = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogs
    WHERE LOWER(name) LIKE LOWER($1) AND "isBanned" = $2 
    `;
    const result = await this.dataSource.query(totalCountQuery, [
      searchNameTerm,
      false,
    ]);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / blogsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: blogsPaginatorQuery.pageNumber,
      pageSize: blogsPaginatorQuery.pageSize,
      totalCount,
      items: users,
    };
  }
}
