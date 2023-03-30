import { forwardRef, Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { CommentsController } from './comments.controller';
import { CommentsQueryRepository } from './comments.query-repository';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [forwardRef(() => PostsModule)],
  exports: [CommentsService, CommentsRepository, CommentsQueryRepository],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository, CommentsQueryRepository],
})
export class CommentsModule {}
