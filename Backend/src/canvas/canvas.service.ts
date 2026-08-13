import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCanvasDto, SaveCanvasDto, ShareCanvasDto } from './dto/canvas.dto';

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
          { collaborators: { some: { userId } } }
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
        collaborators: { select: { role: true, user: { select: { id: true, name: true, email: true } } } }
      },
    });
  }

  async findOne(id: string, userId: string) {
    const canvas = await this.prisma.canvas.findUnique({ 
      where: { id },
      include: { collaborators: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
    
    if (!canvas) throw new NotFoundException('Canvas not found');
    
    const isOwner = canvas.userId === userId;
    const collab = canvas.collaborators.find(c => c.userId === userId);
    
    if (!isOwner && !collab) {
      throw new ForbiddenException('You do not have permission to view this canvas. Ask the owner to share it with you.');
    }
    
    // Add the computed role to the response
    return { ...canvas, role: isOwner ? 'ADMIN' : collab?.role };
  }

  async save(id: string, userId: string, dto: SaveCanvasDto) {
    const canvas = await this.prisma.canvas.findUnique({ 
      where: { id },
      include: { collaborators: true }
    });
    if (!canvas) throw new NotFoundException('Canvas not found');
    
    const isOwner = canvas.userId === userId;
    const collab = canvas.collaborators.find(c => c.userId === userId);

    if (!isOwner && (!collab || collab.role !== 'EDITOR')) {
      throw new ForbiddenException('You do not have permission to edit this canvas');
    }

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
    if (canvas.userId !== userId) throw new ForbiddenException('Only the owner can delete the canvas');
    await this.prisma.canvas.delete({ where: { id } });
    return { success: true };
  }

  async share(id: string, userId: string, dto: ShareCanvasDto) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id } });
    if (!canvas) throw new NotFoundException('Canvas not found');
    if (canvas.userId !== userId) throw new ForbiddenException('Only the owner can share the canvas');
    
    const userToShare = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!userToShare) throw new NotFoundException('User with that email not found');
    
    if (userToShare.id === userId) throw new BadRequestException('You cannot share with yourself');
    
    const existing = await this.prisma.canvasCollaborator.findUnique({
      where: { canvasId_userId: { canvasId: id, userId: userToShare.id } }
    });
    
    if (existing) {
      return this.prisma.canvasCollaborator.update({
        where: { id: existing.id },
        data: { role: dto.role }
      });
    } else {
      return this.prisma.canvasCollaborator.create({
        data: {
          canvasId: id,
          userId: userToShare.id,
          role: dto.role
        }
      });
    }
  }
}
