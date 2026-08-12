import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateDiagramDto } from './dto/generate-diagram.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateDiagramDto) {
    const elements = await this.aiService.generateDiagram(dto.prompt);
    return { elements };
  }
}
