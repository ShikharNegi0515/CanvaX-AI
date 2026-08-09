import { create } from 'zustand';

export type Tool =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'draw'
  | 'text'
  | 'image'
  | 'eraser'
  | 'frame'
  | 'laser';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'dots' | 'none';
export type RoughnessLevel = 0 | 1 | 2; // architect, artist, cartoonist
export type EdgeStyle = 'sharp' | 'round';
export type FontFamily = 'hand' | 'normal' | 'code' | 'serif' | 'comic' | 'impact';
export type TextAlign = 'left' | 'center' | 'right';
export type ArrowheadStyle = 'none' | 'arrow' | 'dot' | 'bar';
export type ElementType = 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'draw' | 'text' | 'image' | 'frame';

export interface CanvasElement {
  id: string;
  type: ElementType;

  // Position & Size
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number; // rotation in radians

  // For ellipse
  radiusX?: number;
  radiusY?: number;

  // For draw/line/arrow (array of [x,y,...])
  points?: number[];

  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  textAlign?: TextAlign;
  label?: string; // for frames

  // Appearance
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: FillStyle;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  roughness?: RoughnessLevel;
  opacity?: number; // 0-100
  edges?: EdgeStyle; // sharp or round corners

  // Arrow specific
  startArrowhead?: ArrowheadStyle;
  endArrowhead?: ArrowheadStyle;

  // Image
  imageUrl?: string;

  // Grouping
  groupId?: string;
  frameId?: string;

  // Locked
  locked?: boolean;

  // Link
  link?: string;

  // Seed for roughjs (for reproducible sketchy rendering)
  seed?: number;
}

export interface AppState {
  theme: 'light' | 'dark';
  gridMode: 'none' | 'line' | 'dot';
  snapToGrid: boolean;
  zenMode: boolean;
  viewBackgroundColor: string;
}

export interface CanvasState {
  // Tool
  tool: Tool;
  setTool: (tool: Tool) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  // Elements
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, attrs: Partial<CanvasElement>) => void;
  updateElements: (updates: { id: string; attrs: Partial<CanvasElement> }[]) => void;
  deleteElements: (ids: string[]) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;

  // History
  past: CanvasElement[][];
  future: CanvasElement[][];
  commit: () => void;
  undo: () => void;
  redo: () => void;

  // App state
  appState: AppState;
  setAppState: (patch: Partial<AppState>) => void;

  // Default style (applied to new elements)
  defaultStyle: {
    strokeColor: string;
    backgroundColor: string;
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roughness: RoughnessLevel;
    opacity: number;
    edges: EdgeStyle;
    fontSize: number;
    fontFamily: FontFamily;
    textAlign: TextAlign;
    startArrowhead: ArrowheadStyle;
    endArrowhead: ArrowheadStyle;
  };
  setDefaultStyle: (patch: Partial<CanvasState['defaultStyle']>) => void;
}

const DEFAULT_STYLE: CanvasState['defaultStyle'] = {
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  edges: 'sharp',
  fontSize: 20,
  fontFamily: 'normal',
  textAlign: 'left',
  startArrowhead: 'none',
  endArrowhead: 'arrow',
};

const DEFAULT_APP_STATE: AppState = {
  theme: 'light',
  gridMode: 'none',
  snapToGrid: false,
  zenMode: false,
  viewBackgroundColor: '#ffffff',
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  elements: [],
  past: [],
  future: [],

  setElements: (elements) => {
    const { elements: cur, past } = get();
    set({ elements, past: [...past, cur], future: [] });
  },

  addElement: (element) => {
    const { elements: cur, past } = get();
    set({ elements: [...cur, element], past: [...past, cur], future: [] });
  },

  updateElement: (id, attrs) =>
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...attrs } : el)),
    })),

  updateElements: (updates) =>
    set((state) => {
      const map = new Map(updates.map((u) => [u.id, u.attrs]));
      return { elements: state.elements.map((el) => (map.has(el.id) ? { ...el, ...map.get(el.id) } : el)) };
    }),

  deleteElements: (ids) => {
    const { elements: cur, past } = get();
    const next = cur.filter((el) => !ids.includes(el.id));
    set({ elements: next, past: [...past, cur], future: [], selectedIds: [] });
  },

  reorderElement: (id, direction) =>
    set((state) => {
      const idx = state.elements.findIndex((el) => el.id === id);
      if (idx === -1) return state;
      const arr = [...state.elements];
      const [el] = arr.splice(idx, 1);
      if (direction === 'up') arr.splice(Math.min(idx + 1, arr.length), 0, el);
      else if (direction === 'down') arr.splice(Math.max(idx - 1, 0), 0, el);
      else if (direction === 'front') arr.push(el);
      else arr.unshift(el);
      return { elements: arr };
    }),

  commit: () => {
    const { elements: cur, past } = get();
    if (past.length > 0 && JSON.stringify(past[past.length - 1]) === JSON.stringify(cur)) return;
    set({ past: [...past, cur], future: [] });
  },

  undo: () => {
    const { past, future, elements } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [elements, ...future], elements: prev, selectedIds: [] });
  },

  redo: () => {
    const { past, future, elements } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ past: [...past, elements], future: future.slice(1), elements: next, selectedIds: [] });
  },

  appState: DEFAULT_APP_STATE,
  setAppState: (patch) => set((state) => ({ appState: { ...state.appState, ...patch } })),

  defaultStyle: DEFAULT_STYLE,
  setDefaultStyle: (patch) => set((state) => ({ defaultStyle: { ...state.defaultStyle, ...patch } })),
}));
