import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Request() req: any, @Res() res: any) {
    const { access_token, user } = req.user;
    res.redirect(
      `${FRONTEND_URL}/auth/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Request() req: any, @Res() res: any) {
    const { access_token, user } = req.user;
    res.redirect(
      `${FRONTEND_URL}/auth/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  }
}
