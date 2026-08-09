import { useEffect, useRef, useState, useCallback } from 'react';
import rough from 'roughjs';
import { useCanvasStore, type CanvasElement, type Tool } from '../../store/useCanvasStore';
import { drawElement } from './rough-utils';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { HamburgerMenu } from './HamburgerMenu';
import { canvasApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    tool, setTool, elements, setElements, addElement, updateElement, updateElements,
    deleteElements,
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

  // Eraser cursor position (screen coords)
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const ERASER_RADIUS = 10; // px on screen — matches Excalidraw size

  // Persistence
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'a') { e.preventDefault(); setSelectedIds(elements.map(el => el.id)); }
        return;
      }
      const map: Record<string, Tool> = {
        v: 'select', h: 'hand', r: 'rectangle', d: 'diamond',
        e: 'ellipse', a: 'arrow', l: 'line', p: 'draw',
        t: 'text', f: 'frame', x: 'eraser',
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
  }, [elements, selectedIds, editingTextId, undo, redo, setTool, setSelectedIds, setElements, commit, openImagePicker]);

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

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = appState.viewBackgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Handle CJS interop for roughjs if necessary
    const roughInstance = rough.canvas ? rough : (rough as any).default;
    const rc = roughInstance.canvas(canvas);

    // Draw elements
    elements.forEach(el => {
      // Skip the element currently being edited — the textarea overlay renders it live
      if (el.id === editingTextId) return;

      const isSelected = tool === 'select' && selectedIds.includes(el.id);
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

    ctx.restore();
  }, [elements, camera, selectedIds, erasingIds, hoveredEraserId, editingTextId, textBoxDraft, appState.viewBackgroundColor, renderTrigger, tool]);

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
      return ptr.x >= ex - pad && ptr.x <= ex + ew + pad && ptr.y >= ey - pad && ptr.y <= ey + eh + pad;
    });
  }, [elements]);

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

    if (tool === 'select' || tool === 'eraser') {
      if (tool === 'eraser') {
        // Start drag-eraser
        isEraserDragging.current = true;
        // Also immediately mark hovered element
        const hit = getHitElement(ptr);
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
          setSelectedIds([hit.id]);
        }
        setIsDragging(true);
        setDragStart(ptr);
      } else {
        setSelectedIds([]);
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
    const newEl: CanvasElement = {
      id, type: tool as any, x: ptr.x, y: ptr.y,
      width: 0, height: 0,
      points: (tool === 'line' || tool === 'arrow' || tool === 'draw') ? [0, 0] : undefined,
      ...defaultStyle
    };
    addElement(newEl);
    setSelectedIds([id]);
    setIsDragging(true);
    setDragStart(ptr);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Track eraser cursor position always
    if (tool === 'eraser') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) setEraserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      if (!isEraserDragging.current) {
        const ptr = getPointer(e);
        const hit = getHitElement(ptr);
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
      const ptr = getPointer(e);
      const sx = textBoxStart.current.x;
      const sy = textBoxStart.current.y;
      setTextBoxDraft({ x: sx, y: sy, w: ptr.x - sx, h: ptr.y - sy });
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
      const ptr = getPointer(e);
      const hit = getHitElement(ptr);
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
      const ptr = getPointer(e);
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

    const ptr = getPointer(e);

    if (tool === 'select') {
      const dx = ptr.x - dragStart.x;
      const dy = ptr.y - dragStart.y;

      const updates = selectedIds.map(id => {
        const el = elements.find(e => e.id === id);
        if (!el) return null;
        return { id, attrs: { x: (el.x ?? 0) + dx, y: (el.y ?? 0) + dy } };
      }).filter(Boolean) as { id: string, attrs: Partial<CanvasElement> }[];

      updateElements(updates);
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
      updateElement(id, { points: [0, 0, ptr.x - (el.x ?? 0), ptr.y - (el.y ?? 0)] });
    } else {
      updateElement(id, {
        width: ptr.x - (el.x ?? 0),
        height: ptr.y - (el.y ?? 0)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);

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
        // If user just clicked (tiny box), use a default size
        const finalW = absW < 20 ? 200 : absW;
        const finalH = absH < 20 ? (defaultStyle.fontSize ?? 20) * 1.5 : absH;
        addElement({
          id, type: 'text', x, y, width: finalW, height: finalH,
          text: '', ...defaultStyle
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
      const saved = localStorage.getItem('canvax_last_canvas_id');
      try {
        if (saved) {
          const canvas = await canvasApi.get(saved);
          if (!cancelled) {
            setCanvasId(canvas.id);
            setCanvasName(canvas.name);
            setElements(canvas.data as CanvasElement[]);
          }
        } else {
          const canvas = await canvasApi.create('Untitled Canvas');
          if (!cancelled) {
            setCanvasId(canvas.id);
            setCanvasName(canvas.name);
            localStorage.setItem('canvax_last_canvas_id', canvas.id);
          }
        }
      } catch {
        const canvas = await canvasApi.create('Untitled Canvas');
        if (!cancelled) {
          setCanvasId(canvas.id);
          setCanvasName(canvas.name);
          localStorage.setItem('canvax_last_canvas_id', canvas.id);
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!canvasId || elements.length === 0) return;
    const t = setTimeout(() => {
      setSaveStatus('saving');
      canvasApi.save(canvasId, canvasName, elements).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch(() => setSaveStatus('idle'));
    }, 1500);
    return () => clearTimeout(t);
  }, [elements, canvasId, canvasName]);

  // Handle Text editing overlay
  const editingElement = elements.find(el => el.id === editingTextId);

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cam = cameraRef.current;
    const ptr = {
      x: (e.clientX - rect.left - cam.x) / cam.zoom,
      y: (e.clientY - rect.top - cam.y) / cam.zoom,
    };
    const hit = getHitElement(ptr);
    if (hit && hit.type === 'text') {
      setEditingTextId(hit.id);
      setTool('select');
      setSelectedIds([hit.id]);
    }
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
      />

      <Toolbar
        tool={tool} onTool={setTool}
        onUndo={undo} onRedo={redo}
        canUndo={past.length > 0} canRedo={future.length > 0}
        theme={appState.theme}
        onInsertImage={openImagePicker}
      />

      {(selectedIds.length > 0 || tool !== 'select' && tool !== 'hand') && (
        <PropertiesPanel
          selectedElements={elements.filter(el => selectedIds.includes(el.id))}
          defaultStyle={defaultStyle}
          onUpdateElements={updateElements}
          onUpdateDefaultStyle={setDefaultStyle}
          theme={appState.theme}
          tool={tool}
        />
      )}

      {saveStatus !== 'idle' && (
        <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 200, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#868e96' }}>
          {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <div style={{ width: 8, height: 8, borderRadius: 4, background: '#40c057' }} />}
          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </div>
      )}

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{
          touchAction: 'none',
          cursor:
            tool === 'hand' || isPanning ? 'grab' :
              tool === 'eraser' ? 'none' :
                tool === 'text' ? 'text' :
                  tool === 'select' ? 'default' :
                    'crosshair',
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

      {editingTextId && editingElement && (
        <div
          style={{
            position: 'absolute',
            left: (editingElement.x ?? 0) * camera.zoom + camera.x,
            top: (editingElement.y ?? 0) * camera.zoom + camera.y,
            zIndex: 400,
            pointerEvents: 'all',
          }}
        >
          <textarea
            ref={textInputRef}
            value={editingElement.text ?? ''}
            placeholder="Type here..."
            onChange={e => {
              updateElement(editingTextId, { text: e.target.value });
              // Auto-grow height only; width stays fixed to box
              const ta = e.target;
              ta.style.height = 'auto';
              ta.style.height = ta.scrollHeight + 'px';
              // Sync height back to the element so canvas renders correctly
              const cam = cameraRef.current;
              updateElement(editingTextId, {
                text: e.target.value,
                height: ta.scrollHeight / cam.zoom,
              });
            }}
            onMouseUp={(e) => {
              if (textInputRef.current) {
                const cam = cameraRef.current;
                const newWidth = textInputRef.current.offsetWidth / cam.zoom;
                if (newWidth !== Math.abs(editingElement.width ?? 0)) {
                  updateElement(editingTextId, { width: newWidth });
                }
              }
            }}
            onBlur={() => {
              // Sync final size back to element before closing
              if (textInputRef.current) {
                const cam = cameraRef.current;
                updateElement(editingTextId, {
                  height: textInputRef.current.scrollHeight / cam.zoom,
                });
              }
              setEditingTextId(null);
              setTool('select');
              commit();
            }}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                if (textInputRef.current) {
                  const cam = cameraRef.current;
                  updateElement(editingTextId, {
                    height: textInputRef.current.scrollHeight / cam.zoom,
                  });
                }
                setEditingTextId(null);
                setTool('select');
                commit();
              }
            }}
            style={{
              display: 'block',
              width: Math.abs(editingElement.width ?? 200) * camera.zoom,
              maxWidth: '80vw',
              minHeight: (editingElement.fontSize ?? 20) * camera.zoom * 1.5,
              fontSize: (editingElement.fontSize ?? 20) * camera.zoom,
              fontFamily: editingElement.fontFamily === 'hand' ? 'Caveat, cursive' :
                editingElement.fontFamily === 'code' ? '"Courier New", monospace' :
                editingElement.fontFamily === 'serif' ? 'Georgia, serif' :
                editingElement.fontFamily === 'comic' ? '"Comic Sans MS", cursive' :
                editingElement.fontFamily === 'impact' ? 'Impact, sans-serif' :
                'Inter, sans-serif',
              color: editingElement.strokeColor ?? '#1e1e1e',
              background: 'transparent',
              border: '1px dashed #6965db',
              outline: 'none',
              resize: 'horizontal',
              overflow: 'visible',  // MUST be visible so text isn't clipped on re-edit
              padding: '4px',
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              boxSizing: 'border-box',
              caretColor: editingElement.strokeColor ?? '#1e1e1e',
            }}
          />
        </div>
      )}
    </div>
  );
}
