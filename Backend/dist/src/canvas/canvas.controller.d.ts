import { CanvasService } from './canvas.service';
import { CreateCanvasDto, SaveCanvasDto, ShareCanvasDto } from './dto/canvas.dto';
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
        data: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(req: AuthRequest): Promise<{
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: string;
            name: string | null;
            email: string;
        };
        collaborators: {
            user: {
                id: string;
                name: string | null;
                email: string;
            };
            role: import("@prisma/client").$Enums.Role;
        }[];
    }[]>;
    findOne(id: string, req: AuthRequest): Promise<{
        role: string | undefined;
        collaborators: ({
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            canvasId: string;
            role: import("@prisma/client").$Enums.Role;
        })[];
        data: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    save(id: string, req: AuthRequest, dto: SaveCanvasDto): Promise<{
        data: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, req: AuthRequest): Promise<{
        success: boolean;
    }>;
    share(id: string, req: AuthRequest, dto: ShareCanvasDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        canvasId: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
export {};
