import { AiService, DiagramElement } from './ai.service';
import { GenerateDiagramDto } from './dto/generate-diagram.dto';
import { BeautifyDiagramDto } from './dto/beautify-diagram.dto';
import { TransformElementsDto } from './dto/transform-elements.dto';
import { ChatAssistantDto } from './dto/chat-assistant.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generate(dto: GenerateDiagramDto): Promise<{
        elements: DiagramElement[];
    }>;
    beautify(dto: BeautifyDiagramDto): Promise<{
        elements: DiagramElement[];
    }>;
    transform(dto: TransformElementsDto): Promise<{
        elements: DiagramElement[];
    }>;
    chat(dto: ChatAssistantDto): Promise<{
        text: string;
        newElements?: DiagramElement[];
    }>;
}
