import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { BlogsRepository } from '../blogs/blogs.repository';
import { Reaction } from '../reactions/reaction.model';
import { UpdatePostDto } from './dtos/updatePost.dto';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}
  async updatePostById(
    blogId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    currentUserId: string,
  ) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();

    if (post.blogId.toString() !== blogId)
      throw new BadRequestException({
        message: 'Wrong blogId',
        field: 'blogId',
      });
    await this.postsRepository.updatePostById(postId, updatePostDto);
  }

  async deletePostById(blogId: string, postId: string, currentUserId: string) {
    if (!isUUID(blogId)) throw new NotFoundException();
    if (!isUUID(postId)) throw new NotFoundException();
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.postsRepository.deletePostById(postId);
  }

  async reactToPost(
    currentUserId: string,
    postId: string,
    likeStatus: Reaction,
  ) {
    if (!isUUID(postId)) throw new NotFoundException();
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();
  }
}
