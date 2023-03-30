import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostsRepository } from '../posts/posts.repository';
import { Reaction } from '../reactions/reaction.model';
import { CommentsQueryRepository } from './comments.query-repository';
import { CommentsRepository } from './comments.repository';
import { CommentPaginator } from './dtos/comment-paginator.dto';
import { ReactionUpdate } from './dtos/reactionUpdate.model';
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

  async findCommentByIdWithReaction(commentId: string, currentUserId: string) {
    const comment =
      await this.commentsRepository.findCommentWithCommentatorInfoById(
        commentId,
      );
    if (!comment) return null;

    const currentUserReaction =
      await this.commentsRepository.checkUserReactionForOneComment(
        commentId,
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

  async deleteCommentById(commentId: string, currentUserId: string) {
    const comment =
      await this.commentsRepository.findCommentWithCommentatorInfoById(
        commentId,
      );
    if (!comment) throw new NotFoundException();

    if (comment.commentatorId !== currentUserId) throw new ForbiddenException();
    await this.commentsRepository.deleteById(commentId);
  }

  async updateCommentById(
    commentId: string,
    content: string,
    currentUserId: string,
  ): Promise<void> {
    const comment =
      await this.commentsRepository.findCommentWithCommentatorInfoById(
        commentId,
      );
    if (!comment) throw new NotFoundException();

    if (comment.commentatorId !== currentUserId) throw new ForbiddenException();
    await this.commentsRepository.updateContent(commentId, content);
  }

  async reactToComment(
    currentUserId: string,
    commentId: string,
    likeStatus: Reaction,
  ) {
    const comment =
      await this.commentsRepository.findCommentWithCommentatorInfoById(
        commentId,
      );
    if (!comment) throw new NotFoundException();
    const currentReaction =
      await this.commentsRepository.checkUserReactionForOneComment(
        commentId,
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
    await this.commentsRepository.updateReactionCount(
      commentId,
      reactionUpdate,
    );
    await this.commentsRepository.updateCommentsReactions(
      commentId,
      currentUserId,
      likeStatus,
    );
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
