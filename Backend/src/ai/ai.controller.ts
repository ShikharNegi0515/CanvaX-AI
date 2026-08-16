import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateDiagramDto } from './dto/generate-diagram.dto';
import { BeautifyDiagramDto } from './dto/beautify-diagram.dto';
import { TransformElementsDto } from './dto/transform-elements.dto';
import { ChatAssistantDto } from './dto/chat-assistant.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateDiagramDto) {
    const elements = await this.aiService.generateDiagram(dto.prompt);
    return { elements };
  }

  @Post('beautify')
  async beautify(@Body() dto: BeautifyDiagramDto) {
    const elements = await this.aiService.beautifyDiagram(dto.elements);
    return { elements };
  }

  @Post('transform')
  async transform(@Body() dto: TransformElementsDto) {
    const elements = await this.aiService.transformElements(dto.elements, dto.prompt);
    return { elements };
  }

  @Post('chat')
  async chat(@Body() dto: ChatAssistantDto) {
    const result = await this.aiService.chatWithAi(dto.messages, dto.canvasElements);
    return result;
  }
}
