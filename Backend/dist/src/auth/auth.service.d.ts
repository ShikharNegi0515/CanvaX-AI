import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: any;
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        access_token: string;
    }>;
    getProfile(userId: string): Promise<any>;
    private signToken;
}
