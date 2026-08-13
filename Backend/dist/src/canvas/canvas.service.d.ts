import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto, ShareCanvasDto } from './dto/canvas.dto';
export declare class CanvasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateCanvasDto): Promise<{
        data: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    save(id: string, userId: string, dto: SaveCanvasDto): Promise<{
        data: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        name: string;
        thumbnail: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    share(id: string, userId: string, dto: ShareCanvasDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        canvasId: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
