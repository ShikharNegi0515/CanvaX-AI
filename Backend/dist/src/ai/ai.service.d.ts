export interface DiagramElement {
    id: string;
    type: 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'arrow' | 'line';
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
    generateDiagram(prompt: string): Promise<DiagramElement[]>;
}
