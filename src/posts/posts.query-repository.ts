import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostPaginator } from './dtos/post-paginator';
import { BlogPost } from './entities/blogpost.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findLatestCreatedPostByBlogId(blogId: string) {
    const query = `
      SELECT blogposts.id, title, "shortDescription", content, blogposts."createdAt", "blogId", blogs.name "blogName"
	    FROM public.blogposts
      LEFT JOIN blogs ON blogs.id="blogId"
      WHERE "blogId"=$1
      ORDER BY blogposts."createdAt" DESC
      LIMIT 1;
      `;
    const result = await this.dataSource.query(query, [blogId]);
    const post: BlogPost & { blogName: string } = result[0];
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async findAll(currentUserId: string, postsPaginatorQuery: PostPaginator) {
    const sortBy = postsPaginatorQuery.sortBy;
    const sortDirection = postsPaginatorQuery.sortDirection;
    const pageSize = postsPaginatorQuery.pageSize;
    const skip =
      (postsPaginatorQuery.pageNumber - 1) * postsPaginatorQuery.pageSize;
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName" FROM public.blogposts bp
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2 
    `;
    const values = [pageSize, skip];
    const posts = await this.dataSource.query(query, values);

    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogposts
    `;
    const result = await this.dataSource.query(totalCountQuery);
    const totalCount = Number(result[0].count);

    const pagesCount = Math.ceil(totalCount / postsPaginatorQuery.pageSize);
    return {
      pagesCount,
      page: postsPaginatorQuery.pageNumber,
      pageSize: postsPaginatorQuery.pageSize,
      totalCount,
      items: posts.map(this.toPostsViewModel),
    };
  }

  async findPostById(postId: string, currentUserId: string) {
    const query = `
      SELECT * FROM public.blogposts
      WHERE id=$1
    `;
    const post = await this.dataSource.query(query, [postId]);
    return post[0];
  }

  toPostsViewModel(post: BlogPost & { blogName: string }) {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }
}
