import {
  IsArray,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateCanvasDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class SaveCanvasDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  data?: object[];

  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class ShareCanvasDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}
