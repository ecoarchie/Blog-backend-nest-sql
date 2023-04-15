import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostPaginator, PostsPagination } from './dtos/post-paginator';
import { PostDbModel } from './models/post-from-db.model';
import { PostViewModel } from './models/post-view.model';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findLatestCreatedPostByBlogId(blogId: string) {
    const query = `
      SELECT blogposts.id, title, "short_description", content, blogposts."created_at", "blog_id", blogs.name "blogName"
	    FROM public.blogposts
      LEFT JOIN blogs ON blogs.id="blog_id"
      WHERE "blog_id"=$1
      ORDER BY blogposts."created_at" DESC
      LIMIT 1;
      `;
    const result = await this.dataSource.query(query, [blogId]);
    const post: PostDbModel = result[0];
    console.log(post);
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

  async findAll(paginator: PostPaginator): Promise<PostDbModel[]> {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName", 
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $3) as "likesCount",
    (SELECT count(*) FROM public."postsReactions"
    WHERE "postId" = bp.id AND reaction = $4) as "dislikesCount"
    FROM public.blogposts bp
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2 
    `;
    const values = [pageSize, skip, 'Like', 'Dislike'];
    const posts = await this.dataSource.query(query, values);

    return posts;
  }

  async countAllPosts(): Promise<number> {
    const totalCountQuery = `
    SELECT COUNT(id) FROM public.blogposts
    `;
    const result = await this.dataSource.query(totalCountQuery);
    return Number(result[0].count);
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
  ): Promise<PostDbModel[]> {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName", 
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "postId" = bp.id AND reaction = $4 AND users."isBanned" = $6) as "likesCount",
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "postId" = bp.id AND reaction = $5 AND users."isBanned" = $6) as "dislikesCount"
    FROM public.blogposts bp 
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    WHERE blogs.id = $3 
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2 
    `;
    const values = [pageSize, skip, blogId, 'Like', 'Dislike', false];
    const posts: Promise<PostDbModel[]> = await this.dataSource.query(
      query,
      values,
    );

    return posts;
  }

  async findNewestLikes(postIds: string[]) {
    // console.log(postIds);
    const query = `
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (PARTITION BY "postId" ORDER BY pr."createdAt" DESC) AS r,
      pr.*, u.login
      FROM "postsReactions" pr
      LEFT JOIN users u ON u.id = pr."userId"
      WHERE "postId" = ANY($1) AND reaction = $2 AND u."isBanned" = $3) x
      WHERE x.r <= 3
      ;
    `;
    // const query = `
    //   SELECT "userId", "postId", reaction, "createdAt"
    //   FROM public."postsReactions"
    //   WHERE (
    //     SELECT COUNT(*) FROM public."postsReactions"
    //     WHERE "postId" = ANY($1) AND reaction = $2
    //   )<=3
    //   ORDER BY "createdAt" DESC
    // `;
    const reactions = await this.dataSource.query(query, [
      postIds,
      'Like',
      false,
    ]);
    // console.log('reactions', reactions);
    return reactions.map((r: any) => {
      return {
        addedAt: r.createdAt,
        userId: r.userId,
        login: r.login,
        postId: r.postId,
      };
    });
  }

  async findPostById(postId: string): Promise<PostDbModel | undefined> {
    const query = `
    SELECT bp.id, title, bp."shortDescription", bp.content, bp."createdAt", "blogId", blogs."name" "blogName", 
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "postId" = bp.id AND reaction = $2 AND users."isBanned" = $4) as "likesCount",
    (SELECT count(*) FROM public."postsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "postId" = bp.id AND reaction = $3 AND users."isBanned" = $4) as "dislikesCount"
    FROM public.blogposts bp 
    LEFT JOIN blogs ON blogs.id = bp."blogId"
    WHERE bp.id = $1 
    `;
    const values = [postId, 'Like', 'Dislike', false];
    const post = await this.dataSource.query(query, values);
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
