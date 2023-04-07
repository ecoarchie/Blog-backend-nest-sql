import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  passwordHash: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isBanned: boolean;
  @Column({ nullable: true })
  banDate: Date;
  @Column({ nullable: true })
  banReason: string;

  @Column()
  @Generated('uuid')
  confirmationCode: string;
  @Column({ default: () => "now() + '01:00:00'::interval" })
  confirmationCodeExpirationDate: Date;
  @Column({ default: false })
  confirmationCodeIsConfirmed: boolean;

  @Column({ type: 'uuid', nullable: true })
  passwordRecoveryCode: string;
  @Column({ nullable: true })
  passwordRecoveryExpirationDate: Date;
  @Column({ default: false })
  passwordRecoveryCodeIsUsed: boolean;

  @OneToMany(() => Session, (s) => s.user)
  sessions: Session[];

  @OneToMany(() => Comment, (c) => c.commentator, { onDelete: 'CASCADE' })
  comments: Comment;

  @OneToMany(() => Blog, (b) => b.owner)
  blogs: Blog[];
}
