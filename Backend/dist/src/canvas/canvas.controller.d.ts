import { CanvasService } from './canvas.service';
import { CreateCanvasDto, SaveCanvasDto } from './dto/canvas.dto';
type AuthRequest = {
    user: {
        id: string;
        email: string;
    };
};
export declare class CanvasController {
    private canvasService;
    constructor(canvasService: CanvasService);
    create(req: AuthRequest, dto: CreateCanvasDto): Promise<any>;
    findAll(req: AuthRequest): Promise<any>;
    findOne(id: string, req: AuthRequest): Promise<any>;
    save(id: string, req: AuthRequest, dto: SaveCanvasDto): Promise<any>;
    remove(id: string, req: AuthRequest): Promise<{
        success: boolean;
    }>;
}
export {};
