import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto, ShareCanvasDto } from './dto/canvas.dto';
export declare class CanvasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateCanvasDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    save(id: string, userId: string, dto: SaveCanvasDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    share(id: string, userId: string, dto: ShareCanvasDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        role: import("@prisma/client").$Enums.Role;
        canvasId: string;
    }>;
}
