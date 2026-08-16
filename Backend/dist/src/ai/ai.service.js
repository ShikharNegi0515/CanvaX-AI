"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const google_genai_1 = require("@langchain/google-genai");
const messages_1 = require("@langchain/core/messages");
const SYSTEM_PROMPT = `You are a diagram generation assistant for a whiteboard application called CanvaX AI.

When given a user prompt, respond ONLY with a valid JSON array of canvas elements. Do NOT include any explanation or markdown, just raw JSON.

Each element must follow this schema:
{
  "id": "unique-string-id",
  "type": "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line" | "sticky",
  "x": number,  // top-left x position in canvas coordinates
  "y": number,  // top-left y position in canvas coordinates
  "width": number,      // required for rectangle, ellipse, diamond, text, sticky
  "height": number,     // required for rectangle, ellipse, diamond, text, sticky
  "text": string,       // label text rendered inside shapes; for text type, the standalone label
  "strokeColor": "#hex",
  "backgroundColor": "#hex" | "transparent",
  "fillStyle": "solid" | "hachure" | "none",
  "strokeWidth": 1 | 2 | 3,
  "roughness": 0 | 1 | 2,
  "fontSize": 14 | 16 | 18 | 20,
  "fontFamily": "normal",
  "points": [x1, y1, x2, y2],  // ONLY for arrow and line (relative to x,y)
  "startArrowhead": "none",
  "endArrowhead": "arrow" | "none",
  "seed": integer
}

LAYOUT RULES:
- Start elements at x=100, y=200 and spread rightward. Use y=200 as the main horizontal flow row.
- Use 160px width and 70px height for rectangles/diamonds by default.
- Use 130px width and 60px height for ellipses.
- Space shapes 80px apart horizontally (gap between right edge of one and left edge of next).
- For arrows: place x,y at right-center of source shape (x + width, y + height/2). Points [0,0, gap, 0] for horizontal arrows.
- For vertical arrows (going up/down from a diamond): place x,y at top-center or bottom-center of diamond, use points [0,0, 0, ±distance].
- Use colors: strokeColor "#1e1e2e", backgroundColor "transparent" or "#e7f5ff" for process boxes, "#fff9db" for decision diamonds, "transparent" for ellipses.
- For flowcharts: rectangles=process steps, diamonds=decisions (Yes/No), ellipses=start/end terminals.

Maximum ~18 elements for clarity. Output ONLY the JSON array. No prose. No code blocks. No triple backticks.`;
let AiService = AiService_1 = class AiService {
    logger = new common_1.Logger(AiService_1.name);
    _model = null;
    constructor() {
        if (!process.env.GOOGLE_AI_API_KEY) {
            this.logger.warn('GOOGLE_AI_API_KEY not set — AI features will be unavailable');
        }
    }
    getModel() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('GOOGLE_AI_API_KEY is not set. Please add it to your .env file and restart backend.');
        }
        if (!this._model) {
            this._model = new google_genai_1.ChatGoogleGenerativeAI({
                model: 'gemini-flash-latest',
                apiKey,
                temperature: 0.3,
            });
        }
        return this._model;
    }
    cleanJsonResponse(raw) {
        const cleaned = raw
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/```\s*$/, '')
            .trim();
        return JSON.parse(cleaned);
    }
    async generateDiagram(prompt) {
        try {
            const response = await this.getModel().invoke([
                new messages_1.SystemMessage(SYSTEM_PROMPT),
                new messages_1.HumanMessage(`Generate a diagram for: ${prompt}`),
            ]);
            const parsed = this.cleanJsonResponse(response.content);
            if (!Array.isArray(parsed))
                throw new common_1.InternalServerErrorException('AI response was not a JSON array.');
            return parsed.map((el, i) => ({
                ...el,
                id: el.id || crypto.randomUUID(),
                seed: el.seed ?? Math.floor(Math.random() * 100000) + i,
            }));
        }
        catch (err) {
            if (err instanceof common_1.InternalServerErrorException)
                throw err;
            this.logger.error('AI generation error', err?.message);
            throw new common_1.InternalServerErrorException('Failed to generate diagram.');
        }
    }
    async beautifyDiagram(elements) {
        try {
            const prompt = `Here is a list of canvas elements in JSON: ${JSON.stringify(elements)}.
Clean up their layout so they align nicely into neat horizontal flow lines and vertical columns with consistent spacing (e.g. 80px gaps).
Preserve all text, shape types, IDs, colors, and arrows, but fix their x, y, width, height, and arrow points to look like a clean professional diagram.
Return ONLY the updated valid JSON array of elements.`;
            const response = await this.getModel().invoke([
                new messages_1.SystemMessage('You are an expert UI/UX layout engine that aligns diagram elements into clean grids.'),
                new messages_1.HumanMessage(prompt),
            ]);
            const parsed = this.cleanJsonResponse(response.content);
            if (!Array.isArray(parsed))
                return elements;
            return parsed;
        }
        catch (err) {
            this.logger.error('AI beautify error', err?.message);
            return elements;
        }
    }
    async transformElements(elements, instruction) {
        try {
            const prompt = `Given these selected canvas elements: ${JSON.stringify(elements)}.
User instruction: "${instruction}".
Transform or generate appropriate canvas elements (such as sticky notes, flowcharts, or expanded nodes) based on the instruction.
Return ONLY a valid JSON array of canvas elements following the CanvaX AI schema (x, y, width, height, text, strokeColor, backgroundColor, etc.).`;
            const response = await this.getModel().invoke([
                new messages_1.SystemMessage(SYSTEM_PROMPT),
                new messages_1.HumanMessage(prompt),
            ]);
            const parsed = this.cleanJsonResponse(response.content);
            if (!Array.isArray(parsed))
                return [];
            return parsed.map((el, i) => ({
                ...el,
                id: el.id || crypto.randomUUID(),
                seed: el.seed ?? Math.floor(Math.random() * 100000) + i,
            }));
        }
        catch (err) {
            this.logger.error('AI transform error', err?.message);
            throw new common_1.InternalServerErrorException('Failed to transform selected elements.');
        }
    }
    async chatWithAi(messages, canvasElements = []) {
        try {
            const systemMsg = `You are CanvaX Copilot, an AI whiteboard assistant.
Current canvas elements context: ${JSON.stringify(canvasElements.slice(0, 15))}.
Answer user questions helpfully. If the user asks to add or modify elements, include a JSON block at the end of your response formatted like:
ACTION_JSON:[{"type":"sticky","text":"Note content","x":300,"y":300,"width":160,"height":160,"backgroundColor":"#fef08a"}]`;
            const langChainMsgs = [
                new messages_1.SystemMessage(systemMsg),
                ...messages.map((m) => m.role === 'user' ? new messages_1.HumanMessage(m.content) : new messages_1.SystemMessage(m.content)),
            ];
            const response = await this.getModel().invoke(langChainMsgs);
            const rawText = response.content;
            let text = rawText;
            let newElements;
            const actionMatch = rawText.match(/ACTION_JSON:(\[.*\])/s);
            if (actionMatch) {
                text = rawText.replace(/ACTION_JSON:\[.*\]/s, '').trim();
                try {
                    const parsed = JSON.parse(actionMatch[1]);
                    if (Array.isArray(parsed)) {
                        newElements = parsed.map((el, i) => ({
                            ...el,
                            id: el.id || crypto.randomUUID(),
                            seed: el.seed ?? Math.floor(Math.random() * 100000) + i,
                        }));
                    }
                }
                catch {
                }
            }
            return { text, newElements };
        }
        catch (err) {
            this.logger.error('AI chat error', err?.message);
            return { text: "I'm sorry, I ran into an issue connecting to AI services." };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiService);
//# sourceMappingURL=ai.service.js.map