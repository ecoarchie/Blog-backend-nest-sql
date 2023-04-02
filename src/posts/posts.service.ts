import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { BlogsRepository } from '../blogs/blogs.repository';
import { ReactionUpdate } from '../comments/dtos/reactionUpdate.model';
import { Reaction } from '../reactions/reaction.model';
import { UpdatePostDto } from './dtos/updatePost.dto';
import { PostsRepository } from './posts.repository';
import { PostPaginator } from './dtos/post-paginator';
import { PostsQueryRepository } from './posts.query-repository';

@Injectable()
export class PostsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
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

  async findAllPostsForBlog(
    blogId: string,
    paginator: PostPaginator,
    currentUserId: string | null,
  ) {
    const blogFound = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blogFound) throw new NotFoundException();

    const posts = await this.postsQueryRepository.findAllPostsForBlog(
      blogId,
      paginator,
      currentUserId,
    );
    return posts;
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

    const currentReaction =
      await this.postsRepository.checkUserReactionForOnePost(
        postId,
        currentUserId,
      );
    if (currentReaction === likeStatus) return;

    let reactionUpdate: ReactionUpdate;
    if (likeStatus === 'None') {
      if (currentReaction === 'Like') {
        reactionUpdate = {
          likesCount: -1,
          dislikesCount: 0,
        };
      } else {
        // currentReaction = 'Dislike'
        reactionUpdate = {
          likesCount: 0,
          dislikesCount: -1,
        };
      }
    } else {
      if (currentReaction === 'None') {
        reactionUpdate = {
          likesCount: likeStatus === 'Like' ? 1 : 0,
          dislikesCount: likeStatus === 'Like' ? 0 : 1,
        };
      } else if (currentReaction === 'Like') {
        reactionUpdate = {
          likesCount: likeStatus === 'Like' ? 0 : -1,
          dislikesCount: likeStatus === 'Like' ? 0 : 1,
        };
      } else {
        // currentReaction = 'Dislike'
        reactionUpdate = {
          likesCount: likeStatus === 'Like' ? 1 : 0,
          dislikesCount: likeStatus === 'Like' ? -1 : 0,
        };
      }
    }
    await this.postsRepository.updateReactionCount(postId, reactionUpdate);
    await this.postsRepository.updatePostReactions(
      postId,
      currentUserId,
      likeStatus,
    );
  }
}
