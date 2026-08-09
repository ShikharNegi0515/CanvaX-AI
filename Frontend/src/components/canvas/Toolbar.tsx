import { type Tool } from '../../store/useCanvasStore';
import {
  MousePointer2, Hand, Square, Diamond, Circle, ArrowRight,
  Minus, Pencil, Type, Image, Eraser, FrameIcon, Undo2, Redo2,
} from 'lucide-react';

interface ToolbarProps {
  tool: Tool;
  onTool: (t: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme: 'light' | 'dark';
  onInsertImage: () => void;
}

const TOOL_GROUPS: { id: Tool; icon: React.ReactNode; label: string; key: string }[][] = [
  [
    { id: 'select',    icon: <MousePointer2 size={18}/>, label: 'Select',    key: 'V' },
    { id: 'hand',      icon: <Hand size={18}/>,          label: 'Hand',      key: 'H' },
  ],
  [
    { id: 'rectangle', icon: <Square size={18}/>,        label: 'Rectangle', key: 'R' },
    { id: 'diamond',   icon: <Diamond size={18}/>,       label: 'Diamond',   key: 'D' },
    { id: 'ellipse',   icon: <Circle size={18}/>,        label: 'Ellipse',   key: 'E' },
    { id: 'arrow',     icon: <ArrowRight size={18}/>,    label: 'Arrow',     key: 'A' },
    { id: 'line',      icon: <Minus size={18}/>,         label: 'Line',      key: 'L' },
    { id: 'draw',      icon: <Pencil size={18}/>,        label: 'Draw',      key: 'P' },
  ],
  [
    { id: 'text',      icon: <Type size={18}/>,          label: 'Text',      key: 'T' },
    { id: 'image',     icon: <Image size={18}/>,         label: 'Image',     key: 'I' },
    { id: 'frame',     icon: <FrameIcon size={18}/>,     label: 'Frame',     key: 'F' },
    { id: 'eraser',    icon: <Eraser size={18}/>,        label: 'Eraser',    key: 'X' },
  ],
];

export function Toolbar({ tool, onTool, onUndo, onRedo, canUndo, canRedo, theme, onInsertImage }: ToolbarProps) {
  const isDark = theme === 'dark';
  const bg     = isDark ? '#232329' : '#ffffff';
  const border = isDark ? '#3a3a44' : '#e2e2e2';
  const text   = isDark ? '#c5c5d2' : '#1e1e2e';
  const activeBg = isDark ? '#3d3d4a' : '#ebf4ff';
  const activeColor = '#6965db';

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
        <>
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
        </>
      ))}

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
