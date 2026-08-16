import { AiService } from './ai.service';
import { GenerateDiagramDto } from './dto/generate-diagram.dto';
import { BeautifyDiagramDto } from './dto/beautify-diagram.dto';
import { TransformElementsDto } from './dto/transform-elements.dto';
import { ChatAssistantDto } from './dto/chat-assistant.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generate(dto: GenerateDiagramDto): Promise<{
        elements: import("./ai.service").DiagramElement[];
    }>;
    beautify(dto: BeautifyDiagramDto): Promise<{
        elements: import("./ai.service").DiagramElement[];
    }>;
    transform(dto: TransformElementsDto): Promise<{
        elements: import("./ai.service").DiagramElement[];
    }>;
    chat(dto: ChatAssistantDto): Promise<{
        text: string;
        newElements?: import("./ai.service").DiagramElement[];
    }>;
}
