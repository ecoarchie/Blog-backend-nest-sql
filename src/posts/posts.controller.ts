import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user-param.decorator';
import { BlogsService } from '../blogs/blogs.service';
import { PostsQueryRepository } from './posts.query-repository';
import { PostsService } from './posts.service';
import { Request, Response } from 'express';
import { BearerAuthGuard } from '../users/guards/bearer.auth.guard';
import { PostPaginator } from './dtos/post-paginator';
import { PostsRepository } from './posts.repository';
import { CreateCommentDto } from '../comments/dtos/createComment.dto';
import { CurrentUserRequest } from '../users/dtos/currentUser.dto';
import { CommentsService } from '../comments/comments.service';
import { CommentsQueryRepository } from '../comments/comments.query-repository';
import { CommentsRepository } from '../comments/comments.repository';
import { CommentPaginator } from '../comments/dtos/comment-paginator.dto';
import { LikeInputDto } from '../reactions/likeInput.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsRepository: PostsRepository,
    private readonly postService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepo: CommentsQueryRepository,
    private readonly commentsRepo: CommentsRepository,
    private readonly blogsService: BlogsService,
  ) {}

  @Get()
  async findAllPosts(
    @Query() postsPaginatorQuery: PostPaginator,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const posts = await this.postsQueryRepository.findAll(
      currentUserId,
      postsPaginatorQuery,
    );
    return res.send(posts);
  }

  @Get(':postId')
  async getPostById(
    @Param('postId') postId: string,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const postFound = await this.postsRepository.findPostById(postId);
    if (!postFound) return res.sendStatus(404);
    const isBlogBanned = await this.blogsService.isBlogBanned(postFound.blogId);
    if (isBlogBanned) return res.sendStatus(404);
    res.status(200).send(postFound);
  }

  @UseGuards(BearerAuthGuard)
  @Post(':postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      currentUserId,
    );
    if (!isPostExist) throw new NotFoundException();

    const isUserBanned = await this.blogsService.isUserBannedForCurrentBlog(
      isPostExist.blogId,
      currentUserId,
    );

    if (isUserBanned) throw new ForbiddenException();

    const newCommentId = await this.commentsService.createComment(
      createCommentDto.content,
      postId,
      currentUserId,
    );
    const comment = await this.commentsService.findCommentByIdWithReaction(
      newCommentId,
      currentUserId,
    );
    res.send(comment);
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() commentsPaginator: CommentPaginator,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      currentUserId,
    );
    if (!isPostExist) throw new NotFoundException();

    const comments = await this.commentsService.findCommentsForPost(
      currentUserId,
      postId,
      commentsPaginator,
    );
    res.send(comments);
  }

  // @HttpCode(204)
  // @UseGuards(BearerAuthGuard)
  // @Put(':postId/like-status')
  // async reactToPost(
  //   @Param('postId') postId: string,
  //   @Body() likeStatusDto: LikeInputDto,
  //   @CurrentUser('id') currentUserId: string,
  // ) {
  //   await this.postService.reactToPost(
  //     currentUserId,
  //     postId,
  //     likeStatusDto.likeStatus,
  //   );
  // }
}
