import { Blog } from '../entities/blog.entity';

export type BlogPublicViewModel = Omit<
  Blog,
  'ownerId' | 'isBanned' | 'banDate'
>;
