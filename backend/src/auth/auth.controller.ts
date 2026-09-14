import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { UnauthorizedException } from '@nestjs/common';
import { login } from './auth.store';
import { Public } from './auth.guard';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    const user = login(body.username, body.password);
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    return {
      token: user.token,
      username: user.username,
      role: user.role,
    };
  }
}
