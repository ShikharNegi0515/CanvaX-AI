import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: any;
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        access_token: string;
    }>;
    getProfile(req: {
        user: {
            id: string;
            email: string;
        };
    }): Promise<any>;
}
