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
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        userId: string;
    }>;
    save(id: string, userId: string, dto: SaveCanvasDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
