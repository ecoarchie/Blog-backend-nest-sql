import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserInputDto } from '../dtos/create-user-input.dto';
import { BanUserDto } from '../dtos/ban-user.dto';
import { SessionsRepository } from '../repositories/sessions.repository';
import { JwtService } from '../../utils/jwt.service';
import { EmailService } from '../../utils/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
    await this.usersRepository.updateUserBanInfo(userId, banUserDto);

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

  async sendEmailConfirmation(userId: string) {
    const user = await this.usersRepository.findUserById(userId);
    try {
      await this.emailService.sendEmailConfirmationMessage(user);
    } catch (error) {
      console.log('Could not send email!');
      console.log(error);
      return;
    }
  }

  async confirmEmail(code: string): Promise<boolean> {
    const user = await this.usersRepository.findUserByConfirmCode(code);
    if (
      !user ||
      user.confirmationCode !== code ||
      user.confirmationCodeExpirationDate < new Date() ||
      user.confirmationCodeIsConfirmed
    ) {
      return false;
    }
    await this.usersRepository.setEmailIsConfirmedToTrue(user.id);
    return true;
  }

  async resendRegistrationEmail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);
    if (user && !user.confirmationCodeIsConfirmed) {
      const newConfirmationCode = uuidv4();
      this.usersRepository.updateEmailConfirmationCode(
        newConfirmationCode,
        user.id,
      );

      await this.emailService.sendEmailConfirmationMessage(user);
    } else {
      throw new BadRequestException({
        message: `Email is already confirmed or doesn't exist`,
        field: 'email',
      });
    }
  }

  async checkCredentials(user: User, password: string): Promise<boolean> {
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? true : false;
  }
}
