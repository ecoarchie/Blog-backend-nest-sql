import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BlogPost } from './blogpost.entity';
import { User } from '../../users/entities/user.entity';
import { Reaction } from '../../reactions/reaction.model';

@Entity('postsReactions')
export class PostsReactions {
  @PrimaryColumn()
  postId: string;
  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  post: BlogPost;

  @PrimaryColumn()
  userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'None' })
  reaction: Reaction;

  @CreateDateColumn()
  createdAt: Date;
}
