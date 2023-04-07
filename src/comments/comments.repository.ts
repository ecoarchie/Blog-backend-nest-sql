import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Reaction } from '../reactions/reaction.model';
import {
  CommentPagination,
  CommentsPaginator,
} from './dtos/comment-paginator.dto';
import { ReactionUpdate } from './dtos/reactionUpdate.model';
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
    return result[0].id;
  }

  async findCommentWithCommentatorInfoById(
    commentId: string,
  ): Promise<CommentViewModel | null> {
    const query = `
      SELECT c.id, c."postId", c.content, c."commentatorId",
      users.login "commentatorLogin", c."createdAt", 
      (SELECT count(*) FROM public."commentsReactions" LEFT JOIN users ON users.id="userId"
      WHERE "commentId" = c.id AND reaction = $3 AND users."isBanned" = $2) as "likesCount",
      (SELECT count(*) FROM public."commentsReactions" INNER JOIN users ON users.id="userId"
      WHERE "commentId" = c.id AND reaction = $4 AND users."isBanned" = $2) as "dislikesCount"
      FROM public.comments c
      LEFT JOIN users ON users.id="commentatorId"
      WHERE c.id=$1 AND users."isBanned" = $2
    `;
    const res = await this.dataSource.query(query, [
      commentId,
      false,
      'Like',
      'Dislike',
    ]);
    console.log(res);
    if (res.length === 0) return null;
    return res[0];
  }

  async checkUserReactionForOneComment(
    commentId: string,
    currentUserId: string,
  ): Promise<Reaction> {
    const query = `
      SELECT reaction FROM public."commentsReactions"
      WHERE "commentId"=$1 AND "userId"=$2
    `;
    const res = await this.dataSource.query(query, [commentId, currentUserId]);
    if (res.length === 0) return 'None';
    return res[0].reaction;
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

  async findCommentsForPost(
    postId: string,
    paginator: CommentsPaginator,
  ): Promise<CommentViewModel[]> {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
      SELECT c.id, c."postId", c.content, c."commentatorId",
      users.login "commentatorLogin", c."createdAt", 
    (SELECT count(*) FROM public."commentsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "commentId" = c.id AND reaction = $4 AND users."isBanned" = $6) as "likesCount",
    (SELECT count(*) FROM public."commentsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "commentId" = c.id AND reaction = $5 AND users."isBanned" = $6) as "dislikesCount"
      FROM public.comments c
      LEFT JOIN users ON users.id="commentatorId"
      WHERE c."postId"=$1
      ORDER BY "${sortBy}" ${sortDirection}
      LIMIT $2 OFFSET $3 
    `;
    const comments = await this.dataSource.query(query, [
      postId,
      pageSize,
      skip,
      'Like',
      'Dislike',
      false,
    ]);
    return comments;
  }

  async findAllCommentsForNotBannedBlogs(paginator: CommentsPaginator) {
    const sortBy = paginator.sortBy;
    const sortDirection = paginator.sortDirection;
    const pageSize = paginator.pageSize;
    const skip = (paginator.pageNumber - 1) * paginator.pageSize;
    const query = `
    SELECT c.id, c."postId", c.content, c."commentatorId", u.login "commentatorLogin",
    c."createdAt", p.title, p."blogId" , b.name "blogName",
    (SELECT count(*) FROM public."commentsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "commentId" = c.id AND reaction = $4 AND users."isBanned" = $6) as "likesCount",
    (SELECT count(*) FROM public."commentsReactions" LEFT JOIN users ON users.id="userId"
    WHERE "commentId" = c.id AND reaction = $5 AND users."isBanned" = $6) as "dislikesCount"
    FROM public.comments c
    LEFT JOIN blogposts p ON c."postId" = p.id
    LEFT JOIN users u ON c."commentatorId" = u.id
    LEFT JOIN blogs b ON p."blogId" = b.id
    WHERE b."isBanned" = $1
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $2 OFFSET $3 
    `;
    const values = [false, pageSize, skip, 'Like', 'Dislike', false];
    const comments = await this.dataSource.query(query, values);
    return comments;
  }

  async getCommentsQtyForNotBannedBlogs() {
    const totalCountQuery = `
    SELECT COUNT(c.id) FROM public.comments c
    LEFT JOIN blogposts p ON c."postId" = p.id
    LEFT JOIN users u ON c."commentatorId" = u.id
    LEFT JOIN blogs b ON p."blogId" = b.id
    WHERE b."isBanned" = $1
    `;
    const result = await this.dataSource.query(totalCountQuery, [false]);
    return Number(result[0].count);
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

  async deleteAllComments() {
    const query = `
      DELETE FROM public.comments
    `;
    await this.dataSource.query(query);
  }

  async updateContent(commentId: string, content: string) {
    const query = `
      UPDATE public.comments
	    SET content=$1
	    WHERE id=$2;
    `;
    await this.dataSource.query(query, [content, commentId]);
  }

  // async updateReactionCount(commentId: string, reactionUpdate: ReactionUpdate) {
  //   const query = `
  //     UPDATE public.comments
  //     SET "likesCount" = "likesCount" + $1, "dislikesCount" = "dislikesCount" + $2
  //     WHERE id=$3;
  //   `;
  //   await this.dataSource.query(query, [
  //     reactionUpdate.likesCount,
  //     reactionUpdate.dislikesCount,
  //     commentId,
  //   ]);
  // }

  async updateCommentsReactions(
    commentId: string,
    currentUserId: string,
    likeStatus: string,
  ): Promise<void> {
    const reactionQuery = `
      SELECT * FROM public."commentsReactions"
      WHERE "commentId"=$1 AND "userId"=$2
    `;
    const reactionRes = await this.dataSource.query(reactionQuery, [
      commentId,
      currentUserId,
    ]);

    const insertQuery = `
      INSERT INTO public."commentsReactions"(
	    "commentId", "userId", reaction)
	    VALUES ($1, $2, $3);
    `;
    const updateQuery = `
      UPDATE public."commentsReactions"
	    SET  reaction=$1
	    WHERE id=$2;
    `;
    if (reactionRes.length === 0) {
      await this.dataSource.query(insertQuery, [
        commentId,
        currentUserId,
        likeStatus,
      ]);
    } else {
      await this.dataSource.query(updateQuery, [likeStatus, reactionRes[0].id]);
    }
  }
}
