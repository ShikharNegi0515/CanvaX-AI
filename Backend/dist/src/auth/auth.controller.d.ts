import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getProfile(req: {
        user: {
            id: string;
            email: string;
        };
    }): Promise<{
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
}
