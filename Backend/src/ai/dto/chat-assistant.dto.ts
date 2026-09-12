import { IsArray, IsOptional } from 'class-validator';

export class ChatAssistantDto {
  @IsArray()
  messages: { role: 'user' | 'assistant'; content: string }[];

  @IsArray()
  @IsOptional()
  canvasElements?: Record<string, unknown>[];
}
