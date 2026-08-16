export declare class ChatAssistantDto {
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    canvasElements?: any[];
}
