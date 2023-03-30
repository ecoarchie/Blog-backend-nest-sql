import { Reaction } from '../../reactions/reaction.model';

export class Comment {
  id: string;
  postId: string;
  content: string;
  commentatorId: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
}

export interface CommentViewModel extends Comment {
  commentatorLogin: string;
  myStatus: Reaction;
}

// comment
