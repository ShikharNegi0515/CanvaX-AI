"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CanvasService = class CanvasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.canvas.create({
            data: { userId, name: dto.name ?? 'Untitled Canvas', data: [] },
        });
    }
    async findAll(userId) {
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
    async findOne(id, userId) {
        const canvas = await this.prisma.canvas.findUnique({
            where: { id },
            include: { collaborators: { include: { user: { select: { id: true, name: true, email: true } } } } }
        });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        const isOwner = canvas.userId === userId;
        const collab = canvas.collaborators.find(c => c.userId === userId);
        if (!isOwner && !collab) {
            throw new common_1.ForbiddenException('You do not have permission to view this canvas. Ask the owner to share it with you.');
        }
        return { ...canvas, role: isOwner ? 'ADMIN' : collab?.role };
    }
    async save(id, userId, dto) {
        const canvas = await this.prisma.canvas.findUnique({
            where: { id },
            include: { collaborators: true }
        });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        const isOwner = canvas.userId === userId;
        const collab = canvas.collaborators.find(c => c.userId === userId);
        if (!isOwner && (!collab || collab.role !== 'EDITOR')) {
            throw new common_1.ForbiddenException('You do not have permission to edit this canvas');
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
    async remove(id, userId) {
        const canvas = await this.prisma.canvas.findUnique({ where: { id } });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        if (canvas.userId !== userId)
            throw new common_1.ForbiddenException('Only the owner can delete the canvas');
        await this.prisma.canvas.delete({ where: { id } });
        return { success: true };
    }
    async share(id, userId, dto) {
        const canvas = await this.prisma.canvas.findUnique({ where: { id } });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        if (canvas.userId !== userId)
            throw new common_1.ForbiddenException('Only the owner can share the canvas');
        const userToShare = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!userToShare)
            throw new common_1.NotFoundException('User with that email not found');
        if (userToShare.id === userId)
            throw new common_1.BadRequestException('You cannot share with yourself');
        const existing = await this.prisma.canvasCollaborator.findUnique({
            where: { canvasId_userId: { canvasId: id, userId: userToShare.id } }
        });
        if (existing) {
            return this.prisma.canvasCollaborator.update({
                where: { id: existing.id },
                data: { role: dto.role }
            });
        }
        else {
            return this.prisma.canvasCollaborator.create({
                data: {
                    canvasId: id,
                    userId: userToShare.id,
                    role: dto.role
                }
            });
        }
    }
};
exports.CanvasService = CanvasService;
exports.CanvasService = CanvasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CanvasService);
//# sourceMappingURL=canvas.service.js.map