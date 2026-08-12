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
        thumbnail: string | null;
        userId: string;
    }>;
    findAll(req: AuthRequest): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        thumbnail: string | null;
    }[]>;
    findOne(id: string, req: AuthRequest): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    save(id: string, req: AuthRequest, dto: SaveCanvasDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    remove(id: string, req: AuthRequest): Promise<{
        success: boolean;
    }>;
}
export {};
