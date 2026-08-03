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
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, updatedAt: true, createdAt: true },
    });
  }

  async findOne(id: string, userId: string) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id } });
    if (!canvas) throw new NotFoundException('Canvas not found');
    if (canvas.userId !== userId) throw new ForbiddenException();
    return canvas;
  }

  async save(id: string, userId: string, dto: SaveCanvasDto) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id } });
    if (!canvas) throw new NotFoundException('Canvas not found');
    if (canvas.userId !== userId) throw new ForbiddenException();

    return this.prisma.canvas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.data !== undefined && { data: dto.data }),
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
