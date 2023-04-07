import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('blogposts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  content: string;

  @Column()
  blogId: string;
  @ManyToOne(() => Blog, (b) => b.posts, { onDelete: 'CASCADE' })
  blog: Blog;

  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
