import { Module } from '@nestjs/common';
import { EmailService } from '../utils/email.service';
import { JwtService } from '../utils/jwt.service';
import { AuthController } from './controllers/auth.controller';
import { SessionsController } from './controllers/sessions.controller';
import { UsersController } from './controllers/users.controller';
import { SessionsRepository } from './repositories/sessions.repository';
import { UsersQueryRepository } from './repositories/users.query-repository';
import { UsersRepository } from './repositories/users.repository';
import { AuthService } from './services/auth.service';
import { SessionsService } from './services/sessions.service';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController, AuthController, SessionsController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    SessionsService,
    SessionsRepository,
    EmailService,
    JwtService,
    AuthService,
  ],
})
export class UsersModule {}
