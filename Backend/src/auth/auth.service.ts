import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hashed },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = this.signToken(user.id, user.email);
    return { user, access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { password: _pw, ...safeUser } = user;
    const token = this.signToken(user.id, user.email);
    return { user: safeUser, access_token: token };
  }

  async validateOAuthUser(details: { email: string; name?: string; provider: 'google' | 'github'; providerId: string; avatarUrl?: string }) {
    const { email, name, provider, providerId, avatarUrl } = details;
    
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Update existing user with OAuth provider ID if not linked
      const updateData: any = {};
      if (provider === 'google' && !user.googleId) updateData.googleId = providerId;
      if (provider === 'github' && !user.githubId) updateData.githubId = providerId;
      if (!user.avatarUrl && avatarUrl) updateData.avatarUrl = avatarUrl;
      
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          googleId: provider === 'google' ? providerId : null,
          githubId: provider === 'github' ? providerId : null,
          avatarUrl,
        },
      });
    }

    const { password: _pw, ...safeUser } = user;
    const token = this.signToken(user.id, user.email);
    return { user: safeUser, access_token: token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, canvases: { select: { id: true, name: true, updatedAt: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }
}
