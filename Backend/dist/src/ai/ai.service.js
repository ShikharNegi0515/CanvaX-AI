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
  "type": "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line",
  "x": number,  // top-left x position in canvas coordinates
  "y": number,  // top-left y position in canvas coordinates
  "width": number,      // required for rectangle, ellipse, diamond, text
  "height": number,     // required for rectangle, ellipse, diamond, text
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
- For vertical arrows (going up/down from a diamond): place x,y at the top-center or bottom-center of the diamond, use points [0,0, 0, ±distance].
- Use colors: strokeColor "#1e1e2e", backgroundColor "transparent" or "#e7f5ff" for process boxes, "#fff9db" for decision diamonds, "transparent" for ellipses.
- For flowcharts: rectangles=process steps, diamonds=decisions (Yes/No), ellipses=start/end terminals.

CONDITION LABEL RULES (CRITICAL — follow exactly):
- When a diamond has two outgoing arrows (Yes and No), ALWAYS add a standalone text element for each label.
- For the YES arrow label: place the text element at the MIDPOINT of that arrow, offset 10px above it.
  - Midpoint x = arrow.x + points[2]/2, Midpoint y = arrow.y + points[3]/2 - 20
  - Set width=40, height=24, fontSize=14, text="Yes"
- For the NO arrow label: place the text element at the MIDPOINT of that arrow, offset 10px above it.
  - Midpoint x = arrow.x + points[2]/2, Midpoint y = arrow.y + points[3]/2 - 20
  - Set width=30, height=24, fontSize=14, text="No"
- If a NO arrow goes vertically (up or down), place the text 15px to the RIGHT of the arrow's midpoint.
- NEVER place Yes/No labels below their arrows. Always above or beside.
- Do NOT add a "text" field to the arrow element itself — use a separate text element.

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
            throw new common_1.InternalServerErrorException('GOOGLE_AI_API_KEY is not set. Please add it to your .env file and restart the backend.');
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
    async generateDiagram(prompt) {
        try {
            const response = await this.getModel().invoke([
                new messages_1.SystemMessage(SYSTEM_PROMPT),
                new messages_1.HumanMessage(`Generate a diagram for: ${prompt}`),
            ]);
            const raw = response.content;
            const cleaned = raw
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();
            let parsed;
            try {
                parsed = JSON.parse(cleaned);
            }
            catch {
                this.logger.error('Failed to parse AI JSON response', cleaned);
                throw new common_1.InternalServerErrorException('AI returned invalid JSON. Please try again with a clearer prompt.');
            }
            if (!Array.isArray(parsed)) {
                throw new common_1.InternalServerErrorException('AI response was not a JSON array.');
            }
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
            throw new common_1.InternalServerErrorException('Failed to generate diagram. Check API key and try again.');
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiService);
//# sourceMappingURL=ai.service.js.map