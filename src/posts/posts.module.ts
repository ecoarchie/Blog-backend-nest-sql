import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { BlogsModule } from 'src/blogs/blogs.module';
import { AccessTokenValidationMiddleware } from 'src/middlewares/accessTokenCheck.middleware';
import { UsersModule } from 'src/users/users.module';
import { JwtService } from 'src/utils/jwt.service';
import { PostsController } from './posts.controller';
import { PostsQueryRepository } from './posts.query-repository';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostsRepository, PostsQueryRepository, JwtService],
  imports: [forwardRef(() => BlogsModule), forwardRef(() => UsersModule)],
  exports: [PostsQueryRepository, PostsRepository, PostsService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .exclude(
        { path: 'posts', method: RequestMethod.POST },
        { path: 'posts/:id', method: RequestMethod.DELETE },
        { path: 'posts/:postId/comments', method: RequestMethod.POST },
        { path: 'posts/:postId/like-status', method: RequestMethod.PUT },
      )
      .forRoutes(PostsController);
  }
}
