import { IsNotEmpty, IsString } from "class-validator";

export class AuthUserDto {
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}