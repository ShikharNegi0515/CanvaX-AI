import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private _model: ChatGoogleGenerativeAI | null = null;

  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      this.logger.warn('GOOGLE_AI_API_KEY not set — AI features will be unavailable');
    }
  }

  private getModel(): ChatGoogleGenerativeAI {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_AI_API_KEY is not set. Please add it to your .env file and restart backend.',
      );
    }
    if (!this._model) {
      this._model = new ChatGoogleGenerativeAI({
        model: 'gemini-flash-latest',
        apiKey,
        temperature: 0.3,
      });
    }
    return this._model;
  }

  private cleanJsonResponse(raw: string): any {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    return JSON.parse(cleaned);
  }

  async generateDiagram(prompt: string): Promise<DiagramElement[]> {
    try {
      const response = await this.getModel().invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(`Generate a diagram for: ${prompt}`),
      ]);

      const parsed = this.cleanJsonResponse(response.content as string);
      if (!Array.isArray(parsed)) throw new InternalServerErrorException('AI response was not a JSON array.');

      return parsed.map((el, i) => ({
        ...el,
        id: el.id || crypto.randomUUID(),
        seed: el.seed ?? Math.floor(Math.random() * 100000) + i,
      }));
    } catch (err: any) {
      if (err instanceof InternalServerErrorException) throw err;
      this.logger.error('AI generation error', err?.message);
      throw new InternalServerErrorException('Failed to generate diagram.');
    }
  }

  async beautifyDiagram(elements: DiagramElement[]): Promise<DiagramElement[]> {
    try {
      const prompt = `Here is a list of canvas elements in JSON: ${JSON.stringify(elements)}.
Clean up their layout so they align nicely into neat horizontal flow lines and vertical columns with consistent spacing (e.g. 80px gaps).
Preserve all text, shape types, IDs, colors, and arrows, but fix their x, y, width, height, and arrow points to look like a clean professional diagram.
Return ONLY the updated valid JSON array of elements.`;

      const response = await this.getModel().invoke([
        new SystemMessage('You are an expert UI/UX layout engine that aligns diagram elements into clean grids.'),
        new HumanMessage(prompt),
      ]);

      const parsed = this.cleanJsonResponse(response.content as string);
      if (!Array.isArray(parsed)) return elements;
      return parsed;
    } catch (err: any) {
      this.logger.error('AI beautify error', err?.message);
      return elements; // fallback to original elements if AI fails
    }
  }

  async transformElements(elements: DiagramElement[], instruction: string): Promise<DiagramElement[]> {
    try {
      const prompt = `Given these selected canvas elements: ${JSON.stringify(elements)}.
User instruction: "${instruction}".
Transform or generate appropriate canvas elements (such as sticky notes, flowcharts, or expanded nodes) based on the instruction.
Return ONLY a valid JSON array of canvas elements following the CanvaX AI schema (x, y, width, height, text, strokeColor, backgroundColor, etc.).`;

      const response = await this.getModel().invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(prompt),
      ]);

      const parsed = this.cleanJsonResponse(response.content as string);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((el, i) => ({
        ...el,
        id: el.id || crypto.randomUUID(),
        seed: el.seed ?? Math.floor(Math.random() * 100000) + i,
      }));
    } catch (err: any) {
      this.logger.error('AI transform error', err?.message);
      throw new InternalServerErrorException('Failed to transform selected elements.');
    }
  }

  async chatWithAi(
    messages: { role: 'user' | 'assistant'; content: string }[],
    canvasElements: DiagramElement[] = [],
  ): Promise<{ text: string; newElements?: DiagramElement[] }> {
    try {
      const systemMsg = `You are CanvaX Copilot, an AI whiteboard assistant.
Current canvas elements context: ${JSON.stringify(canvasElements.slice(0, 15))}.
Answer user questions helpfully. If the user asks to add or modify elements, include a JSON block at the end of your response formatted like:
ACTION_JSON:[{"type":"sticky","text":"Note content","x":300,"y":300,"width":160,"height":160,"backgroundColor":"#fef08a"}]`;

      const langChainMsgs = [
        new SystemMessage(systemMsg),
        ...messages.map((m) =>
          m.role === 'user' ? new HumanMessage(m.content) : new SystemMessage(m.content),
        ),
      ];

      const response = await this.getModel().invoke(langChainMsgs);
      const rawText = response.content as string;

      let text = rawText;
      let newElements: DiagramElement[] | undefined;

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
        } catch {
          // ignore parse error
        }
      }

      return { text, newElements };
    } catch (err: any) {
      this.logger.error('AI chat error', err?.message);
      return { text: "I'm sorry, I ran into an issue connecting to AI services." };
    }
  }
}
