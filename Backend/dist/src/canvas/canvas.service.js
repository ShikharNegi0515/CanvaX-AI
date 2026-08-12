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
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, thumbnail: true, updatedAt: true, createdAt: true },
        });
    }
    async findOne(id, userId) {
        const canvas = await this.prisma.canvas.findUnique({ where: { id } });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        if (canvas.userId !== userId)
            throw new common_1.ForbiddenException();
        return canvas;
    }
    async save(id, userId, dto) {
        const canvas = await this.prisma.canvas.findUnique({ where: { id } });
        if (!canvas)
            throw new common_1.NotFoundException('Canvas not found');
        if (canvas.userId !== userId)
            throw new common_1.ForbiddenException();
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
            throw new common_1.ForbiddenException();
        await this.prisma.canvas.delete({ where: { id } });
        return { success: true };
    }
};
exports.CanvasService = CanvasService;
exports.CanvasService = CanvasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CanvasService);
//# sourceMappingURL=canvas.service.js.map