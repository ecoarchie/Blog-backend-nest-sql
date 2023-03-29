import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdatePostDto } from './dtos/updatePost.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findPostById(postId: string) {
    const query = `
    SELECT blogposts.id, title, "shortDescription", "content", "blogId", blogposts."createdAt", blogs."name" "blogName" FROM public.blogposts
    LEFT JOIN blogs ON blogs.id=blogposts."blogId"
    WHERE blogposts.id=$1
`;
    const result = await this.dataSource.query(query, [postId]);
    if (result.length === 0) return null;
    const post = result[0];
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

  async updatePostById(postId: string, dto: UpdatePostDto) {
    const query = `
    UPDATE public.blogposts
	  SET  title=$1, "shortDescription"=$2, content=$3
	  WHERE id=$4;
`;
    const result = await this.dataSource.query(query, [
      dto.title,
      dto.shortDescription,
      dto.content,
      postId,
    ]);
  }
  async deletePostById(postId: string) {
    const query = `
    DELETE FROM public.blogposts
    WHERE id=$1
`;
    await this.dataSource.query(query, [postId]);
  }

  async deleteAllPosts() {
    const query = `
    DELETE FROM public.blogposts
`;
    await this.dataSource.query(query);
  }
}
