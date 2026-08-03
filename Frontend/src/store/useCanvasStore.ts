import { create } from 'zustand';

export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'text';

export type CanvasElement = {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  groupId?: string;
};

interface CanvasState {
  tool: Tool;
  setTool: (tool: Tool) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  elements: CanvasElement[];
  past: CanvasElement[][];
  future: CanvasElement[][];
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, element: Partial<CanvasElement>) => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  elements: [],
  past: [],
  future: [],
  setElements: (elements) => {
    const { elements: currentElements, past } = get();
    set({ elements, past: [...past, currentElements], future: [] });
  },
  addElement: (element) => {
    const { elements: currentElements, past } = get();
    set({ elements: [...currentElements, element], past: [...past, currentElements], future: [] });
  },
  updateElement: (id, newAttrs) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...newAttrs } : el
      ),
    })),
  commit: () => {
    // Explicitly commit current state to history (used after dragging/transforming/drawing ends)
    const { elements: currentElements, past } = get();
    // Don't commit if nothing changed
    if (past.length > 0 && JSON.stringify(past[past.length - 1]) === JSON.stringify(currentElements)) return;
    set({ past: [...past, currentElements], future: [] });
  },
  undo: () => {
    const { past, future, elements } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({ past: newPast, future: [elements, ...future], elements: previous });
  },
  redo: () => {
    const { past, future, elements } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({ past: [...past, elements], future: newFuture, elements: next });
  }
}));
