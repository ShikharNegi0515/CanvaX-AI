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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    findAll(req: AuthRequest): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
        };
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        thumbnail: string | null;
        collaborators: {
            id: string;
            email: string;
            name: string | null;
        }[];
    }[]>;
    findOne(id: string, req: AuthRequest): Promise<{
        collaborators: {
            id: string;
            email: string;
            name: string | null;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    save(id: string, req: AuthRequest, dto: SaveCanvasDto): Promise<{
        id: string;
        name: string;
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
