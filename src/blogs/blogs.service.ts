import {
    BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogsQueryRepository } from './blogs.query-repository';
import { BlogsRepository } from './blogs.repository';
import { IBlogOwnerInfo } from './dtos/blogOwnerInfo.interface';
import { CreateBlogDto } from './dtos/createBlog.dto';
import { CurrentUserDto } from './dtos/currentUser.dto';
import { UpdateBlogDto } from './dtos/updateBlogDto';
import isUUID from 'validator/lib/isUUID';
import { CreatePostDto } from 'src/posts/dtos/createPost.dto';
import { DataSource } from 'typeorm';
import { BannedUsersPaginator } from 'src/users/dtos/banned-users-paginator';
import { BanUserByBloggerDto } from 'src/users/dtos/ban-user-by-blogger.dto';

@Injectable()
export class BlogsService {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    protected dataSource: DataSource,
  ) {}
  async createNewBlog(
    blogDto: CreateBlogDto,
    currentUserId: string,
  ): Promise<string> {
    const blogId = await this.blogsRepository.createBlog(
      blogDto,
      currentUserId,
    );
    return blogId;
  }

  async updateBlog(
    currentUserId: string,
    blogId: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<void> {
    if (!isUUID(blogId)) throw new NotFoundException();
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.blogsRepository.updateBlog(blogId, updateBlogDto);
  }

  async createBlogPost(
    blogId: string,
    createPostDto: CreatePostDto,
    currentUserId: string,
  ) {
    if (!isUUID(blogId)) throw new NotFoundException(); //TODO make with class validator
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();
    await this.blogsRepository.createPost(createPostDto, blogId);
  }

  async deleteBlogById(currentUserId: string, blogId: string) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    console.log(blog)
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== currentUserId) throw new ForbiddenException()

    await this.blogsRepository.deleteBlogById(blogId)
  }
  async findAllBannedUsersForBlog(currentUserId: string, blogId: string, paginator: BannedUsersPaginator) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(blogId);
    if (!blog) throw new NotFoundException()
    if (blog.ownerId !== currentUserId) throw new ForbiddenException();

    const users = await this.blogsRepository.findAllBannedUsers(blogId, paginator);
    return users;
  }

  async banUserByBlogger(bloggerId: string, userId: string, banUserByBloggerDto: BanUserByBloggerDto) {
    const blog = await this.blogsRepository.findBlogWithOwnerById(banUserByBloggerDto.blogId);
    if (!blog)
      throw new BadRequestException({
        field: 'blogId',
        message: 'blog with this ID not found',
      });

    if (blog.ownerId !== bloggerId)
      throw new ForbiddenException();
    
    await this.blogsRepository.updateBanStatusOfUserInBlog(banUserByBloggerDto, userId)
  }
}
