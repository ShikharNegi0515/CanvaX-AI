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
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    findAll(req: AuthRequest): Promise<{
        user: {
            email: string;
            name: string | null;
            id: string;
        };
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        thumbnail: string | null;
        userId: string;
        collaborators: {
            user: {
                email: string;
                name: string | null;
                id: string;
            };
            role: import("@prisma/client").$Enums.Role;
        }[];
    }[]>;
    findOne(id: string, req: AuthRequest): Promise<{
        role: string | undefined;
        collaborators: ({
            user: {
                email: string;
                name: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            role: import("@prisma/client").$Enums.Role;
            canvasId: string;
        })[];
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
    share(id: string, req: AuthRequest, dto: ShareCanvasDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        canvasId: string;
    }>;
}
export {};
