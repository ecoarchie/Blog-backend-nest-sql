import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostPaginator, PostsPagination } from './dtos/post-paginator';
import { BlogPost } from './entities/blogpost.entity';
import { PostViewModel } from './models/post-view.model';
import { PostDbModel } from './models/post-from-db.model';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findLatestCreatedPostByBlogId(blogId: string) {
    const query = `
      SELECT blogposts.id, title, "shortDescription", content, blogposts."createdAt", "blogId", blogs.name "blogName",
      blogposts."likesCount", blogposts."dislikesCount"
	    FROM public.blogposts
      LEFT JOIN blogs ON blogs.id="blogId"
      WHERE "blogId"=$1
      ORDER BY blogposts."createdAt" DESC
      LIMIT 1;
      `;
    const result = await this.dataSource.query(query, [blogId]);
    const post: PostDbModel = result[0];
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
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
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName" 
    bp."likesCount", bp."dislikesCount"
    FROM public.blogposts bp
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

  async countAllPostsForBlog(blogId: string): Promise<number> {
    const totalCountQuery = `
    SELECT COUNT(blogposts.id) FROM public.blogposts
    LEFT JOIN blogs ON blogs.id = blogposts."blogId"
    WHERE blogs.id = $1
    `;
    const result = await this.dataSource.query(totalCountQuery, [blogId]);
    return Number(result[0].count);
  }

  async findAllPostsForBlog(
    blogId: string,
    paginator: PostPaginator,
    // currentUserId: string | null,
  ): Promise<PostDbModel[]> {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName", 
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $4) as "likesCount",
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $5) as "dislikesCount"
    FROM public.blogposts bp 
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    WHERE blogs.id = $3 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2 
    `;
    const values = [pageSize, skip, blogId, 'Like', 'Dislike'];
    const posts = await this.dataSource.query(query, values);

    return posts;
  }

  async findNewestLikes(postIds: string[]) {
    const query = `
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (PARTITION BY "postId" ORDER BY pr."createdAt") AS r,
      pr.*, u.login
      FROM "postsReactions" pr 
      LEFT JOIN users u ON u.id = pr."userId" 
      WHERE "postId" = ANY($1) AND reaction = $2) x
      WHERE x.r <= 3;
    `;
    const reactions = await this.dataSource.query(query, [postIds, 'Like']);
    return reactions.map((r: any) => {
      return {
        addedAt: r.createdAt,
        userId: r.userId,
        login: r.login,
        postId: r.postId,
      };
    });
  }

  async findPostById(postId: string, currentUserId: string) {
    const query = `
      SELECT * FROM public.blogposts
      WHERE id=$1
    `;
    const post = await this.dataSource.query(query, [postId]);
    return post[0];
  }

  toPostsViewModel(post: PostDbModel) {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: '',
        newestLikes: [],
      },
    };
  }
}
