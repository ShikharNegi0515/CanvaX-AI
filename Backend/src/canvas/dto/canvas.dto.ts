import { IsArray, IsOptional, IsString } from 'class-validator';

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
