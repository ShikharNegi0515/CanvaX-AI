import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto } from './dto/canvas.dto';
export declare class CanvasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateCanvasDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    findOne(id: string, userId: string): Promise<any>;
    save(id: string, userId: string, dto: SaveCanvasDto): Promise<any>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
