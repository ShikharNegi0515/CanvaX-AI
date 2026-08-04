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
    create(req: AuthRequest, dto: CreateCanvasDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        userId: string;
    }>;
    findAll(req: AuthRequest): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, req: AuthRequest): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        userId: string;
    }>;
    save(id: string, req: AuthRequest, dto: SaveCanvasDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        userId: string;
    }>;
    remove(id: string, req: AuthRequest): Promise<{
        success: boolean;
    }>;
}
export {};
