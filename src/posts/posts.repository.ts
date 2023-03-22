import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdatePostDto } from './dtos/updatePost.dto';
import { BlogPost } from './entities/blogpost.entity';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async findPostById(postId: string): Promise<BlogPost> {
    const query = `
    SELECT * FROM public.blogposts
    WHERE id=$1
`;
    const result = await this.dataSource.query(query, [postId]);
    return result[0];
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
