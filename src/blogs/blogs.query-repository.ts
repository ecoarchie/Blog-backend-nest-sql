import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogsPaginator } from './dtos/blog-paginator.dto';
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

  async findNotBannedBlogById(id: string): Promise<Partial<Blog>> {
    console.log('here');
    const query = `
    SELECT id, name, "description", "websiteUrl", "createdAt", "isMembership" FROM public.blogs
    WHERE id=$1 AND "isBanned"=$2 
    `;
    const result = await this.dataSource.query(query, [id, false]);
    return result[0];
  }
}
