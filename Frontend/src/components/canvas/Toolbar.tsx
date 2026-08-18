import { type Tool } from '../../store/useCanvasStore';
import {
  MousePointer2, Hand, Square, Diamond, Circle, ArrowRight,
  Minus, Pencil, Type, Image, Eraser, FrameIcon, Undo2, Redo2,
  Sparkles, MoreHorizontal, PaintBucket, Lasso, StickyNote, MessageSquare, BrainCircuit, Bot, LayoutTemplate, Ruler
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
  tool: Tool;
  onTool: (t: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme: 'light' | 'dark';
  onInsertImage: () => void;
  onToggleTemplates?: () => void;
  onToggleCopilot?: () => void;
  showSizes?: boolean;
  onToggleShowSizes?: () => void;
}

const TOOL_GROUPS: { id: Tool; icon: React.ReactNode; label: string; key: string }[][] = [
  [
    { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select', key: 'V' },
    { id: 'hand', icon: <Hand size={18} />, label: 'Hand', key: 'H' },
  ],
  [
    { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', key: 'R' },
    { id: 'diamond', icon: <Diamond size={18} />, label: 'Diamond', key: 'D' },
    { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse', key: 'E' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow', key: 'A' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line', key: 'L' },
    { id: 'draw', icon: <Pencil size={18} />, label: 'Draw', key: 'P' },
  ],
  [
    { id: 'text', icon: <Type size={18} />, label: 'Text', key: 'T' },
    { id: 'sticky', icon: <StickyNote size={18} />, label: 'Sticky Note', key: 'N' },
    { id: 'comment', icon: <MessageSquare size={18} />, label: 'Comment Pin', key: 'C' },
    { id: 'image', icon: <Image size={18} />, label: 'Image', key: 'I' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser', key: 'X' },
  ],
];

const MORE_TOOLS: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
  { id: 'mindmap', icon: <BrainCircuit size={18} />, label: 'Mind Map', key: 'M' },
  { id: 'frame', icon: <FrameIcon size={18} />, label: 'Frame', key: 'F' },
  { id: 'laser', icon: <Sparkles size={18} />, label: 'Laser', key: 'K' },
  { id: 'bucket', icon: <PaintBucket size={18} />, label: 'Bucket Fill', key: 'B' },
  { id: 'lasso', icon: <Lasso size={18} />, label: 'Lasso', key: 'O' },
];

export function Toolbar({
  tool,
  onTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  theme,
  onInsertImage,
  onToggleTemplates,
  onToggleCopilot,
  showSizes,
  onToggleShowSizes,
}: ToolbarProps) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#232329' : '#ffffff';
  const border = isDark ? '#3a3a44' : '#e2e2e2';
  const text = isDark ? '#c5c5d2' : '#1e1e2e';
  const activeBg = isDark ? '#3d3d4a' : '#ebf4ff';
  const activeColor = '#6965db';

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreMenuOpen]);

  const btnBase: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 8,
    border: 'none', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: text, transition: 'all .15s',
  };

  const divider = (
    <div style={{ width: 1, height: 24, background: border, margin: '0 4px' }} />
  );

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, display: 'flex', alignItems: 'center', gap: 4,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 12, padding: '6px 8px',
      boxShadow: '0 2px 12px rgba(0,0,0,.12)',
    }}>
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {gi > 0 && divider}
          {group.map((t) => (
            <button
              key={t.id}
              title={`${t.label} (${t.key})`}
              onClick={() => {
                if (t.id === 'image') {
                  onInsertImage();
                } else {
                  onTool(t.id);
                }
              }}
              style={{
                ...btnBase,
                background: tool === t.id ? activeBg : 'transparent',
                color: tool === t.id ? activeColor : text,
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>
      ))}

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          title="More tools"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          style={{
            ...btnBase,
            background: MORE_TOOLS.some(t => t.id === tool) ? activeBg : 'transparent',
            color: MORE_TOOLS.some(t => t.id === tool) ? activeColor : text,
          }}
        >
          <MoreHorizontal size={18} />
        </button>
        {moreMenuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            minWidth: 160,
          }}>
            {MORE_TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  onTool(t.id);
                  setMoreMenuOpen(false);
                }}
                style={{
                  ...btnBase,
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  background: tool === t.id ? activeBg : 'transparent',
                  color: tool === t.id ? activeColor : text,
                  gap: 12,
                  height: 'auto',
                }}
              >
                {t.icon}
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>{t.key}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* Feature Action Buttons */}
      {onToggleTemplates && (
        <button title="Templates Library" onClick={onToggleTemplates} style={{ ...btnBase, color: '#06b6d4' }}>
          <LayoutTemplate size={18} />
        </button>
      )}

      {onToggleCopilot && (
        <button title="AI Copilot Chat" onClick={onToggleCopilot} style={{ ...btnBase, color: '#8b5cf6' }}>
          <Bot size={18} />
        </button>
      )}

      {onToggleShowSizes && (
        <button
          title={showSizes ? 'Hide element sizes' : 'Show element sizes'}
          onClick={onToggleShowSizes}
          style={{
            ...btnBase,
            background: showSizes ? activeBg : 'transparent',
            color: showSizes ? activeColor : text,
          }}
        >
          <Ruler size={18} />
        </button>
      )}
      {divider}

      <button title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}
        style={{ ...btnBase, opacity: canUndo ? 1 : 0.35, color: text }}>
        <Undo2 size={18} />
      </button>
      <button title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}
        style={{ ...btnBase, opacity: canRedo ? 1 : 0.35, color: text }}>
        <Redo2 size={18} />
      </button>
    </div>
  );
}
