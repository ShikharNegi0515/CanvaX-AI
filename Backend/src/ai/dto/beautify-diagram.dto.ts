import { IsArray, IsNotEmpty } from 'class-validator';

export class BeautifyDiagramDto {
  @IsArray()
  @IsNotEmpty()
  elements: any[];
}
