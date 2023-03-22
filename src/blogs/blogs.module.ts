import { forwardRef, Module } from '@nestjs/common';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { BlogsBloggerController } from './blogger-blogs.controller';
import { BlogsPublicController } from './blogs.controller';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';
import { SuperUserBlogsPublicController } from './sa-blogs.controller';

@Module({
  imports: [forwardRef(() => UsersModule), PostsModule],
  exports: [BlogsRepository, BlogsQueryRepository, BlogsService],
  controllers: [BlogsPublicController, BlogsBloggerController, SuperUserBlogsPublicController],
  providers: [BlogsService, BlogsRepository, BlogsQueryRepository],
})
export class BlogsModule {}
