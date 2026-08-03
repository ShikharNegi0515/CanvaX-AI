import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer, Text } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '../../store/useCanvasStore';
import { MousePointer2, Pen, Square, Circle as CircleIcon, Trash2, Undo2, Redo2, Download, ChevronLeft, UserCircle, Type as TypeIcon, Group as GroupIcon, Ungroup } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#0f172a', '#ffffff'];

export const InfiniteCanvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  const trRef = useRef<Konva.Transformer>(null);
  const dragStartPositions = useRef<{ [id: string]: { x: number, y: number } }>({});

  const { tool, setTool, elements, addElement, updateElement, selectedIds, setSelectedIds, setElements, commit, undo, redo, past, future } = useCanvasStore();

  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
  const editingElement = elements.find(el => el.id === editingTextId);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [editingTextId]);

  // Attach transformer to selected nodes
  useEffect(() => {
    if (tool === 'select' && selectedIds.length > 0 && trRef.current && !editingTextId) {
      const stage = stageRef.current;
      const nodes = selectedIds.map(id => stage?.findOne(`#${id}`)).filter(Boolean) as Konva.Node[];
      trRef.current.nodes(nodes);
      trRef.current.getLayer()?.batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedIds, tool, elements, editingTextId]);

  // Handle keyboard events (Deletion, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (e.key === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.length > 0) {
        setElements(elements.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
        commit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, setElements, setSelectedIds, undo, redo, editingTextId, commit]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    if (editingTextId) return;
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const boundedScale = Math.max(0.1, Math.min(newScale, 5));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    };

    setScale(boundedScale);
    setPosition(newPos);
  };

  const checkDeselect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (editingTextId) {
      setEditingTextId(null);
      commit();
      return;
    }

    if (tool !== 'select') return;
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedIds([]);
    }
  };

  const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return { x: 0, y: 0 };
    return {
      x: (pointerPosition.x - stage.x()) / stage.scaleX(),
      y: (pointerPosition.y - stage.y()) / stage.scaleY(),
    };
  };

  const handleMouseDown = () => {
    if (editingTextId) return;
    if (tool === 'select') return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    const id = crypto.randomUUID();
    
    if (tool === 'text') {
      addElement({ id, type: 'text', x: pos.x, y: pos.y, text: '', fontSize: 24, fill: '#ffffff' });
      setTool('select');
      setSelectedIds([id]);
      setEditingTextId(id);
      return;
    }

    setIsDrawing(true);
    setCurrentId(id);
    setSelectedIds([id]);

    if (tool === 'pen') {
      addElement({ id, type: 'line', points: [pos.x, pos.y], stroke: '#8b5cf6', strokeWidth: 4 });
    } else if (tool === 'rectangle') {
      addElement({ id, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: '#8b5cf6' });
    } else if (tool === 'circle') {
      addElement({ id, type: 'circle', x: pos.x, y: pos.y, radius: 0, fill: '#ec4899' });
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing || tool === 'select' || !currentId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    const element = elements.find((el) => el.id === currentId);

    if (!element) return;

    if (tool === 'pen') {
      const newPoints = (element.points || []).concat([pos.x, pos.y]);
      updateElement(currentId, { points: newPoints });
    } else if (tool === 'rectangle') {
      const width = pos.x - (element.x || 0);
      const height = pos.y - (element.y || 0);
      updateElement(currentId, { width, height });
    } else if (tool === 'circle') {
      const dx = pos.x - (element.x || 0);
      const dy = pos.y - (element.y || 0);
      const radius = Math.sqrt(dx * dx + dy * dy);
      updateElement(currentId, { radius });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setTool('select');
      commit();
    }
  };

  // MULTI-SELECTION AND GROUPING LOGIC
  const handleShapeClick = (e: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
    if (editingTextId) return;
    if (tool !== 'select') return;

    const el = elements.find(el => el.id === id);
    const clickedIds = el?.groupId 
      ? elements.filter(e => e.groupId === el.groupId).map(e => e.id)
      : [id];

    if (e.evt.shiftKey) {
      const newSelected = [...selectedIds];
      let allIncluded = true;
      clickedIds.forEach(cid => { if (!newSelected.includes(cid)) allIncluded = false; });
      
      if (allIncluded) {
        setSelectedIds(newSelected.filter(cid => !clickedIds.includes(cid)));
      } else {
        setSelectedIds(Array.from(new Set([...newSelected, ...clickedIds])));
      }
    } else {
      setSelectedIds(clickedIds);
    }
  };

  const handleTextDblClick = (id: string) => {
    if (tool === 'select') {
      setEditingTextId(id);
      setSelectedIds([id]);
    }
  };

  // DRAG LOGIC FOR MULTIPLE ELEMENTS
  const handleDragStart = (_e: KonvaEventObject<DragEvent>, id: string) => {
    if (tool !== 'select') return;

    // Determine what we are dragging. If clicking an unselected item, select it first.
    let draggingIds = selectedIds;
    if (!selectedIds.includes(id)) {
      const el = elements.find(el => el.id === id);
      draggingIds = el?.groupId 
        ? elements.filter(e => e.groupId === el.groupId).map(e => e.id)
        : [id];
      setSelectedIds(draggingIds);
    }

    const positions: { [id: string]: { x: number, y: number } } = {};
    draggingIds.forEach(selId => {
      const el = elements.find(el => el.id === selId);
      if (el) positions[selId] = { x: el.x || 0, y: el.y || 0 };
    });
    dragStartPositions.current = positions;
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>, id: string) => {
    if (!selectedIds.includes(id)) return;
    const startPos = dragStartPositions.current[id];
    if (!startPos) return;

    const dx = e.target.x() - startPos.x;
    const dy = e.target.y() - startPos.y;

    const stage = stageRef.current;
    if (!stage) return;
    
    selectedIds.forEach(selId => {
      if (selId === id) return; // Natively moved
      const selStartPos = dragStartPositions.current[selId];
      if (!selStartPos) return;
      const node = stage.findOne(`#${selId}`);
      if (node) {
        node.position({ x: selStartPos.x + dx, y: selStartPos.y + dy });
        node.getLayer()?.batchDraw();
      }
    });
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
    if (!selectedIds.includes(id)) {
      updateElement(id, { x: e.target.x(), y: e.target.y() });
      commit();
      return;
    }

    const startPos = dragStartPositions.current[id];
    if (!startPos) return;
    const dx = e.target.x() - startPos.x;
    const dy = e.target.y() - startPos.y;

    const newElements = elements.map(el => {
      if (selectedIds.includes(el.id)) {
        const p = dragStartPositions.current[el.id];
        if (p) return { ...el, x: p.x + dx, y: p.y + dy };
      }
      return el;
    });
    setElements(newElements);
    commit();
    dragStartPositions.current = {};
  };

  const deleteSelected = () => {
    if (selectedIds.length > 0) {
      setElements(elements.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
      commit();
    }
  };

  const createGroup = () => {
    if (selectedIds.length < 2) return;
    const groupId = crypto.randomUUID();
    setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId } : el));
    commit();
  };

  const ungroup = () => {
    if (selectedIds.length === 0) return;
    setElements(elements.map(el => selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el));
    commit();
  };

  const exportCanvas = () => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const originalPosition = stage.position();
    const originalScale = stage.scale();

    stage.position({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });
    
    setSelectedIds([]);
    setEditingTextId(null);

    setTimeout(() => {
      const uri = stage.toDataURL({ pixelRatio: 2 });
      
      const link = document.createElement('a');
      link.download = 'CanvasX-AI-Export.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      stage.position(originalPosition);
      stage.scale(originalScale);
    }, 50);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingTextId) {
      updateElement(editingTextId, { text: e.target.value });
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingTextId(null);
      commit();
    }
    if (e.key === 'Escape') {
      setEditingTextId(null);
      commit();
    }
  };

  let textareaStyle: React.CSSProperties = { display: 'none' };
  if (editingTextId && editingElement) {
    const stage = stageRef.current;
    const textNode = stage?.findOne(`#${editingTextId}`) as Konva.Text;
    if (textNode) {
      const textPosition = textNode.getAbsolutePosition();
      const scaledFontSize = (editingElement.fontSize || 24) * scale;
      const textWidth = Math.max(textNode.width() * scale, 150 * scale);
      const textHeight = Math.max(textNode.height() * scale, scaledFontSize * 1.5);

      textareaStyle = {
        position: 'absolute',
        top: `${textPosition.y}px`,
        left: `${textPosition.x}px`,
        width: `${textWidth}px`,
        height: `${textHeight + (20 * scale)}px`,
        fontSize: `${scaledFontSize}px`,
        lineHeight: 1.2,
        fontFamily: 'Inter, sans-serif',
        border: '2px solid var(--primary)',
        padding: '0px',
        margin: '0px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        opacity: 0.95,
        outline: 'none',
        color: editingElement.fill,
        resize: 'none',
        overflow: 'hidden',
        zIndex: 50,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        borderRadius: '8px',
        boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2)'
      };
    }
  }

  const gridSize = 40 * scale;
  const bgStyle = {
    backgroundImage: `radial-gradient(var(--muted-foreground) 1.5px, transparent 1.5px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${position.x}px ${position.y}px`,
    opacity: 0.15
  };

  return (
    <div className="w-full h-screen bg-background overflow-hidden relative font-sans text-foreground">
      <div className="absolute inset-0 pointer-events-none transition-transform" style={bgStyle} />
      
      {/* Inline Text Editor Overlay */}
      {editingTextId && (
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          value={editingElement?.text || ''}
          onChange={handleTextareaChange}
          onKeyDown={handleTextareaKeyDown}
          onBlur={() => {
            setEditingTextId(null);
            commit();
          }}
          className="custom-scrollbar"
        />
      )}

      {/* Premium Top Navigation */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between glass px-4 md:px-6 py-3 rounded-2xl border border-border/50 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
            <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:block">CanvasX AI</span>
          </Link>
          <div className="w-px h-6 bg-border hidden sm:block" />
          <div className="text-sm font-medium text-foreground px-3 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border">
            Untitled Canvas
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
          <button 
            onClick={undo} 
            disabled={past.length === 0}
            className={`p-2 rounded-lg transition-all ${past.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-background hover:shadow-sm text-foreground active:scale-95'}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={future.length === 0}
            className={`p-2 rounded-lg transition-all ${future.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-background hover:shadow-sm text-foreground active:scale-95'}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={exportCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:block">Export</span>
          </button>
          <div className="w-px h-6 bg-border hidden sm:block" />
          <Link to="/auth" className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden">
              <UserCircle className="w-full h-full text-muted-foreground mt-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Properties Panel (Right Sidebar) */}
      <AnimatePresence>
        {selectedIds.length > 0 && !editingTextId && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-24 right-4 w-72 glass rounded-2xl border border-border/50 shadow-2xl p-6 z-10 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <h3 className="font-semibold text-lg">{selectedIds.length === 1 ? 'Properties' : 'Multi-Select'}</h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-wider">
                {selectedIds.length === 1 ? selectedElement?.type : `${selectedIds.length} ITEMS`}
              </span>
            </div>

            <div className="space-y-6">
              {/* Grouping Actions */}
              {selectedIds.length > 1 && (
                <div className="flex gap-2">
                  <button 
                    onClick={createGroup}
                    className="flex-1 flex justify-center items-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors"
                  >
                    <GroupIcon className="w-4 h-4" /> Group
                  </button>
                  <button 
                    onClick={ungroup}
                    className="flex-1 flex justify-center items-center gap-2 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors"
                  >
                    <Ungroup className="w-4 h-4" /> Ungroup
                  </button>
                </div>
              )}

              {/* Single item properties */}
              {selectedIds.length === 1 && selectedElement && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Fill Color</label>
                    <div className="grid grid-cols-5 gap-3">
                      {COLORS.map(color => {
                        const isSelected = selectedElement.fill === color || selectedElement.stroke === color;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (selectedElement.type === 'line') {
                                updateElement(selectedElement.id, { stroke: color });
                              } else {
                                updateElement(selectedElement.id, { fill: color });
                              }
                              commit();
                            }}
                            className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'hover:shadow-md'}`}
                            style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid var(--border)' : 'none' }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {selectedElement.type === 'line' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex justify-between">
                        <span>Stroke Width</span>
                        <span className="text-foreground">{selectedElement.strokeWidth}px</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" max="20" 
                        value={selectedElement.strokeWidth || 4}
                        onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                        onMouseUp={commit}
                        onTouchEnd={commit}
                        className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {selectedElement.type === 'text' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex justify-between">
                        <span>Font Size</span>
                        <span className="text-foreground">{selectedElement.fontSize}px</span>
                      </label>
                      <input 
                        type="range" 
                        min="12" max="120" 
                        value={selectedElement.fontSize || 24}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commit}
                        onTouchEnd={commit}
                        className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        draggable={tool === 'select' && !isDrawing && !editingTextId}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onClick={checkDeselect}
        onTap={checkDeselect}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragEnd={(e) => {
          if (tool === 'select' && e.target === e.target.getStage()) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        ref={stageRef}
        className={tool === 'select' ? (isDrawing ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}
      >
        <Layer>
          {elements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            
            if (el.type === 'line') {
              return (
                <Line
                  key={el.id}
                  id={el.id}
                  points={el.points || []}
                  stroke={el.stroke}
                  strokeWidth={el.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  onClick={(e) => handleShapeClick(e, el.id)}
                  onTap={(e) => handleShapeClick(e, el.id)}
                  draggable={tool === 'select' && isSelected && !editingTextId}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragMove={(e) => handleDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              );
            }
            if (el.type === 'rectangle') {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill={el.fill}
                  onClick={(e) => handleShapeClick(e, el.id)}
                  onTap={(e) => handleShapeClick(e, el.id)}
                  draggable={tool === 'select' && isSelected && !editingTextId}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragMove={(e) => handleDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Rect;
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(5, node.width() * node.scaleX()),
                      height: Math.max(5, node.height() * node.scaleY()),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                    commit();
                  }}
                />
              );
            }
            if (el.type === 'circle') {
              return (
                <Circle
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  radius={el.radius}
                  fill={el.fill}
                  onClick={(e) => handleShapeClick(e, el.id)}
                  onTap={(e) => handleShapeClick(e, el.id)}
                  draggable={tool === 'select' && isSelected && !editingTextId}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragMove={(e) => handleDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Circle;
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      radius: Math.max(5, (node.radius() * node.scaleX())),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                    commit();
                  }}
                />
              );
            }
            if (el.type === 'text') {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.id === editingTextId ? '' : (el.text || 'Text')}
                  fontSize={el.fontSize}
                  fill={el.fill}
                  fontFamily="Inter, sans-serif"
                  onClick={(e) => handleShapeClick(e, el.id)}
                  onTap={(e) => handleShapeClick(e, el.id)}
                  onDblClick={() => handleTextDblClick(el.id)}
                  onDblTap={() => handleTextDblClick(el.id)}
                  draggable={tool === 'select' && isSelected && !editingTextId}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragMove={(e) => handleDragMove(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Text;
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      fontSize: Math.max(12, node.fontSize() * node.scaleY()),
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                    commit();
                  }}
                />
              );
            }
            return null;
          })}
          {tool === 'select' && !editingTextId && (
            <Transformer 
              ref={trRef} 
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Floating Toolbar (Mac-like Dock) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-3 py-3 rounded-2xl flex items-center gap-2 shadow-2xl border border-border/50 backdrop-blur-xl z-10">
        <ToolButton 
          active={tool === 'select'} 
          onClick={() => { setTool('select'); setSelectedIds([]); setEditingTextId(null); }} 
          icon={<MousePointer2 className="w-5 h-5" />} 
          label="Select" 
        />
        <div className="w-px h-8 bg-border mx-1" />
        <ToolButton 
          active={tool === 'pen'} 
          onClick={() => { setTool('pen'); setEditingTextId(null); }} 
          icon={<Pen className="w-5 h-5" />} 
          label="Draw" 
        />
        <ToolButton 
          active={tool === 'rectangle'} 
          onClick={() => { setTool('rectangle'); setEditingTextId(null); }} 
          icon={<Square className="w-5 h-5" />} 
          label="Rect" 
        />
        <ToolButton 
          active={tool === 'circle'} 
          onClick={() => { setTool('circle'); setEditingTextId(null); }} 
          icon={<CircleIcon className="w-5 h-5" />} 
          label="Circle" 
        />
        <ToolButton 
          active={tool === 'text'} 
          onClick={() => { setTool('text'); setEditingTextId(null); }} 
          icon={<TypeIcon className="w-5 h-5" />} 
          label="Text" 
        />

        {selectedIds.length > 0 && !editingTextId && (
          <>
            <div className="w-px h-8 bg-border mx-1" />
            <button 
              onClick={deleteSelected}
              className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/10 text-red-500 hover:scale-110 active:scale-95 group"
              title="Delete Selected"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
        
        <div className="w-px h-8 bg-border mx-1 hidden sm:block" />
        <div className="px-2 hidden sm:flex flex-col items-center justify-center min-w-[3.5rem] select-none">
          <span className="text-xs font-semibold text-foreground">{Math.round(scale * 100)}%</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Zoom</span>
        </div>
      </div>
    </div>
  );
};

// Reusable Tool Button Component for the Dock
const ToolButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 group ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
    title={label}
  >
    {icon}
    {active && (
      <motion.div 
        layoutId="active-tool"
        className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
      />
    )}
  </button>
);
