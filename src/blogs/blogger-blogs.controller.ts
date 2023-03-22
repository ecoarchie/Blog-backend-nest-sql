import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user-param.decorator';
import { CreatePostDto } from 'src/posts/dtos/createPost.dto';
import { UpdatePostDto } from 'src/posts/dtos/updatePost.dto';
import { PostsQueryRepository } from 'src/posts/posts.query-repository';
import { PostsService } from 'src/posts/posts.service';
import { BearerAuthGuard } from 'src/users/guards/bearer.auth.guard';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import { Blog } from './entities/blog.entity';

@UseGuards(BearerAuthGuard)
@Controller('blogger/blogs')
export class BlogsBloggerController {
  constructor(
    private readonly blogsRepository: BlogsRepository, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsService: BlogsService, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository, // private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService, // private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createBlog(
    @Body() blogDto: CreateBlogDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Partial<Blog>> {
    const newBlogId = await this.blogsService.createNewBlog(
      blogDto,
      currentUserId,
    );
    return this.blogsQueryRepository.findLatestCreatedBlog(currentUserId);
  }

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogsPaginator,
    @CurrentUser('id') currentUserId: string,
  ): Promise<BlogsPagination> {
    console.log(currentUserId);
    const blogs = await this.blogsQueryRepository.findAllBlogsForCurrentUser(
      blogsPaginatorQuery,
      currentUserId,
    );
    return blogs;
  }

  @HttpCode(204)
  @Put(':id')
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.blogsService.updateBlog(currentUserId, blogId, updateBlogDto);
  }

  @HttpCode(201)
  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    const postId = await this.blogsService.createBlogPost(
      blogId,
      createPostDto,
      currentUserId,
    );
    const post = await this.postsQueryRepository.findLatestCreatedPostByBlogId(
      blogId,
    );
    return post;
  }

  @HttpCode(204)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    await this.postsService.updatePostById(
      blogId,
      postId,
      updatePostDto,
      currentUserId,
    );
  }

  @HttpCode(204)
  @Delete(':blogId')
  async deleteBlogById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
  ) {
    await this.blogsService.deleteBlogById(currentUserId, blogId);
  }

  @HttpCode(204)
  @Delete(':blogId/posts/:postId')
  async deletePostById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.postsService.deletePostById(blogId, postId, currentUserId);
  }

  // @Get('comments')
  // async getAllCommentsForAllPostsOfCurrentUser(
  //   @Query() commentPaginationQuery: CommentsPaginationOptions,
  //   @CurrentUser('id') currentUserId: string,
  // ) {
  //   const allUsersPosts =
  //     await this.blogsQueryRepository.findAllPostsForAllBlogsOfCurrentUser(
  //       currentUserId,
  //     );

  //   const paginator = new CommentsPaginationOptions(commentPaginationQuery);
  //   const comments = await this.commentsQueryRepo.findAllCommentsForPosts(
  //     allUsersPosts,
  //     paginator,
  //   );
  //   return comments;
  // }
}
