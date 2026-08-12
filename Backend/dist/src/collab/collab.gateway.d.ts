import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
interface PatchPayload {
    userId: string;
    elements: unknown[];
}
export declare class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    private rooms;
    private socketMeta;
    constructor(jwtService: JwtService);
    private userColor;
    handleConnection(socket: Socket): Promise<void>;
    handleDisconnect(socket: Socket): void;
    handleJoin(socket: Socket, payload: {
        canvasId: string;
    }): void;
    handlePatch(socket: Socket, payload: PatchPayload): void;
    handleCursor(socket: Socket, payload: {
        x: number;
        y: number;
    }): void;
}
export {};
