import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Blog } from './blog.entity';

@Entity('banned_users_for_blogs')
export class BannedUsersForBlogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;
  @ManyToOne(() => User)
  user: User;

  @Column()
  blogId: string;
  @ManyToOne(() => Blog)
  blog: Blog;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banReason: string;

  @Column({ default: () => 'now()' })
  banDate: Date;
}
