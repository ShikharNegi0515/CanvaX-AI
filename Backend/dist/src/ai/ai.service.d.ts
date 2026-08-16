export interface DiagramElement {
    id: string;
    type: 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'arrow' | 'line' | 'frame' | 'sticky';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    strokeColor?: string;
    backgroundColor?: string;
    fillStyle?: string;
    strokeWidth?: number;
    roughness?: number;
    fontSize?: number;
    fontFamily?: string;
    startArrowhead?: string;
    endArrowhead?: string;
    points?: number[];
    seed?: number;
}
export declare class AiService {
    private readonly logger;
    private _model;
    constructor();
    private getModel;
    private cleanJsonResponse;
    generateDiagram(prompt: string): Promise<DiagramElement[]>;
    beautifyDiagram(elements: DiagramElement[]): Promise<DiagramElement[]>;
    transformElements(elements: DiagramElement[], instruction: string): Promise<DiagramElement[]>;
    chatWithAi(messages: {
        role: 'user' | 'assistant';
        content: string;
    }[], canvasElements?: DiagramElement[]): Promise<{
        text: string;
        newElements?: DiagramElement[];
    }>;
}
