import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email/:userId/:emailToken')
  verifyEmail(
    @Param('userId') userId: string,
    @Param('emailToken') emailToken: string,
  ) {
    return this.authService.verifyEmail(userId, emailToken);
  }
}
