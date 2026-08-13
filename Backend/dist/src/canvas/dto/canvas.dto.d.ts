import { Role } from '@prisma/client';
export declare class CreateCanvasDto {
    name?: string;
}
export declare class SaveCanvasDto {
    name?: string;
    data?: object[];
    thumbnail?: string;
}
export declare class ShareCanvasDto {
    email: string;
    role: Role;
}
