import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reaction } from '../../reactions/reaction.model';
import { Comment } from './comment.entity';

@Entity('commentsReactions')
export class CommentsReactions {
  @PrimaryColumn()
  commentId: string;
  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  comment: Comment;

  @PrimaryColumn()
  userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'None' })
  reaction: Reaction;

  @CreateDateColumn()
  createdAt: Date;
}
