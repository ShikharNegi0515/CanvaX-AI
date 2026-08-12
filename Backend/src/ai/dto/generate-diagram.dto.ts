import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class GenerateDiagramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;
}
