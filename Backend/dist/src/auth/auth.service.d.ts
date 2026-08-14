import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            email: string;
            name: string | null;
            id: string;
            createdAt: Date;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            email: string;
            name: string | null;
            id: string;
            googleId: string | null;
            githubId: string | null;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    validateOAuthUser(details: {
        email: string;
        name?: string;
        provider: 'google' | 'github';
        providerId: string;
        avatarUrl?: string;
    }): Promise<{
        user: {
            email: string;
            name: string | null;
            id: string;
            googleId: string | null;
            githubId: string | null;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    getProfile(userId: string): Promise<{
        email: string;
        name: string | null;
        id: string;
        createdAt: Date;
        canvases: {
            name: string;
            id: string;
            updatedAt: Date;
        }[];
    }>;
    private signToken;
}
