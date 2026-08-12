import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto } from './dto/canvas.dto';
export declare class CanvasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateCanvasDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
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
    findOne(id: string, userId: string): Promise<{
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
    save(id: string, userId: string, dto: SaveCanvasDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        thumbnail: string | null;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
