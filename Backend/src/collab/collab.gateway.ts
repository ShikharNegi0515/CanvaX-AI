import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** A single user cursor broadcast to collaborators */
interface CursorPayload {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

/** A batch of canvas element patches broadcast to collaborators */
interface PatchPayload {
  userId: string;
  /** Full new elements array for the canvas */
  elements: unknown[];
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/collab',
})
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CollabGateway.name);

  /** canvasId → Set of socketIds in that room */
  private rooms = new Map<string, Set<string>>();
  /** socketId → { userId, name, canvasId, color } */
  private socketMeta = new Map<
    string,
    { userId: string; name: string; canvasId: string; color: string }
  >();

  constructor(private jwtService: JwtService) {}

  /** Assign a unique color per userId (deterministic from hash) */
  private userColor(userId: string): string {
    const colors = [
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#ec4899',
      '#8b5cf6',
      '#06b6d4',
      '#ef4444',
      '#84cc16',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++)
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  async handleConnection(socket: Socket) {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
      const payload = this.jwtService.verify(token);
      socket.data.userId = payload.sub;
      // Derive a display name from the email prefix (e.g. john.doe@example.com → john.doe)
      socket.data.name = payload.email.split('@')[0];
      this.logger.log(`Connected: ${socket.id} user=${payload.sub}`);
    } catch {
      this.logger.warn(`Unauthorized WS connection: ${socket.id}`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const meta = this.socketMeta.get(socket.id);
    if (meta) {
      const { canvasId, userId } = meta;
      const room = this.rooms.get(canvasId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) this.rooms.delete(canvasId);
      }
      // Notify others that this user left
      socket.to(canvasId).emit('user:left', { userId });
      this.socketMeta.delete(socket.id);
    }
    this.logger.log(`Disconnected: ${socket.id}`);
  }

  @SubscribeMessage('room:join')
  handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { canvasId: string },
  ) {
    const { canvasId } = payload;
    const userId: string = socket.data.userId;
    const name: string = socket.data.name;
    const color = this.userColor(userId);

    socket.join(canvasId);

    if (!this.rooms.has(canvasId)) this.rooms.set(canvasId, new Set());
    this.rooms.get(canvasId)!.add(socket.id);

    this.socketMeta.set(socket.id, { userId, name, canvasId, color });

    // Tell the joiner who else is online
    const others: { userId: string; name: string; color: string }[] = [];
    this.rooms.get(canvasId)!.forEach((sid) => {
      if (sid !== socket.id) {
        const m = this.socketMeta.get(sid);
        if (m) others.push({ userId: m.userId, name: m.name, color: m.color });
      }
    });
    socket.emit('room:joined', { userId, name, color, collaborators: others });

    // Notify others about the new joiner
    socket.to(canvasId).emit('user:joined', { userId, name, color });

    this.logger.log(`${userId} joined room ${canvasId}`);
  }

  @SubscribeMessage('canvas:patch')
  handlePatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PatchPayload,
  ) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;
    // Broadcast to everyone else in the room
    socket.to(meta.canvasId).emit('canvas:patch', {
      userId: meta.userId,
      elements: payload.elements,
    });
  }

  @SubscribeMessage('cursor:move')
  handleCursor(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { x: number; y: number },
  ) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;
    const cursor: CursorPayload = {
      userId: meta.userId,
      name: meta.name,
      color: meta.color,
      x: payload.x,
      y: payload.y,
    };
    socket.to(meta.canvasId).emit('cursor:move', cursor);
  }
}
