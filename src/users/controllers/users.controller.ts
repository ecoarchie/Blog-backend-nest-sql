import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { UsersPagination } from '../dtos/paginator';
import { UserPaginator, UserPaginatorOptions } from '../dtos/users-paginator';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import { UsersService } from '../services/users.service';

@Controller('sa/users')
export class UsersController {
    constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    private readonly userService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Query() userPaginatorQuery: UserPaginator,
  ): Promise<UsersPagination> {
    console.log("🚀 ~ file: users.controller.ts:19 ~ userPaginatorQuery:", userPaginatorQuery)
    // const userPaginatorOptions = new UserPaginatorOptions(userPaginatorQuery);
    const users = await this.userQueryRepository.findAll(userPaginatorQuery);
    return users;
  }

  @Post()
  async create(@Body() dto: CreateUserInputDto) {
    const newUserId = await this.userService.createNewUser(dto);
    console.log("🚀 ~ file: users.controller.ts:27 ~ UsersController ~ create ~ newUserId:", newUserId)
    return this.userQueryRepository.findUserById(newUserId);
  }

  // @HttpCode(204)
  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   const result = await this.userQueryRepository.deleteUserById(id);
  //   if (!result) throw new NotFoundException();
  // }

  // @HttpCode(204)
  // @Put(':id/ban')
  // async banUnbanUser(
  //   @Param('id') userId: string,
  //   @Body() banUserDto: BanUserDto,
  // ) {
  //   await this.userService.banUnbanUser(userId, banUserDto);
  // }
}
