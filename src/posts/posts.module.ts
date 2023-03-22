import { forwardRef, Module } from '@nestjs/common';
import { BlogsModule } from 'src/blogs/blogs.module';
import { PostsController } from './posts.controller';
import { PostsQueryRepository } from './posts.query-repository';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostsRepository, PostsQueryRepository],
  imports: [forwardRef(() => BlogsModule)],
  exports: [PostsQueryRepository, PostsRepository, PostsService],
})
export class PostsModule {}
