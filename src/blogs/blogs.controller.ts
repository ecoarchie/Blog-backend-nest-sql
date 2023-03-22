import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsPagination, BlogsPaginator } from './dtos/blog-paginator.dto';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository, // private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogsPaginator,
  ): Promise<BlogsPagination> {
    // const blogsPaginatorOptions = new BlogPaginatorOptions(blogsPaginatorQuery);
    const blogs = await this.blogsQueryRepository.findAllBlogs(
      blogsPaginatorQuery,
    );
    return blogs;
  }

  @Get(':id')
  async findBlogById(@Param('id') id: string, @Res() res: Response) {
    console.log(id);
    const blogFound = await this.blogsQueryRepository.findNotBannedBlogById(id);
    if (!blogFound) return res.sendStatus(404);
    return res.status(200).send(blogFound);
  }

  // @Get(':blogId/posts')
  // async getAllPostForBlog(
  //   @Param('blogId') blogId: string,
  //   @Query() postsPaginatorQuery: PostPaginator,
  //   @Res() res: Response,
  //   @Req() req: Request,
  // ) {
  //   const blogFound = await this.blogsQueryRepository.findBlogById(blogId);
  //   if (!blogFound) return res.sendStatus(404);

  //   const posts = await this.postsQueryRepository.findAllPostsForBlog(
  //     blogId,
  //     postsPaginatorQuery,
  //     req.user?.id || null,
  //   );
  //   res.send(posts);
  // }
}
