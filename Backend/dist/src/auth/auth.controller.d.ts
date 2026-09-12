import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
interface OAuthRequest {
    user: {
        access_token: string;
        user: Record<string, unknown>;
    };
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getProfile(req: {
        user: {
            id: string;
            email: string;
        };
    }): Promise<{
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
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: OAuthRequest, res: Response): void;
    githubAuth(): Promise<void>;
    githubAuthRedirect(req: OAuthRequest, res: Response): void;
}
export {};
