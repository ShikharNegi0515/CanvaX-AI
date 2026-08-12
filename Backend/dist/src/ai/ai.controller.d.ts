import { AiService } from './ai.service';
import { GenerateDiagramDto } from './dto/generate-diagram.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generate(dto: GenerateDiagramDto): Promise<{
        elements: import("./ai.service").DiagramElement[];
    }>;
}
