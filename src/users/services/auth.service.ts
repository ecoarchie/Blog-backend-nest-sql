import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  async validateUserBasic(authorization: string | null): Promise<boolean> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const [method, encoded] = authorization.split(' ');
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');

    const [username, password]: Array<string> = decoded.split(':');
    if (
      method !== 'Basic' ||
      username !== 'admin' ||
      password !== process.env.ADMIN_PASS
    ) {
      throw new UnauthorizedException();
    }
    return true;
  }

  async validateUserBearer(authorization: string): Promise<string> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.jwtService.getUserIdFromAccessToken(token);
    // const sessionId = userId
    //   ? await this.sessionModel.findOne
    //   : null;
    // if (!result) throw new UnauthorizedException();

    if (!userId) {
      throw new UnauthorizedException();
    }
    // request.user = await usersService.findUserByIdService(userId);
    return userId;
  }
}
