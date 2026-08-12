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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CollabGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollabGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let CollabGateway = CollabGateway_1 = class CollabGateway {
    jwtService;
    server;
    logger = new common_1.Logger(CollabGateway_1.name);
    rooms = new Map();
    socketMeta = new Map();
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    userColor(userId) {
        const colors = [
            '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
            '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16',
        ];
        let hash = 0;
        for (let i = 0; i < userId.length; i++)
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }
    async handleConnection(socket) {
        try {
            const token = socket.handshake.auth?.token ||
                (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
            const payload = this.jwtService.verify(token);
            socket.data.userId = payload.sub;
            socket.data.name = payload.email.split('@')[0];
            this.logger.log(`Connected: ${socket.id} user=${payload.sub}`);
        }
        catch {
            this.logger.warn(`Unauthorized WS connection: ${socket.id}`);
            socket.disconnect();
        }
    }
    handleDisconnect(socket) {
        const meta = this.socketMeta.get(socket.id);
        if (meta) {
            const { canvasId, userId } = meta;
            const room = this.rooms.get(canvasId);
            if (room) {
                room.delete(socket.id);
                if (room.size === 0)
                    this.rooms.delete(canvasId);
            }
            socket.to(canvasId).emit('user:left', { userId });
            this.socketMeta.delete(socket.id);
        }
        this.logger.log(`Disconnected: ${socket.id}`);
    }
    handleJoin(socket, payload) {
        const { canvasId } = payload;
        const userId = socket.data.userId;
        const name = socket.data.name;
        const color = this.userColor(userId);
        socket.join(canvasId);
        if (!this.rooms.has(canvasId))
            this.rooms.set(canvasId, new Set());
        this.rooms.get(canvasId).add(socket.id);
        this.socketMeta.set(socket.id, { userId, name, canvasId, color });
        const others = [];
        this.rooms.get(canvasId).forEach(sid => {
            if (sid !== socket.id) {
                const m = this.socketMeta.get(sid);
                if (m)
                    others.push({ userId: m.userId, name: m.name, color: m.color });
            }
        });
        socket.emit('room:joined', { userId, name, color, collaborators: others });
        socket.to(canvasId).emit('user:joined', { userId, name, color });
        this.logger.log(`${userId} joined room ${canvasId}`);
    }
    handlePatch(socket, payload) {
        const meta = this.socketMeta.get(socket.id);
        if (!meta)
            return;
        socket.to(meta.canvasId).emit('canvas:patch', {
            userId: meta.userId,
            elements: payload.elements,
        });
    }
    handleCursor(socket, payload) {
        const meta = this.socketMeta.get(socket.id);
        if (!meta)
            return;
        const cursor = {
            userId: meta.userId,
            name: meta.name,
            color: meta.color,
            x: payload.x,
            y: payload.y,
        };
        socket.to(meta.canvasId).emit('cursor:move', cursor);
    }
};
exports.CollabGateway = CollabGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CollabGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('room:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CollabGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('canvas:patch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CollabGateway.prototype, "handlePatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cursor:move'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CollabGateway.prototype, "handleCursor", null);
exports.CollabGateway = CollabGateway = CollabGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/collab',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], CollabGateway);
//# sourceMappingURL=collab.gateway.js.map