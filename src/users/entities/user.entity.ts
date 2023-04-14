import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserRegisterConfirmation } from './user-register-confirmation.entity';
import { UserPasswordRecovery } from './user-pass-recovery.entity';

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

  @OneToMany(() => Session, (s) => s.user)
  sessions: Session[];

  @OneToMany(() => Comment, (c) => c.commentator, { onDelete: 'CASCADE' })
  comments: Comment;

  @OneToMany(() => Blog, (b) => b.owner)
  blogs: Blog[];

  @OneToOne(() => UserRegisterConfirmation, (c) => c.user) // specify inverse side as a second parameter
  confirmation: UserRegisterConfirmation;

  @OneToOne(() => UserPasswordRecovery, (c) => c.user) // specify inverse side as a second parameter
  passRecovery: UserRegisterConfirmation;
}
