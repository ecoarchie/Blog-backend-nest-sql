import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
      ORDER BY $2 DESC
      LIMIT 1;
      `;
    const result = await this.dataSource.query(query, [
      blogId,
      'blogposts.createdAt',
    ]);
    const post: BlogPost  = result[0];
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
