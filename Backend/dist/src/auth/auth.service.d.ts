import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            createdAt: Date;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
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
            id: string;
            email: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        createdAt: Date;
        canvases: {
            id: string;
            name: string;
            updatedAt: Date;
        }[];
    }>;
    private signToken;
}
