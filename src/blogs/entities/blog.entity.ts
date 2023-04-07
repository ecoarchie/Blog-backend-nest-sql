import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../posts/entities/blogpost.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isMembership: boolean;

  @Column({ type: 'uuid', nullable: false })
  ownerId: string;
  @ManyToOne(() => User, (u) => u.blogs, { onDelete: 'CASCADE' })
  owner: User;

  @OneToMany(() => BlogPost, (bp) => bp.blog)
  posts: BlogPost[];

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banDate: Date;
}
