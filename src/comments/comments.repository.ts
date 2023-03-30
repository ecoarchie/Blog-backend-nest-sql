import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Reaction } from '../reactions/reaction.model';
import { CommentPaginator } from './dtos/comment-paginator.dto';
import { CommentViewModel } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async createComment(commentatorId: string, postId: string, content: string) {
    const query = `
      INSERT INTO public.comments(
	    "postId", content, "commentatorId")
	    VALUES ($1, $2, $3);
    `;

    await this.dataSource.query(query, [postId, content, commentatorId]);

    const latestCommentQuery = `
        SELECT id FROM public.comments
        WHERE "postId"=$1 AND "commentatorId"=$2
        ORDER BY "createdAt" DESC
        LIMIT 1
    `;

    const result = await this.dataSource.query(latestCommentQuery, [
      postId,
      commentatorId,
    ]);
    console.log(result);
    return result[0].id;
  }

  async findCommentWithCommentatorInfoById(
    commentId: string,
  ): Promise<CommentViewModel | null> {
    const query = `
      SELECT c.id, c."postId", c.content, c."commentatorId",
      users.login "commentatorLogin", c."createdAt", c."likesCount",
      c."dislikesCount" FROM public.comments c
      LEFT JOIN users ON users.id="commentatorId"
      WHERE c.id=$1
    `;
    const res = await this.dataSource.query(query, [commentId]);
    if (res.length === 0) return null;
    return res[0];
  }

  async checkUserReactionForOneComment(
    newCommentId: any,
    currentUserId: string,
  ): Promise<Reaction> {
    const query = `
      SELECT reaction FROM public."commentsReactions"
      WHERE "commentId"=$1 AND "userId"=$2
    `;

    const res = await this.dataSource.query(query, [
      newCommentId,
      currentUserId,
    ]);
    if (res.length === 0) return 'None';
    return res[0];
  }

  async checkUserReactionForManyComments(
    comments: CommentViewModel[],
    currentUserId: string,
  ) {
    const ids = comments.map((c) => c.id);
    const commentsReactionsQuery = `
      SELECT * FROM public."commentsReactions"
      WHERE "commentId" = ANY($1) AND "userId"=$2
    `;
    const reactions = await this.dataSource.query(commentsReactionsQuery, [
      ids,
      currentUserId,
    ]);
    return comments.map((c) => {
      c.myStatus =
        reactions.find((r: any) => r.commentId === c.id)?.reaction || 'None';
      return c;
    });
  }

  async findCommentsForPost(postId: string): Promise<CommentViewModel[]> {
    const query = `
      SELECT c.id, c."postId", c.content, c."commentatorId",
      users.login "commentatorLogin", c."createdAt", c."likesCount",
      c."dislikesCount" FROM public.comments c
      LEFT JOIN users ON users.id="commentatorId"
      WHERE c."postId"=$1
    `;
    const comments = await this.dataSource.query(query, [postId]);
    return comments;
  }

  async getCommentsQtyForPost(postId: string) {
    const query = `
      SELECT COUNT(*) FROM comments
      WHERE "postId"=$1
    `;
    const qtyRes = await this.dataSource.query(query, [postId]);
    return Number(qtyRes[0].count);
  }

  async deleteById(commentId: string) {
    const query = `
      DELETE FROM public.comments
	    WHERE id=$1;
    `;
    await this.dataSource.query(query, [commentId]);
  }
}
