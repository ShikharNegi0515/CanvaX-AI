import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';
import { getFloodFillPath } from './floodFill';
import { useCanvasStore, type CanvasElement, type Tool } from '../../store/useCanvasStore';
import { drawElement, measureTextDimensions } from './rough-utils';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { HamburgerMenu } from './HamburgerMenu';
import { canvasApi } from '../../lib/api';
import { exportCanvasToPNG, exportCanvasToSVG } from '../../lib/export-utils';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { AIPanel } from './AIPanel';
import { MermaidPanel } from './MermaidPanel';
import { PresentationMode } from './PresentationMode';
import { findSnapTarget, getUpdatedBoundArrows } from '../../lib/connection-utils';
import { useCollaboration, type RemoteCursor, type Collaborator } from '../../hooks/useCollaboration';
import { MultiplayerCursors } from './MultiplayerCursors';
import { PresenceBar } from './PresenceBar';
import { AIChatDrawer } from './AIChatDrawer';
import { AISelectionToolbar } from './AISelectionToolbar';
import { TemplateModal } from './TemplateModal';
import { Minimap } from './Minimap';

import { CommentsLayer } from './CommentsLayer';

export function InfiniteCanvas() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const laserPoints = useRef<{ x: number, y: number, time: number }[]>([]);
  const isLasering = useRef(false);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  const [snapTarget, setSnapTarget] = useState<{ x: number; y: number } | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const {
    tool, setTool, elements, setElements, addElement, updateElement, updateElements,
    deleteElements, reorderElements,
    selectedIds, setSelectedIds, past, future, undo, redo, commit,
    appState, setAppState, defaultStyle, setDefaultStyle
  } = useCanvasStore();

  const { user } = useAuthStore();

  // Viewport state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }[]>([]);

  // Auto-focus AND auto-size textarea when text editing starts
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      setTimeout(() => {
        const ta = textInputRef.current;
        if (!ta) return;
        ta.focus();
        // Expand to show all existing text
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        // Move cursor to end
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
      }, 10);
    }
  }, [editingTextId]);

  // Resize handle state for selected elements
  const [resizing, setResizing] = useState<{ handle: string; startX: number; startY: number; startEl: CanvasElement } | null>(null);

  // Eraser drag state — ids of elements hovered during erase drag
  const [erasingIds, setErasingIds] = useState<Set<string>>(new Set());
  const [hoveredEraserId, setHoveredEraserId] = useState<string | null>(null);
  const isEraserDragging = useRef(false);

  // Text box draft while dragging to create text area
  const [textBoxDraft, setTextBoxDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const textBoxStart = useRef<{ x: number; y: number } | null>(null);

  // Marquee selection
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const selectionBoxStart = useRef<{ x: number, y: number } | null>(null);

  // Lasso selection
  const [lassoPoints, setLassoPoints] = useState<{ x: number, y: number }[]>([]);
  const isLassoing = useRef(false);

  // Eraser cursor position (screen coords)
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const ERASER_RADIUS = 7; // px on screen

  // Persistence
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [userRole, setUserRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER' | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shareError, setShareError] = useState('');

  // Collaboration & Feature Modal State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const isRemotePatch = useRef(false);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);


  const { broadcastPatch, broadcastCursor } = useCollaboration({
    canvasId,
    token: localStorage.getItem('canvax_token'),
    onRemotePatch: (remoteElements) => {
      isRemotePatch.current = true;
      setElements(remoteElements as CanvasElement[]);
    },
    onCursorMove: (cursor) => {
      setRemoteCursors((prev) => ({ ...prev, [cursor.userId]: cursor }));
    },
    onUserJoined: (u) => {
      setCollaborators((prev) => [...prev.filter((c) => c.userId !== u.userId), u]);
    },
    onUserLeft: (uid) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== uid));
      setRemoteCursors((prev) => {
        const copy = { ...prev };
        delete copy[uid];
        return copy;
      });
    },
    onCollaboratorsUpdate: (collabs) => {
      setCollaborators(collabs);
    },
  });

  useEffect(() => {
    if (isRemotePatch.current) {
      isRemotePatch.current = false;
      return;
    }
    if (canvasId) {
      broadcastPatch(elements);
    }
  }, [elements, canvasId, broadcastPatch]);

  const getPointer = (e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - camera.x) / camera.zoom,
      y: (e.clientY - rect.top - camera.y) / camera.zoom,
    };
  };

  // Trigger re-render when web fonts finish loading (fixes Caveat wrap bug)
  useEffect(() => {
    document.fonts.ready.then(() => setRenderTrigger(t => t + 1));
  }, []);


  useEffect(() => {
    const handler = () => setRenderTrigger(t => t + 1);
    const handleImageInsert = (e: Event) => {
      const file = (e as CustomEvent).detail;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = crypto.randomUUID();
        // Drop image in center of screen
        const rect = canvasRef.current?.getBoundingClientRect();
        const cx = rect ? rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.height / 2 : window.innerHeight / 2;

        // Correctly unproject screen center to canvas coordinates
        const cam = cameraRef.current;
        const canvasX = (cx - cam.x) / cam.zoom;
        const canvasY = (cy - cam.y) / cam.zoom;
        addElement({
          id, type: 'image', width: 300, height: 300,
          x: canvasX - 150,
          y: canvasY - 150,
          imageUrl: ev.target?.result as string, ...defaultStyle
        });
        setTool('select');
        setSelectedIds([id]);
        commit();
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener('canvas-image-loaded', handler);
    window.addEventListener('insert-image-file', handleImageInsert);
    return () => {
      window.removeEventListener('canvas-image-loaded', handler);
      window.removeEventListener('insert-image-file', handleImageInsert);
    };
  }, [camera, addElement, setTool, setSelectedIds, commit, defaultStyle]);

  const openImagePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (ev: any) => {
      const file = ev.target.files?.[0];
      if (file) window.dispatchEvent(new CustomEvent('insert-image-file', { detail: file }));
    };
    input.click();
  }, []);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never fire shortcuts when editing text or typing in any input
      if (editingTextId) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); return; }
        if (e.key === 'y') { e.preventDefault(); redo(); return; }
        if (e.key === 'a') { e.preventDefault(); setSelectedIds(elements.map(el => el.id)); return; }
        if (e.key === 'c') {
          e.preventDefault();
          const selected = elements.filter(el => selectedIds.includes(el.id));
          if (selected.length > 0) setClipboard(selected);
          return;
        }
        if (e.key === 'v') {
          e.preventDefault();
          if (clipboard.length > 0) {
            const newElements = clipboard.map(el => ({
              ...el,
              id: crypto.randomUUID(),
              x: (el.x ?? 0) + 20,
              y: (el.y ?? 0) + 20,
            }));
            setElements([...elements, ...newElements]);
            setSelectedIds(newElements.map(el => el.id));
          }
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          const selected = elements.filter(el => selectedIds.includes(el.id));
          if (selected.length > 0) {
            const newElements = selected.map(el => ({
              ...el,
              id: crypto.randomUUID(),
              x: (el.x ?? 0) + 20,
              y: (el.y ?? 0) + 20,
            }));
            setElements([...elements, ...newElements]);
            setSelectedIds(newElements.map(el => el.id));
          }
          return;
        }
      }
      // Mindmap Tab (sub-node) and Enter (sibling node) auto-branching
      if (selectedIds.length === 1 && !e.ctrlKey && !e.metaKey) {
        const selected = elements.find(el => el.id === selectedIds[0]);
        if (selected && selected.type === 'mindmap') {
          if (e.key === 'Tab') {
            e.preventDefault();
            const childrenCount = elements.filter(el => el.parentId === selected.id).length;
            const childId = crypto.randomUUID();
            const newNode: CanvasElement = {
              id: childId,
              type: 'mindmap',
              parentId: selected.id,
              x: (selected.x ?? 0) + (selected.width ?? 160) + 60,
              y: (selected.y ?? 0) + (childrenCount * 65),
              width: 140,
              height: 50,
              text: 'Sub-node',
              backgroundColor: '#e0f2fe',
              strokeColor: '#0284c7',
              fillStyle: 'solid',
              roughness: 0,
            };
            const arrowNode: CanvasElement = {
              id: crypto.randomUUID(),
              type: 'arrow',
              x: (selected.x ?? 0) + (selected.width ?? 160),
              y: (selected.y ?? 0) + (selected.height ?? 50) / 2,
              points: [0, 0, 60, childrenCount * 65],
              endArrowhead: 'arrow',
              strokeColor: '#0284c7',
            };
            setElements([...elements, newNode, arrowNode]);
            setSelectedIds([childId]);
            commit();
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            const parentId = selected.parentId;
            const siblingsCount = elements.filter(el => el.parentId === parentId).length;
            const siblingId = crypto.randomUUID();
            const newNode: CanvasElement = {
              id: siblingId,
              type: 'mindmap',
              parentId,
              x: selected.x ?? 0,
              y: (selected.y ?? 0) + (siblingsCount * 65) + 65,
              width: 140,
              height: 50,
              text: 'Sibling node',
              backgroundColor: '#dcfce7',
              strokeColor: '#16a34a',
              fillStyle: 'solid',
              roughness: 0,
            };
            setElements([...elements, newNode]);
            setSelectedIds([siblingId]);
            commit();
            return;
          }
        }
      }

      const map: Record<string, Tool> = {
        v: 'select', h: 'hand', r: 'rectangle', d: 'diamond',
        e: 'ellipse', a: 'arrow', l: 'line', p: 'draw',
        t: 'text', f: 'frame', x: 'eraser', k: 'laser',
        b: 'bucket', o: 'lasso', n: 'sticky', c: 'comment', m: 'mindmap',
      };
      if (e.key === 'i' || e.key === 'I') { openImagePicker(); return; }
      if (e.key === 'Escape') { setTool('select'); setSelectedIds([]); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          setElements(elements.filter(el => !selectedIds.includes(el.id)));
          setSelectedIds([]);
          commit();
        }
        return;
      }
      const mapped = map[e.key.toLowerCase()];
      if (mapped) { e.preventDefault(); setTool(mapped); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [elements, selectedIds, editingTextId, undo, redo, setTool, setSelectedIds, setElements, commit, openImagePicker, clipboard]);

  // Laser Pointer Loop
  useEffect(() => {
    let animationFrameId: number;
    const renderLaser = () => {
      animationFrameId = requestAnimationFrame(renderLaser);
      const canvas = laserCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const now = performance.now();
      laserPoints.current = laserPoints.current.filter(p => now - p.time < 1000);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (laserPoints.current.length < 2) return;

      const dpr = window.devicePixelRatio || 1;
      const cam = cameraRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      const points = laserPoints.current.map(p => {
        const age = now - p.time;
        const factor = Math.max(0, 1 - (age / 1000));
        return [p.x, p.y, factor];
      });

      const stroke = getStroke(points as number[][], {
        size: 4 / cam.zoom,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: false,
      });

      if (stroke.length > 0) {
        ctx.beginPath();
        ctx.moveTo(stroke[0][0], stroke[0][1]);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i][0], stroke[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = '#ff0000';
        ctx.fill();
      }

      ctx.restore();
    };
    renderLaser();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const lCanvas = laserCanvasRef.current;
    if (lCanvas) {
      lCanvas.width = rect.width * dpr;
      lCanvas.height = rect.height * dpr;
      lCanvas.style.width = `${rect.width}px`;
      lCanvas.style.height = `${rect.height}px`;
    }

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = appState.viewBackgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Handle CJS interop for roughjs if necessary
    const roughInstance = typeof (rough as any).canvas === 'function' ? rough : (rough as any).default;
    const rc = roughInstance.canvas(canvas);

    // Draw elements
    elements.forEach(el => {
      // For pure text elements, skip canvas rendering while editing (textarea overlay handles it).
      // For shapes (rect/ellipse/diamond), keep drawing the shape background so the border stays visible.
      const isEditingThisEl = el.id === editingTextId;
      if (isEditingThisEl && el.type === 'text') return;

      const isSelected = (tool === 'select' && selectedIds.includes(el.id)) || isEditingThisEl;
      const isErasing = erasingIds.has(el.id) || (tool === 'eraser' && el.id === hoveredEraserId);

      if (isErasing) {
        // Elements being erased: show with lower opacity
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawElement(rc, ctx, el);
        ctx.restore();
      } else if (isSelected) {
        // Selected elements are slightly dimmed
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawElement(rc, ctx, el);
        ctx.restore();
      } else {
        drawElement(rc, ctx, el);
      }

      // Draw selection box if selected and using select tool
      if (isSelected) {
        const pad = 6;
        let ex = el.x ?? 0;
        let ey = el.y ?? 0;
        let ew = el.width ?? 0;
        let eh = el.height ?? 0;

        if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
          const xs = (el.points ?? []).filter((_, i) => i % 2 === 0).map(x => x + (el.x ?? 0));
          const ys = (el.points ?? []).filter((_, i) => i % 2 !== 0).map(y => y + (el.y ?? 0));
          if (xs.length > 0) {
            ex = Math.min(...xs);
            ey = Math.min(...ys);
            ew = Math.max(...xs) - ex;
            eh = Math.max(...ys) - ey;
          }
        } else {
          // For shapes drawn with negative w/h (dragged up-left), normalize
          if (ew < 0) { ex += ew; ew = -ew; }
          if (eh < 0) { ey += eh; eh = -eh; }
        }

        ctx.strokeStyle = '#6965db';
        ctx.lineWidth = 1 / camera.zoom;
        ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
        ctx.strokeRect(ex - pad, ey - pad, ew + pad * 2, eh + pad * 2);
        ctx.setLineDash([]);

        // Draw resize handles for non-line elements
        if (el.type !== 'line' && el.type !== 'arrow' && el.type !== 'draw') {
          const handles = [
            { x: ex - pad, y: ey - pad },
            { x: ex + ew / 2, y: ey - pad },
            { x: ex + ew + pad, y: ey - pad },
            { x: ex + ew + pad, y: ey + eh / 2 },
            { x: ex + ew + pad, y: ey + eh + pad },
            { x: ex + ew / 2, y: ey + eh + pad },
            { x: ex - pad, y: ey + eh + pad },
            { x: ex - pad, y: ey + eh / 2 },
          ];
          handles.forEach(h => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#6965db';
            ctx.lineWidth = 1.5 / camera.zoom;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(h.x, h.y, 5 / camera.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        }
      }
    });

    // Draw marquee selection
    if (selectionBox) {
      ctx.save();
      ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 1 / camera.zoom;
      ctx.fillRect(
        Math.min(selectionBox.x, selectionBox.x + selectionBox.w),
        Math.min(selectionBox.y, selectionBox.y + selectionBox.h),
        Math.abs(selectionBox.w),
        Math.abs(selectionBox.h)
      );
      ctx.strokeRect(
        Math.min(selectionBox.x, selectionBox.x + selectionBox.w),
        Math.min(selectionBox.y, selectionBox.y + selectionBox.h),
        Math.abs(selectionBox.w),
        Math.abs(selectionBox.h)
      );
      ctx.restore();
    }

    // Draw lasso selection
    if (lassoPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 1 / camera.zoom;
      ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
      ctx.fill();
      ctx.restore();
    }

    // Draw text box draft (while dragging with text tool)
    if (textBoxDraft) {
      const { x, y, w, h } = textBoxDraft;
      ctx.save();
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 1.5 / camera.zoom;
      ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom]);
      ctx.strokeRect(
        Math.min(x, x + w),
        Math.min(y, y + h),
        Math.abs(w),
        Math.abs(h)
      );
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw snap lines
    snapLines.forEach(line => {
      ctx.save();
      ctx.strokeStyle = '#fa5252';
      ctx.lineWidth = 1 / camera.zoom;
      ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
      ctx.beginPath();
      if (line.x !== undefined) {
        ctx.moveTo(line.x, -10000);
        ctx.lineTo(line.x, 10000);
      }
      if (line.y !== undefined) {
        ctx.moveTo(-10000, line.y);
        ctx.lineTo(10000, line.y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Draw snap target indicator (blue dot when arrow hovers a connection point)
    if (snapTarget && (tool === 'arrow' || tool === 'line')) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(snapTarget.x, snapTarget.y, 7 / camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99,148,255,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#6394ff';
      ctx.lineWidth = 2 / camera.zoom;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [elements, camera, selectedIds, erasingIds, hoveredEraserId, editingTextId, textBoxDraft, selectionBox, lassoPoints, appState.viewBackgroundColor, renderTrigger, tool, snapLines, snapTarget]);

  const getHitElement = useCallback((ptr: { x: number, y: number }) => {
    return [...elements].reverse().find(el => {
      let ex = el.x ?? 0;
      let ey = el.y ?? 0;
      let ew = el.width ?? 0;
      let eh = el.height ?? 0;

      if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
        const pts = el.points ?? [];
        if (pts.length < 4) return false;
        const ox = el.x ?? 0;
        const oy = el.y ?? 0;

        // Check distance to each segment
        let minDistance = Infinity;
        for (let i = 0; i < pts.length - 2; i += 2) {
          const x1 = ox + pts[i];
          const y1 = oy + pts[i + 1];
          const x2 = ox + pts[i + 2];
          const y2 = oy + pts[i + 3];

          // Distance from point ptr to segment (x1, y1) - (x2, y2)
          const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
          let dist;
          if (l2 === 0) {
            dist = Math.hypot(ptr.x - x1, ptr.y - y1);
          } else {
            let t = ((ptr.x - x1) * (x2 - x1) + (ptr.y - y1) * (y2 - y1)) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = x1 + t * (x2 - x1);
            const projY = y1 + t * (y2 - y1);
            dist = Math.hypot(ptr.x - projX, ptr.y - projY);
          }
          minDistance = Math.min(minDistance, dist);
        }

        // If we are within 15px of the stroke, count it as a hit
        return minDistance < 15 / camera.zoom;
      } else {
        if (ew < 0) { ex += ew; ew = -ew; }
        if (eh < 0) { ey += eh; eh = -eh; }
      }

      const pad = 12; // generous padding for easy clicking

      if (el.type === 'ellipse') {
        const cx = ex + ew / 2;
        const cy = ey + eh / 2;
        const rx = ew / 2 + pad;
        const ry = eh / 2 + pad;
        if (rx <= 0 || ry <= 0) return false;
        return Math.pow(ptr.x - cx, 2) / Math.pow(rx, 2) + Math.pow(ptr.y - cy, 2) / Math.pow(ry, 2) <= 1;
      } else if (el.type === 'diamond') {
        const cx = ex + ew / 2;
        const cy = ey + eh / 2;
        const dx = Math.abs(ptr.x - cx);
        const dy = Math.abs(ptr.y - cy);
        const rx = ew / 2 + pad;
        const ry = eh / 2 + pad;
        if (rx <= 0 || ry <= 0) return false;
        return (dx / rx) + (dy / ry) <= 1;
      }

      return ptr.x >= ex - pad && ptr.x <= ex + ew + pad && ptr.y >= ey - pad && ptr.y <= ey + eh + pad;
    });
  }, [elements, camera.zoom]);

  // Helper: distance from point to line segment
  const distToSeg = (p: {x:number,y:number}, a: {x:number,y:number}, b: {x:number,y:number}) => {
    const l2 = (a.x-b.x)**2 + (a.y-b.y)**2;
    if (l2 === 0) return Math.hypot(p.x-a.x, p.y-a.y);
    let t = ((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x-(a.x+t*(b.x-a.x)), p.y-(a.y+t*(b.y-a.y)));
  };

  // Eraser-specific hit: only the stroke/border of each shape, not interior fills
  const getEraserHitElement = useCallback((ptr: { x: number, y: number }) => {
    const r = (ERASER_RADIUS * 2.5) / camera.zoom; // eraser hit radius in canvas space

    return [...elements].reverse().find(el => {
      let ex = el.x ?? 0, ey = el.y ?? 0, ew = el.width ?? 0, eh = el.height ?? 0;

      // Bucket-fill polygons (roughness 0, solid fill) → erasable by clicking anywhere inside
      if (el.roughness === 0 && el.fillStyle === 'solid' && el.type === 'draw') {
        if (ew < 0) { ex += ew; ew = -ew; }
        if (eh < 0) { ey += eh; eh = -eh; }
        return ptr.x >= ex - r && ptr.x <= ex + ew + r && ptr.y >= ey - r && ptr.y <= ey + eh + r;
      }

      // Lines, arrows, freehand draw → proximity to path
      if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
        const pts = el.points ?? [];
        if (pts.length < 4) return false;
        const ox = el.x ?? 0, oy = el.y ?? 0;
        for (let i = 0; i < pts.length - 2; i += 2) {
          if (distToSeg(ptr,
            { x: ox + pts[i], y: oy + pts[i+1] },
            { x: ox + pts[i+2], y: oy + pts[i+3] }
          ) <= r) return true;
        }
        return false;
      }

      if (ew < 0) { ex += ew; ew = -ew; }
      if (eh < 0) { ey += eh; eh = -eh; }

      if (el.type === 'ellipse') {
        const cx = ex + ew / 2, cy = ey + eh / 2;
        const rx = ew / 2, ry = eh / 2;
        if (rx <= 0 || ry <= 0) return false;
        // Near the ellipse circumference: between inner and outer ellipse
        const rxO = rx + r, ryO = ry + r;
        const rxI = Math.max(1, rx - r), ryI = Math.max(1, ry - r);
        const normO = (ptr.x-cx)**2/rxO**2 + (ptr.y-cy)**2/ryO**2;
        const normI = (ptr.x-cx)**2/rxI**2 + (ptr.y-cy)**2/ryI**2;
        return normO <= 1 && normI >= 1;
      }

      if (el.type === 'diamond') {
        const top    = { x: ex + ew/2, y: ey };
        const right  = { x: ex + ew,   y: ey + eh/2 };
        const bottom = { x: ex + ew/2, y: ey + eh };
        const left   = { x: ex,        y: ey + eh/2 };
        return [[top,right],[right,bottom],[bottom,left],[left,top]].some(
          ([a, b]) => distToSeg(ptr, a, b) <= r
        );
      }

      // Rectangle, frame → near any of the 4 edges
      if (el.type === 'rectangle' || el.type === 'frame') {
        const tl = {x:ex,y:ey}, tr = {x:ex+ew,y:ey};
        const bl = {x:ex,y:ey+eh}, br = {x:ex+ew,y:ey+eh};
        return [[tl,tr],[tr,br],[br,bl],[bl,tl]].some(
          ([a, b]) => distToSeg(ptr, a, b) <= r
        );
      }

      // Text, image → bounding box (they don't have a stroke border to aim at)
      return ptr.x >= ex - r && ptr.x <= ex + ew + r && ptr.y >= ey - r && ptr.y <= ey + eh + r;
    });
  }, [elements, camera.zoom, ERASER_RADIUS]);

  // --- Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingTextId) {
      setEditingTextId(null);
      return;
    }

    const ptr = getPointer(e);

    if (e.button === 1 || tool === 'hand' || e.shiftKey && e.button === 0) {
      setIsPanning(true);
      return;
    }

    if (tool === 'laser') {
      isLasering.current = true;
      laserPoints.current = [{ x: ptr.x, y: ptr.y, time: performance.now() }];
      return;
    }

    if (tool === 'bucket') {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const sx = Math.floor((e.clientX - rect.left) * dpr);
        const sy = Math.floor((e.clientY - rect.top) * dpr);

        // We must use an offscreen context or standard context, but since this is 
        // already drawn, we can use it. But wait, reading canvas that is being rendered is OK.
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const path = getFloodFillPath(ctx, sx, sy, canvas.width, canvas.height);
          if (path) {
            const cam = camera;
            const convertedPath = path.map((val, i) => {
              if (i % 2 === 0) return (val / dpr - cam.x) / cam.zoom;
              return (val / dpr - cam.y) / cam.zoom;
            });

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < convertedPath.length; i += 2) {
              if (convertedPath[i] < minX) minX = convertedPath[i];
              if (convertedPath[i] > maxX) maxX = convertedPath[i];
              if (convertedPath[i + 1] < minY) minY = convertedPath[i + 1];
              if (convertedPath[i + 1] > maxY) maxY = convertedPath[i + 1];
            }

            for (let i = 0; i < convertedPath.length; i += 2) {
              convertedPath[i] -= minX;
              convertedPath[i + 1] -= minY;
            }

            const fillColor = defaultStyle.backgroundColor === 'transparent' ? defaultStyle.strokeColor : defaultStyle.backgroundColor;
            addElement({
              id: crypto.randomUUID(),
              type: 'draw',
              x: minX,
              y: minY,
              points: convertedPath,
              width: maxX - minX,
              height: maxY - minY,
              ...defaultStyle,
              strokeColor: fillColor,
              backgroundColor: fillColor,
              fillStyle: 'solid',
              roughness: 0,
            });
            commit();
            // Stay on bucket tool
            return;
          }
        }
      }

      // Fallback if floodfill failed: just click-fill the shape
      const hit = getHitElement(ptr);
      if (hit && ['rectangle', 'diamond', 'ellipse', 'draw', 'line', 'arrow'].includes(hit.type)) {
        updateElement(hit.id, {
          backgroundColor: defaultStyle.backgroundColor === 'transparent' ? defaultStyle.strokeColor : defaultStyle.backgroundColor,
          fillStyle: defaultStyle.fillStyle === 'none' ? 'solid' : defaultStyle.fillStyle,
        });
        commit();
        // Stay on bucket tool
      }
      return;
    }

    if (tool === 'lasso') {
      isLassoing.current = true;
      setLassoPoints([ptr]);
      return;
    }

    if (tool === 'sticky') {
      const id = crypto.randomUUID();
      addElement({
        id,
        type: 'sticky',
        x: ptr.x,
        y: ptr.y,
        width: 180,
        height: 140,
        text: 'New Sticky Note',
        backgroundColor: '#fef08a',
        strokeColor: '#ca8a04',
        fillStyle: 'solid',
        roughness: 0,
      });
      setTool('select');
      setSelectedIds([id]);
      commit();
      return;
    }

    if (tool === 'comment') {
      const id = crypto.randomUUID();
      addElement({
        id,
        type: 'comment',
        x: ptr.x,
        y: ptr.y,
        width: 32,
        height: 32,
        comment: {
          authorName: user?.name || user?.email?.split('@')[0] || 'User',
          authorAvatar: user?.avatarUrl,
          text: 'New comment thread',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
      setTool('select');
      setSelectedIds([id]);
      commit();
      return;
    }

    if (tool === 'mindmap') {
      const id = crypto.randomUUID();
      addElement({
        id,
        type: 'mindmap',
        isRootMindmap: true,
        x: ptr.x,
        y: ptr.y,
        width: 160,
        height: 60,
        text: 'Central Topic',
        backgroundColor: '#8b5cf6',
        strokeColor: '#7c3aed',
        fillStyle: 'solid',
        roughness: 0,
      });
      setTool('select');
      setSelectedIds([id]);
      commit();
      return;
    }

    if (tool === 'select' || tool === 'eraser') {
      if (tool === 'eraser') {
        // Start drag-eraser
        isEraserDragging.current = true;
        // Also immediately mark hovered element
        const hit = getEraserHitElement(ptr);
        if (hit) setErasingIds(prev => new Set([...prev, hit.id]));
        return;
      }

      // Check resize handles first (only in select mode)
      if (tool === 'select' && selectedIds.length === 1) {
        const el = elements.find(e => e.id === selectedIds[0]);
        if (el && el.type !== 'line' && el.type !== 'arrow' && el.type !== 'draw') {
          const pad = 6;
          let ex = el.x ?? 0, ey = el.y ?? 0;
          let ew = Math.abs(el.width ?? 0), eh = Math.abs(el.height ?? 0);
          if ((el.width ?? 0) < 0) ex += (el.width ?? 0);
          if ((el.height ?? 0) < 0) ey += (el.height ?? 0);
          const HANDLES: Record<string, { x: number; y: number }> = {
            'nw': { x: ex - pad, y: ey - pad }, 'n': { x: ex + ew / 2, y: ey - pad },
            'ne': { x: ex + ew + pad, y: ey - pad }, 'e': { x: ex + ew + pad, y: ey + eh / 2 },
            'se': { x: ex + ew + pad, y: ey + eh + pad }, 's': { x: ex + ew / 2, y: ey + eh + pad },
            'sw': { x: ex - pad, y: ey + eh + pad }, 'w': { x: ex - pad, y: ey + eh / 2 },
          };
          const hitHandle = Object.entries(HANDLES).find(([_, h]) =>
            Math.hypot(ptr.x - h.x, ptr.y - h.y) < 10 / camera.zoom
          );
          if (hitHandle) {
            setResizing({ handle: hitHandle[0], startX: ptr.x, startY: ptr.y, startEl: { ...el } });
            return;
          }
        }
      }

      // Very basic hit test: check bounding boxes
      const hit = getHitElement(ptr);

      if (hit) {

        if (!selectedIds.includes(hit.id)) {
          let newSelection = [hit.id];
          if (hit.type === 'frame') {
            const fx = hit.x ?? 0;
            const fy = hit.y ?? 0;
            const fw = hit.width ?? 0;
            const fh = hit.height ?? 0;
            const fLeft = Math.min(fx, fx + fw);
            const fRight = Math.max(fx, fx + fw);
            const fTop = Math.min(fy, fy + fh);
            const fBottom = Math.max(fy, fy + fh);

            elements.forEach(child => {
              if (child.id !== hit.id) {
                const cx = child.x ?? 0;
                const cy = child.y ?? 0;
                const cw = child.width ?? 0;
                const ch = child.height ?? 0;
                const cLeft = Math.min(cx, cx + cw);
                const cRight = Math.max(cx, cx + cw);
                const cTop = Math.min(cy, cy + ch);
                const cBottom = Math.max(cy, cy + ch);
                if (cLeft >= fLeft && cRight <= fRight && cTop >= fTop && cBottom <= fBottom) {
                  newSelection.push(child.id);
                }
              }
            });
          }
          setSelectedIds(newSelection);
        }
        setIsDragging(true);
        setDragStart(ptr);
      } else {
        setSelectedIds([]);
        selectionBoxStart.current = ptr;
        setSelectionBox({ x: ptr.x, y: ptr.y, w: 0, h: 0 });
        setIsDragging(true);
      }
      return;
    }



    if (tool === 'text') {
      // Start dragging to define the text box — don't create element yet
      textBoxStart.current = { x: ptr.x, y: ptr.y };
      setTextBoxDraft({ x: ptr.x, y: ptr.y, w: 0, h: 0 });
      return;
    }

    // Creating shapes
    const id = crypto.randomUUID();
    // For arrow/line: check if starting from a connection point
    let startBinding = undefined;
    if (tool === 'arrow' || tool === 'line') {
      const snap = findSnapTarget(ptr, elements);
      if (snap) {
        startBinding = { elementId: snap.element.id, point: snap.cp.point };
        // Start exactly at the connection point
        ptr.x = snap.cp.x;
        ptr.y = snap.cp.y;
      }
    }
    const newEl: CanvasElement = {
      id, type: tool as any, x: ptr.x, y: ptr.y,
      width: 0, height: 0,
      points: (tool === 'line' || tool === 'arrow' || tool === 'draw') ? [0, 0] : undefined,
      ...(startBinding ? { startBinding } : {}),
      ...defaultStyle
    };
    addElement(newEl);
    setSelectedIds([id]);
    setIsDragging(true);
    setDragStart(ptr);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Broadcast cursor position to collaborators
    const ptr = getPointer(e);
    broadcastCursor(ptr.x, ptr.y);

    // Track eraser cursor position always
    if (tool === 'eraser') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) setEraserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      if (!isEraserDragging.current) {
        const hit = getEraserHitElement(ptr);
        setHoveredEraserId(hit ? hit.id : null);
      } else {
        setHoveredEraserId(null);
      }
    } else {
      setEraserPos(null);
      setHoveredEraserId(null);
    }

    // Text box drag — update draft dimensions
    if (tool === 'text' && textBoxStart.current) {
      const sx = textBoxStart.current.x;
      const sy = textBoxStart.current.y;
      setTextBoxDraft({ x: sx, y: sy, w: ptr.x - sx, h: ptr.y - sy });
      return;
    }

    if (tool === 'lasso' && isLassoing.current) {
      setLassoPoints(prev => [...prev, ptr]);
      return;
    }

    // Marquee selection drag
    if (tool === 'select' && selectionBoxStart.current) {
      const sx = selectionBoxStart.current.x;
      const sy = selectionBoxStart.current.y;
      const w = ptr.x - sx;
      const h = ptr.y - sy;

      setSelectionBox({ x: sx, y: sy, w, h });

      const sLeft = Math.min(sx, sx + w);
      const sRight = Math.max(sx, sx + w);
      const sTop = Math.min(sy, sy + h);
      const sBottom = Math.max(sy, sy + h);

      const newSelectedIds = elements.filter(el => {
        let ex = el.x ?? 0, ey = el.y ?? 0, ew = el.width ?? 0, eh = el.height ?? 0;
        if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
          const xs = (el.points ?? []).filter((_, i) => i % 2 === 0).map(x => x + (el.x ?? 0));
          const ys = (el.points ?? []).filter((_, i) => i % 2 !== 0).map(y => y + (el.y ?? 0));
          if (xs.length === 0) return false;
          ex = Math.min(...xs); ey = Math.min(...ys);
          ew = Math.max(...xs) - ex; eh = Math.max(...ys) - ey;
        } else {
          if (ew < 0) { ex += ew; ew = -ew; }
          if (eh < 0) { ey += eh; eh = -eh; }
        }
        return (ex < sRight && ex + ew > sLeft && ey < sBottom && ey + eh > sTop);
      }).map(el => el.id);

      setSelectedIds(newSelectedIds);
      return;
    }

    if (tool === 'laser' && isLasering.current) {
      laserPoints.current.push({ x: ptr.x, y: ptr.y, time: performance.now() });
      return;
    }

    if (isPanning) {
      setCamera(c => ({
        ...c,
        x: c.x + e.movementX,
        y: c.y + e.movementY
      }));
      return;
    }

    // Drag eraser: accumulate elements under cursor
    if (tool === 'eraser' && isEraserDragging.current) {
      const hit = getEraserHitElement(ptr);
      if (hit) {
        setErasingIds(prev => {
          if (prev.has(hit.id)) return prev;
          const next = new Set(prev);
          next.add(hit.id);
          return next;
        });
      }
      return;
    }

    // Handle resizing
    if (resizing) {
      const { handle, startEl } = resizing;
      const dx = ptr.x - resizing.startX;
      const dy = ptr.y - resizing.startY;
      let nx = startEl.x ?? 0, ny = startEl.y ?? 0;
      let nw = Math.abs(startEl.width ?? 0), nh = Math.abs(startEl.height ?? 0);

      if (handle.includes('e')) nw = Math.max(10, nw + dx);
      if (handle.includes('s')) nh = Math.max(10, nh + dy);
      if (handle.includes('w')) { nx = nx + dx; nw = Math.max(10, nw - dx); }
      if (handle.includes('n')) { ny = ny + dy; nh = Math.max(10, nh - dy); }

      updateElement(selectedIds[0], { x: nx, y: ny, width: nw, height: nh });
      return;
    }

    if (!isDragging) return;

    if (tool === 'select') {
      let dx = ptr.x - dragStart.x;
      let dy = ptr.y - dragStart.y;

      const newSnapLines: { x?: number, y?: number }[] = [];
      if (selectedIds.length === 1 && !e.altKey) {
        const id = selectedIds[0];
        const el = elements.find(e => e.id === id);
        if (el) {
          const nx = (el.x ?? 0) + dx;
          const ny = (el.y ?? 0) + dy;
          const nw = el.width ?? 0;
          const nh = el.height ?? 0;
          const centerNx = nx + nw / 2;
          const centerNy = ny + nh / 2;

          let snappedX = false;
          let snappedY = false;

          elements.forEach(other => {
            if (other.id === id || selectedIds.includes(other.id)) return;
            const ox = other.x ?? 0;
            const oy = other.y ?? 0;
            const ow = other.width ?? 0;
            const oh = other.height ?? 0;
            const centerOx = ox + ow / 2;
            const centerOy = oy + oh / 2;

            const threshold = 5 / camera.zoom;

            if (!snappedX && Math.abs(centerNx - centerOx) < threshold) { dx = centerOx - nw / 2 - (el.x ?? 0); newSnapLines.push({ x: centerOx }); snappedX = true; }
            if (!snappedY && Math.abs(centerNy - centerOy) < threshold) { dy = centerOy - nh / 2 - (el.y ?? 0); newSnapLines.push({ y: centerOy }); snappedY = true; }

            if (!snappedX && Math.abs(nx - ox) < threshold) { dx = ox - (el.x ?? 0); newSnapLines.push({ x: ox }); snappedX = true; }
            if (!snappedY && Math.abs(ny - oy) < threshold) { dy = oy - (el.y ?? 0); newSnapLines.push({ y: oy }); snappedY = true; }

            const rightNx = nx + nw; const rightOx = ox + ow;
            const bottomNy = ny + nh; const bottomOy = oy + oh;
            if (!snappedX && Math.abs(rightNx - rightOx) < threshold) { dx = rightOx - nw - (el.x ?? 0); newSnapLines.push({ x: rightOx }); snappedX = true; }
            if (!snappedY && Math.abs(bottomNy - bottomOy) < threshold) { dy = bottomOy - nh - (el.y ?? 0); newSnapLines.push({ y: bottomOy }); snappedY = true; }
          });
        }
      }
      setSnapLines(newSnapLines);

      const updates = selectedIds.map(id => {
        const el = elements.find(e => e.id === id);
        if (!el) return null;
        return { id, attrs: { x: (el.x ?? 0) + dx, y: (el.y ?? 0) + dy } };
      }).filter(Boolean) as { id: string, attrs: Partial<CanvasElement> }[];

      updateElements(updates);

      // Update any arrows bound to moved shapes
      const movedIds = updates.map(u => u.id);
      const updatedEls = elements.map(e => {
        const u = updates.find(u => u.id === e.id);
        return u ? { ...e, ...u.attrs } : e;
      });
      const arrowUpdates = getUpdatedBoundArrows(movedIds, updatedEls);
      if (arrowUpdates.length > 0) updateElements(arrowUpdates);

      setDragStart(ptr);
      return;
    }

    // Updating drawing shape
    const id = selectedIds[0];
    if (!id) return;
    const el = elements.find(e => e.id === id);
    if (!el) return;

    if (tool === 'draw') {
      const newPoints = [...(el.points || []), ptr.x - (el.x ?? 0), ptr.y - (el.y ?? 0)];
      updateElement(id, { points: newPoints });
    } else if (tool === 'line' || tool === 'arrow') {
      // Snap-to-shape: check if cursor is near a connection point
      const snap = findSnapTarget(ptr, elements, id);
      if (snap) {
        setSnapTarget({ x: snap.cp.x, y: snap.cp.y });
        updateElement(id, { points: [0, 0, snap.cp.x - (el.x ?? 0), snap.cp.y - (el.y ?? 0)] });
      } else {
        setSnapTarget(null);
        updateElement(id, { points: [0, 0, ptr.x - (el.x ?? 0), ptr.y - (el.y ?? 0)] });
      }
    } else {
      updateElement(id, {
        width: ptr.x - (el.x ?? 0),
        height: ptr.y - (el.y ?? 0)
      });
    }
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    setIsPanning(false);
    setSnapLines([]);

    if (tool === 'laser' && isLasering.current) {
      isLasering.current = false;
      return;
    }

    if (tool === 'lasso' && isLassoing.current) {
      isLassoing.current = false;

      // Calculate bounding box of lasso to quickly filter
      if (lassoPoints.length > 2) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        lassoPoints.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });

        const newSelectedIds = elements.filter(el => {
          let ex = el.x ?? 0, ey = el.y ?? 0, ew = el.width ?? 0, eh = el.height ?? 0;
          if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
            const xs = (el.points ?? []).filter((_, i) => i % 2 === 0).map(x => x + (el.x ?? 0));
            const ys = (el.points ?? []).filter((_, i) => i % 2 !== 0).map(y => y + (el.y ?? 0));
            if (xs.length === 0) return false;
            ex = Math.min(...xs); ey = Math.min(...ys);
            ew = Math.max(...xs) - ex; eh = Math.max(...ys) - ey;
          } else {
            if (ew < 0) { ex += ew; ew = -ew; }
            if (eh < 0) { ey += eh; eh = -eh; }
          }

          // Simple bounding box intersection for lasso
          return (ex < maxX && ex + ew > minX && ey < maxY && ey + eh > minY);
        }).map(el => el.id);

        setSelectedIds(newSelectedIds);
      }
      setLassoPoints([]);
      setTool('select');
      return;
    }

    // Marquee selection end
    if (selectionBoxStart.current) {
      selectionBoxStart.current = null;
      setSelectionBox(null);
      setIsDragging(false);
      return;
    }

    // Text box drag complete — create element with those dimensions
    if (tool === 'text' && textBoxStart.current) {
      const draft = textBoxDraft;
      textBoxStart.current = null;
      setTextBoxDraft(null);

      if (draft) {
        const absW = Math.abs(draft.w);
        const absH = Math.abs(draft.h);
        const x = draft.w < 0 ? draft.x + draft.w : draft.x;
        const y = draft.h < 0 ? draft.y + draft.h : draft.y;
        const id = crypto.randomUUID();

        const autoSize = absW < 20;
        const finalW = autoSize ? 20 : absW;
        const finalH = absH < 20 ? (defaultStyle.fontSize ?? 20) * 1.5 : absH;

        addElement({
          id, type: 'text', x, y, width: finalW, height: finalH,
          text: '', autoSize, ...defaultStyle
        });
        setEditingTextId(id);
        setSelectedIds([id]);
      }
      return;
    }

    // Eraser drag: delete all accumulated elements
    if (tool === 'eraser' && isEraserDragging.current) {
      isEraserDragging.current = false;
      if (erasingIds.size > 0) {
        deleteElements([...erasingIds]);
        setErasingIds(new Set());
      }
      return;
    }

    if (resizing) {
      setResizing(null);
      commit();
      return;
    }
    if (isDragging) {
      setIsDragging(false);

      // Arrow/line: if ended on a snap target, save endBinding
      if ((tool === 'arrow' || tool === 'line') && snapTarget && selectedIds.length === 1) {
        const arrowId = selectedIds[0];
        const snap = findSnapTarget(snapTarget, elements, arrowId);
        if (snap) {
          updateElement(arrowId, { endBinding: { elementId: snap.element.id, point: snap.cp.point } });
        }
        setSnapTarget(null);
      }

      commit();
      if (tool !== 'select' && tool !== 'draw') {
        setTool('select');
      }
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = 0.99 ** e.deltaY;
      const ptrX = e.clientX;
      const ptrY = e.clientY;

      setCamera(c => {
        const nextZoom = Math.min(Math.max(c.zoom * zoomFactor, 0.1), 10);
        const scaleChange = nextZoom / c.zoom;
        return {
          zoom: nextZoom,
          x: ptrX - (ptrX - c.x) * scaleChange,
          y: ptrY - (ptrY - c.y) * scaleChange,
        };
      });
    } else {
      setCamera(c => ({
        ...c,
        x: c.x - e.deltaX,
        y: c.y - e.deltaY
      }));
    }
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    setCamera(c => {
      if (direction === 'reset') {
        // Center of screen
        const rect = canvasRef.current?.getBoundingClientRect();
        const cx = rect ? rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.height / 2 : window.innerHeight / 2;
        return { x: cx - (cx - c.x) / c.zoom, y: cy - (cy - c.y) / c.zoom, zoom: 1 };
      }

      const zoomFactor = direction === 'in' ? 1.2 : 0.8;
      const nextZoom = Math.min(Math.max(c.zoom * zoomFactor, 0.1), 10);
      const scaleChange = nextZoom / c.zoom;

      // Zoom from center
      const rect = canvasRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.height / 2 : window.innerHeight / 2;

      return {
        zoom: nextZoom,
        x: cx - (cx - c.x) * scaleChange,
        y: cy - (cy - c.y) * scaleChange,
      };
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Sync with API
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const init = async () => {
      // Prioritize the ID from the URL. If it's a legacy /canvas route, fallback to localStorage
      let targetId = routeId || localStorage.getItem('canvax_last_canvas_id');
      
      try {
        if (targetId) {
          const canvas = await canvasApi.get(targetId);
          if (!cancelled) {
            setCanvasId(canvas.id);
            setCanvasName(canvas.name);
            setUserRole(canvas.role || 'ADMIN');
            setElements(canvas.data as CanvasElement[]);
            localStorage.setItem('canvax_last_canvas_id', canvas.id);
            if (!routeId) {
              // Redirect to the proper URL if we loaded from localStorage
              navigate(`/canvas/${canvas.id}`, { replace: true });
            }
          }
        } else {
          // No target ID at all, create a new one
          const canvas = await canvasApi.create('Untitled Canvas');
          if (!cancelled) {
            setCanvasId(canvas.id);
            setCanvasName(canvas.name);
            setUserRole('ADMIN');
            localStorage.setItem('canvax_last_canvas_id', canvas.id);
            navigate(`/canvas/${canvas.id}`, { replace: true });
          }
        }
      } catch {
        // ID was invalid or deleted, create a new one
        const canvas = await canvasApi.create('Untitled Canvas');
        if (!cancelled) {
          setCanvasId(canvas.id);
          setCanvasName(canvas.name);
          setUserRole('ADMIN');
          localStorage.setItem('canvax_last_canvas_id', canvas.id);
          navigate(`/canvas/${canvas.id}`, { replace: true });
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, [user, routeId, navigate, setElements]);

  // Capture a thumbnail from the canvas element
  const captureThumbnail = useCallback((): string | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    try {
      // Render a small 320x200 thumbnail
      const thumb = document.createElement('canvas');
      thumb.width = 320;
      thumb.height = 200;
      const tCtx = thumb.getContext('2d');
      if (!tCtx) return undefined;
      const dpr = window.devicePixelRatio || 1;
      const scaleX = 320 / (canvas.width / dpr);
      const scaleY = 200 / (canvas.height / dpr);
      const scale = Math.min(scaleX, scaleY);
      tCtx.fillStyle = appState.viewBackgroundColor;
      tCtx.fillRect(0, 0, 320, 200);
      tCtx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height,
        (320 - (canvas.width / dpr) * scale) / 2,
        (200 - (canvas.height / dpr) * scale) / 2,
        (canvas.width / dpr) * scale,
        (canvas.height / dpr) * scale,
      );
      return thumb.toDataURL('image/webp', 0.6);
    } catch {
      return undefined;
    }
  }, [appState.viewBackgroundColor]);

  // Auto-save with thumbnail
  useEffect(() => {
    if (!canvasId || userRole === 'VIEWER') return;
    const t = setTimeout(() => {
      setSaveStatus('saving');
      const thumbnail = captureThumbnail();
      canvasApi.save(canvasId, canvasName, elements, thumbnail).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch(() => setSaveStatus('idle'));
    }, 1500);
    return () => clearTimeout(t);
  }, [elements, canvasId, canvasName, captureThumbnail, userRole]);


  // Handle Text editing overlay
  const editingElement = elements.find(el => el.id === editingTextId);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (userRole === 'VIEWER') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cam = cameraRef.current;
    const ptr = {
      x: (e.clientX - rect.left - cam.x) / cam.zoom,
      y: (e.clientY - rect.top - cam.y) / cam.zoom,
    };
    const hit = getHitElement(ptr);
    if (hit && (hit.type === 'text' || hit.type === 'rectangle' || hit.type === 'ellipse' || hit.type === 'diamond')) {
      setEditingTextId(hit.id);
      setTool('select');
      setSelectedIds([hit.id]);
    } else if (!hit && tool === 'select') {
      // Double click on empty canvas space → create a new text element here
      const id = crypto.randomUUID();
      const newEl: CanvasElement = {
        id, type: 'text', x: ptr.x, y: ptr.y,
        width: 20, height: (defaultStyle.fontSize ?? 20) * 1.5,
        text: '', autoSize: true, ...defaultStyle
      };
      addElement(newEl);
      setSelectedIds([id]);
      // Delay setEditingTextId by one frame so the element is in the DOM
      requestAnimationFrame(() => {
        setEditingTextId(id);
      });
    }
  };

  const handleExportPNG = async () => {
    await exportCanvasToPNG(elements, appState.viewBackgroundColor);
  };

  const handleExportSVG = async () => {
    await exportCanvasToSVG(elements, appState.viewBackgroundColor);
  };

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: appState.viewBackgroundColor, touchAction: 'none' }}>

      <HamburgerMenu
        theme={appState.theme}
        onThemeToggle={() => {
          const newTheme = appState.theme === 'light' ? 'dark' : 'light';
          setAppState({
            theme: newTheme,
            viewBackgroundColor: newTheme === 'dark' ? '#121212' : '#ffffff'
          });
        }}
        onClear={() => {
          setElements([]);
          commit();
        }}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
      />

      {/* Canvas Title Input */}
      <div style={{
        position: 'fixed', top: 12, left: 64, zIndex: 200,
        display: 'flex', alignItems: 'center'
      }}>
        <input
          type="text"
          value={canvasName}
          onChange={(e) => setCanvasName(e.target.value)}
          placeholder="Untitled Canvas"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: appState.theme === 'dark' ? '#c5c5d2' : '#1e1e2e',
            padding: '8px 12px',
            borderRadius: '8px',
            width: '200px',
            transition: 'background 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = appState.theme === 'dark' ? '#2c2c35' : '#f1f3f5';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          readOnly={userRole === 'VIEWER'}
        />
      </div>

      {userRole !== 'VIEWER' && (
        <Toolbar
          tool={tool} onTool={setTool}
          onUndo={undo} onRedo={redo}
          canUndo={past.length > 0} canRedo={future.length > 0}
          theme={appState.theme}
          onInsertImage={openImagePicker}
          onToggleTemplates={() => setIsTemplateModalOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(true)}

        />
      )}

      {(selectedIds.length > 0 || tool !== 'select' && tool !== 'hand') && (
        <PropertiesPanel
          selectedElements={elements.filter(el => selectedIds.includes(el.id))}
          defaultStyle={defaultStyle}
          onUpdateElements={updateElements}
          onUpdateDefaultStyle={setDefaultStyle}
          onReorderElements={reorderElements}
          theme={appState.theme}
          tool={tool}
        />
      )}

      {/* ── Top-right: collaborator avatars + save status ── */}
      <div style={{
        position: 'fixed', top: 12, right: 16, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Collaborator Presence Bar */}
        <PresenceBar collaborators={collaborators} currentUser={user || undefined} />

        {/* Share Button (Admin only) */}
        {userRole === 'ADMIN' && (
          <button
            title="Share Canvas"
            onClick={() => {
              setIsShareModalOpen(true);
              setShareStatus('idle');
              setShareEmail('');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 20,
              background: 'linear-gradient(135deg, #06b6d4, #10b981)',
              border: 'none', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(6,182,212,0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Share
          </button>
        )}

        {/* Save status */}
        {saveStatus !== 'idle' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: appState.theme === 'dark' ? 'rgba(35,35,41,0.9)' : 'rgba(255,255,255,0.9)',
            border: `1px solid ${appState.theme === 'dark' ? '#3a3a44' : '#e2e2e2'}`,
            fontSize: 12, color: appState.theme === 'dark' ? '#c5c5d2' : '#495057',
            backdropFilter: 'blur(8px)',
          }}>
            {saveStatus === 'saving'
              ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              : <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#40c057' }} />}
            {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
          </div>
        )}
      </div>

      {/* ── Remote cursor overlays ── */}
      {Object.values(remoteCursors).map(cursor => {
        // Convert canvas coords → screen coords
        const sx = cursor.x * camera.zoom + camera.x;
        const sy = cursor.y * camera.zoom + camera.y;
        return (
          <div
            key={cursor.userId}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              pointerEvents: 'none',
              zIndex: 500,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Arrow cursor SVG in user color */}
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
              <path d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L14 11 Z"
                fill={cursor.color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            {/* Name label */}
            <div style={{
              position: 'absolute', top: 18, left: 4,
              background: cursor.color,
              color: '#fff',
              fontSize: 10, fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              padding: '2px 6px', borderRadius: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              {cursor.name}
            </div>
          </div>
        );
      })}

      {/* Zoom Controls */}
      <div style={{
        position: 'fixed', bottom: 16, left: 16, zIndex: 200,
        display: 'flex', alignItems: 'center', background: appState.theme === 'dark' ? '#232329' : '#ffffff',
        border: `1px solid ${appState.theme === 'dark' ? '#3a3a44' : '#e2e2e2'}`,
        borderRadius: 8, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <button onClick={() => handleZoom('out')} style={{ border: 'none', background: 'transparent', padding: '6px 12px', color: appState.theme === 'dark' ? '#c5c5d2' : '#1e1e2e', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
        <button onClick={() => handleZoom('reset')} style={{ border: 'none', background: 'transparent', padding: '6px 4px', color: appState.theme === 'dark' ? '#c5c5d2' : '#1e1e2e', cursor: 'pointer', fontSize: 12, width: 48 }}>
          {Math.round(camera.zoom * 100)}%
        </button>
        <button onClick={() => handleZoom('in')} style={{ border: 'none', background: 'transparent', padding: '6px 12px', color: appState.theme === 'dark' ? '#c5c5d2' : '#1e1e2e', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (userRole === 'VIEWER' && tool !== 'hand') return;
          handlePointerDown(e);
        }}
        onPointerMove={(e) => {
          if (userRole === 'VIEWER' && tool !== 'hand') return;
          handlePointerMove(e);
        }}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{
          touchAction: 'none',
          cursor:
            userRole === 'VIEWER' ? (tool === 'hand' || isPanning ? 'grab' : 'default') :
            tool === 'hand' || isPanning ? 'grab' :
              tool === 'laser' ? 'crosshair' :
                tool === 'eraser' ? 'none' :
                  tool === 'bucket' ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 32 32'%3E%3Cpath d='M12 9 L23 20 L12 31 L1 20 Z' fill='none' stroke='%231e1e1e' stroke-width='2.2' stroke-linejoin='miter'/%3E%3Cline x1='2' y1='12' x2='16' y2='12' stroke='%231e1e1e' stroke-width='2.2' stroke-linecap='square'/%3E%3Cpath d='M5 12 L5 8 Q5 5 8 5 Q11 5 11 8 L11 12' fill='none' stroke='%231e1e1e' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Crect x='13' y='8' width='4' height='5' fill='none' stroke='%231e1e1e' stroke-width='2'/%3E%3Cpath d='M28 24 C28 29 26 32 24 32 C22 32 20 29 20 24 C20 20 24 16 24 16 C24 16 28 20 28 24 Z' fill='none' stroke='%231e1e1e' stroke-width='2'/%3E%3C/svg%3E") 3 15, crosshair` :
                    tool === 'text' ? 'text' :
                      tool === 'select' ? 'default' :
                        'crosshair',
        }}
      />

      <canvas
        ref={laserCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 100
        }}
      />

      {/* Eraser circle cursor */}
      {tool === 'eraser' && eraserPos && (
        <div
          style={{
            position: 'absolute',
            left: eraserPos.x - ERASER_RADIUS,
            top: eraserPos.y - ERASER_RADIUS,
            width: ERASER_RADIUS * 2,
            height: ERASER_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid #888',
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
            zIndex: 500,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
          }}
        />
      )}

      {editingTextId && editingElement ? (() => {
        let ex = editingElement.x ?? 0;
        let ey = editingElement.y ?? 0;
        let ew = editingElement.width ?? 0;
        let eh = editingElement.height ?? 0;
        if (ew < 0) { ex += ew; ew = -ew; }
        if (eh < 0) { ey += eh; eh = -eh; }

        return (
          <div
            style={{
              position: 'absolute',
              left: ex * camera.zoom + camera.x,
              top: ey * camera.zoom + camera.y,
              width: editingElement.type !== 'text' ? ew * camera.zoom : undefined,
              height: editingElement.type !== 'text' ? eh * camera.zoom : undefined,
              zIndex: 400,
              pointerEvents: 'none', // wrapper ignores clicks
              display: editingElement.type !== 'text' ? 'flex' : 'block',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
          <textarea
            ref={textInputRef}
            value={editingElement.text ?? ''}
            onChange={e => {
              const ta = e.target;
              if (editingElement.type !== 'text') {
                updateElement(editingTextId, { text: e.target.value });
                return;
              }

              ta.style.height = 'auto';
              ta.style.height = ta.scrollHeight + 'px';
              if (editingElement.autoSize) {
                ta.style.width = 'auto';
                ta.style.width = ta.scrollWidth + 'px';
              }

              const dims = measureTextDimensions(e.target.value, editingElement);

              updateElement(editingTextId, {
                text: e.target.value,
                height: dims.height,
                ...(editingElement.autoSize ? { width: dims.width } : {})
              });
            }}
            onMouseUp={() => {
              if (textInputRef.current && editingElement.type === 'text') {
                const cam = cameraRef.current;
                const newWidth = textInputRef.current.offsetWidth / cam.zoom;
                if (Math.abs(newWidth - Math.abs(editingElement.width ?? 0)) > 5) {
                  updateElement(editingTextId, { width: newWidth, autoSize: false });
                }
              }
            }}
            onBlur={() => {
              if (textInputRef.current && editingElement.type === 'text') {
                const dims = measureTextDimensions(textInputRef.current.value, editingElement);
                updateElement(editingTextId, {
                  height: dims.height,
                });
              }
              setEditingTextId(null);
              setTool('select');
              commit();
            }}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                if (textInputRef.current && editingElement.type === 'text') {
                  const dims = measureTextDimensions(textInputRef.current.value, editingElement);
                  updateElement(editingTextId, {
                    height: dims.height,
                  });
                }
                setEditingTextId(null);
                setTool('select');
                commit();
              }
            }}
            style={{
              display: 'block',
              width: editingElement.type !== 'text' ? '100%' : (editingElement.autoSize ? 'auto' : Math.abs(editingElement.width ?? 200) * camera.zoom),
              maxWidth: '80vw',
              minHeight: (editingElement.fontSize ?? 20) * camera.zoom * 1.5,
              fontSize: (editingElement.fontSize ?? 20) * camera.zoom,
              fontFamily: editingElement.fontFamily === 'hand' ? 'Caveat, cursive' :
                editingElement.fontFamily === 'code' ? '"Courier New", monospace' :
                  editingElement.fontFamily === 'serif' ? 'Georgia, serif' :
                    editingElement.fontFamily === 'comic' ? '"Comic Sans MS", cursive' :
                      editingElement.fontFamily === 'impact' ? 'Impact, sans-serif' :
                        'Inter, sans-serif',
              // For shapes: text is rendered by canvas, so make textarea text invisible
              color: editingElement.type === 'text' ? (editingElement.strokeColor ?? '#1e1e1e') : 'transparent',
              caretColor: editingElement.strokeColor ?? '#1e1e1e',
              background: 'transparent',
              // For shapes: no visible border (canvas draws the shape border)
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              padding: '4px',
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: (editingElement.type === 'text' && editingElement.autoSize) ? 'pre' : 'pre-wrap',
              wordWrap: 'break-word',
              boxSizing: 'border-box',
              textAlign: editingElement.type === 'text' ? 'left' : 'center',
              pointerEvents: 'auto',
            }}
          />
        </div>
        );
      })() : null}



      {/* ── Bottom-right action bar: Present · Mermaid · AI Generate ── */}
      {!isPresentationMode && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto',
        }}>
          {/* Present */}
          <button
            id="presentation-mode-btn"
            title="Presentation Mode (Frames as Slides)"
            onClick={() => setIsPresentationMode(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 100, border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            ▶ Present
          </button>

          {/* Mermaid — button rendered here, panel still fixed-positioned by MermaidPanel */}
          <MermaidPanel theme={appState.theme} camera={camera} />

          {/* AI Generate — button rendered here, panel still fixed-positioned by AIPanel */}
          <AIPanel theme={appState.theme} camera={camera} />
        </div>
      )}

      {/* Presentation Mode overlay */}
      {isPresentationMode && (
        <PresentationMode
          elements={elements}
          camera={camera}
          setCamera={setCamera}
          onExit={() => setIsPresentationMode(false)}
          theme={appState.theme}
          containerRef={containerRef}
        />
      )}
      {/* Share Modal */}
      {isShareModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: appState.theme === 'dark' ? '#232329' : '#fff',
            padding: 24, borderRadius: 12, width: 400,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            color: appState.theme === 'dark' ? '#fff' : '#000',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Share Canvas</h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Email Address</label>
              <input
                type="email"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder="colleague@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${appState.theme === 'dark' ? '#3a3a44' : '#e2e2e2'}`,
                  background: appState.theme === 'dark' ? '#1a1a1f' : '#f8f9fa',
                  color: appState.theme === 'dark' ? '#fff' : '#000',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Role</label>
              <select
                value={shareRole}
                onChange={e => setShareRole(e.target.value as 'EDITOR' | 'VIEWER')}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${appState.theme === 'dark' ? '#3a3a44' : '#e2e2e2'}`,
                  background: appState.theme === 'dark' ? '#1a1a1f' : '#f8f9fa',
                  color: appState.theme === 'dark' ? '#fff' : '#000',
                  boxSizing: 'border-box'
                }}
              >
                <option value="VIEWER">Viewer (Can only view)</option>
                <option value="EDITOR">Editor (Can view and edit)</option>
              </select>
            </div>

            {shareError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{shareError}</div>}
            {shareStatus === 'success' && <div style={{ color: '#10b981', fontSize: 13, marginBottom: 16 }}>Canvas shared successfully!</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  padding: '8px 16px', borderRadius: 6,
                  background: 'transparent', border: 'none',
                  color: appState.theme === 'dark' ? '#aaa' : '#666',
                  cursor: 'pointer', fontWeight: 500
                }}
              >
                Close
              </button>
              <button
                disabled={shareStatus === 'loading' || !shareEmail}
                onClick={async () => {
                  if (!canvasId) return;
                  setShareStatus('loading');
                  setShareError('');
                  try {
                    await canvasApi.share(canvasId, shareEmail, shareRole);
                    setShareStatus('success');
                    setTimeout(() => setIsShareModalOpen(false), 2000);
                  } catch (err: any) {
                    setShareStatus('error');
                    setShareError(err.message || 'Failed to share canvas');
                  }
                }}
                style={{
                  padding: '8px 16px', borderRadius: 6,
                  background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                  border: 'none', color: '#fff', fontWeight: 600,
                  cursor: shareStatus === 'loading' || !shareEmail ? 'not-allowed' : 'pointer',
                  opacity: shareStatus === 'loading' || !shareEmail ? 0.7 : 1
                }}
              >
                {shareStatus === 'loading' ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multiplayer Cursors */}
      <MultiplayerCursors
        cursors={Object.values(remoteCursors)}
        zoom={camera.zoom}
        pan={{ x: camera.x, y: camera.y }}
      />

      {/* Pinned Comments Layer */}
      <CommentsLayer
        elements={elements}
        zoom={camera.zoom}
        pan={{ x: camera.x, y: camera.y }}
        currentUser={user || undefined}
        onUpdateElement={updateElement}
      />

      {/* Floating AI Actions Toolbar for Selected Elements */}
      <AISelectionToolbar
        selectedElements={elements.filter(el => selectedIds.includes(el.id))}
        onReplaceElements={(newEls) => { setElements(newEls); commit(); }}
        onAddElements={(newEls) => { setElements([...elements, ...newEls]); commit(); }}
      />

      {/* AI Copilot Drawer */}
      <AIChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        canvasElements={elements}
        onAddElements={(newEls) => { setElements([...elements, ...newEls]); commit(); }}
      />

      {/* Pre-built Templates Gallery Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        viewportCenter={{
          x: (-camera.x + window.innerWidth / 2) / camera.zoom,
          y: (-camera.y + window.innerHeight / 2) / camera.zoom,
        }}
        onSelectTemplate={(newEls) => { setElements([...elements, ...newEls]); commit(); }}
      />

      {/* Radar Minimap */}
      <Minimap
        elements={elements}
        zoom={camera.zoom}
        pan={{ x: camera.x, y: camera.y }}
        onPanChange={(newPan) => setCamera(prev => ({ ...prev, x: newPan.x, y: newPan.y }))}
      />



    </div>
  );
}
