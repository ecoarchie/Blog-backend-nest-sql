import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { UsersRepository } from '../repositories/users.repository';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { BanUserDto } from '../dtos/ban-user.dto';
import { SessionsRepository } from '../repositories/sessions.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async loginUser(loginOrEmail: string, password: string) {
    const user = await this.usersRepository.findUserByLoginOrEmail(
      loginOrEmail,
      loginOrEmail,
    );
    if (!user || user.isBanned) return null;
    const isValidUser = await this.checkCredentials(user, password);
    if (isValidUser) {
      const deviceId = uuidv4();
      return {
        accessToken: await this.jwtService.createJwtAccessToken(user.id),
        refreshToken: await this.jwtService.createJwtRefresh(user.id, deviceId),
      };
    }
    return null;
  }

  async createNewUser(dto: CreateUserInputDto) {
    return await this.usersRepository.createUser(dto);
  }

  async banUnbanUser(userId: string, banUserDto: BanUserDto) {
    const user = await this.usersRepository.findUserById(userId);
    user.isBanned = banUserDto.isBanned;
    if (!banUserDto.isBanned) {
      user.banReason = null;
      user.banDate = null;
    }
    user.banReason = banUserDto.banReason;
    user.banDate = new Date();
    await this.usersRepository.updateUserBanInfo(user);

    await this.sessionsRepository.deleteAllUserSessions(userId);
    //TODO finish this function
    // await this.commentsRepository.updateCommentsForBannedUser(
    //   userId,
    //   banUserDto.isBanned,
    // );
    // await this.postsRepository.updatePostsForBannedUser(
    //   userId,
    //   banUserDto.isBanned,
    // );
  }

  async checkCredentials(user: User, password: string): Promise<boolean> {
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? true : false;
  }
}
