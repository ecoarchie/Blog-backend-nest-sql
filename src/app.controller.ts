import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { BlogsRepository } from './blogs/blogs.repository';
import { PostsRepository } from './posts/posts.repository';
import { UsersRepository } from './users/repositories/users.repository';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersRepository: UsersRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @HttpCode(204)
  @Delete('testing/all-data')
  async deleteAllData() {
    await this.blogsRepository.deleteAllBlogs();
    await this.postsRepository.deleteAllPosts();
    // await this.commentsRepository.deleteAllComments();
    await this.usersRepository.deleteAllUsers();
    await this.usersRepository.deleteAllSessions();
  }
}
