import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../posts/posts.repository';
import { Reaction } from '../reactions/reaction.model';
import { CommentsQueryRepository } from './comments.query-repository';
import { CommentsRepository } from './comments.repository';
import { CommentPaginator } from './dtos/comment-paginator.dto';
import { Comment, CommentViewModel } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private postsRepository: PostsRepository,
  ) {}

  async createComment(content: string, postId: string, commentatorId: string) {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();
    const commentId = await this.commentsRepository.createComment(
      commentatorId,
      postId,
      content,
    );
    // const comment = await this.commentsRepository.findCommentById(commentId);
    // const currentUserReaction = await this.commentsRepository.getUserReaction(
    //   commentId,
    //   commentatorId,
    // );
    return commentId;
  }

  async findCommentByIdWithReaction(
    newCommentId: string,
    currentUserId: string,
  ) {
    const comment =
      await this.commentsRepository.findCommentWithCommentatorInfoById(
        newCommentId,
      );
    const currentUserReaction =
      await this.commentsRepository.checkUserReactionForOneComment(
        newCommentId,
        currentUserId,
      );
    comment.myStatus = currentUserReaction;
    return this.toViewModel(comment);
  }

  async findCommentsForPost(
    currentUserId: string,
    postId: string,
    commentsPaginator: CommentPaginator,
  ) {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();
    const comments = await this.commentsRepository.findCommentsForPost(postId);
    const commentsWithReactions =
      await this.commentsRepository.checkUserReactionForManyComments(
        comments,
        currentUserId,
      );
    const totalCount = await this.commentsRepository.getCommentsQtyForPost(
      postId,
    );
    const pagesCount = Math.ceil(totalCount / commentsPaginator.pageSize);
    return {
      pagesCount,
      page: commentsPaginator.pageNumber,
      pageSize: commentsPaginator.pageSize,
      totalCount,
      items: commentsWithReactions.map(this.toViewModel),
    };
  }

  private toViewModel(comment: CommentViewModel) {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorId,
        userLogin: comment.commentatorLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
    };
  }
}
