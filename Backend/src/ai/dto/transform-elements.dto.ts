import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class TransformElementsDto {
  @IsArray()
  @IsNotEmpty()
  elements: any[];

  @IsString()
  @IsNotEmpty()
  prompt: string;
}
