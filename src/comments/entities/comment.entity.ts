import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reaction } from '../../reactions/reaction.model';
import { BlogPost } from '../../posts/entities/blogpost.entity';
import { User } from '../../users/entities/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  postId: string;
  @ManyToOne(() => BlogPost, (bp) => bp.comments, { onDelete: 'CASCADE' })
  post: BlogPost;

  @Column()
  content: string;

  @Column({ type: 'uuid', nullable: false })
  commentatorId: string;
  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  commentator: User;

  @CreateDateColumn()
  createdAt: Date;
}

export interface CommentViewModel extends Comment {
  commentatorLogin: string;
  myStatus: Reaction;
  likesCount: number;
  dislikesCount: number;
}
// comment
