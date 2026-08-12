import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto } from './dto/canvas.dto';

@Injectable()
export class CanvasService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCanvasDto) {
    return this.prisma.canvas.create({
      data: { userId, name: dto.name ?? 'Untitled Canvas', data: [] },
    });
  }

  async findAll(userId: string) {
    return this.prisma.canvas.findMany({
      where: {
        OR: [
          { userId },
          { collaborators: { some: { id: userId } } }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      select: { 
        id: true, 
        name: true, 
        thumbnail: true, 
        updatedAt: true, 
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        collaborators: { select: { id: true, name: true, email: true } }
      },
    });
  }

  async findOne(id: string, userId: string) {
    const canvas = await this.prisma.canvas.findUnique({ 
      where: { id },
      include: { collaborators: true }
    });
    
    if (!canvas) throw new NotFoundException('Canvas not found');
    
    // If the user is not the owner and not already a collaborator, add them
    if (canvas.userId !== userId && !canvas.collaborators.some(c => c.id === userId)) {
      await this.prisma.canvas.update({
        where: { id },
        data: { collaborators: { connect: { id: userId } } }
      });
    }
    
    return canvas;
  }

  async save(id: string, userId: string, dto: SaveCanvasDto) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id } });
    if (!canvas) throw new NotFoundException('Canvas not found');
    // Removed ownership check to allow collaborators to save their edits

    return this.prisma.canvas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.data !== undefined && { data: dto.data }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id } });
    if (!canvas) throw new NotFoundException('Canvas not found');
    if (canvas.userId !== userId) throw new ForbiddenException();
    await this.prisma.canvas.delete({ where: { id } });
    return { success: true };
  }
}
