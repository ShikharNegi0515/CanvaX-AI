import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, MonitorPlay } from 'lucide-react';
import type { CanvasElement } from '../../store/useCanvasStore';

interface PresentationModeProps {
  elements: CanvasElement[];
  camera: { x: number; y: number; zoom: number };
  setCamera: (fn: (c: { x: number; y: number; zoom: number }) => { x: number; y: number; zoom: number }) => void;
  onExit: () => void;
  theme: 'light' | 'dark';
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function getFrames(elements: CanvasElement[]): CanvasElement[] {
  return elements
    .filter(el => el.type === 'frame')
    .sort((a, b) => {
      // Sort left-to-right, then top-to-bottom
      const ax = a.x ?? 0, bx = b.x ?? 0;
      const ay = a.y ?? 0, by = b.y ?? 0;
      if (Math.abs(ax - bx) > 50) return ax - bx;
      return ay - by;
    });
}

function fitFrame(
  frame: CanvasElement,
  container: { width: number; height: number },
  padding = 48,
): { x: number; y: number; zoom: number } {
  const fw = Math.abs(frame.width ?? 400);
  const fh = Math.abs(frame.height ?? 300);
  const fx = frame.x ?? 0;
  const fy = frame.y ?? 0;

  const zoomX = (container.width  - padding * 2) / fw;
  const zoomY = (container.height - padding * 2) / fh;
  const zoom  = Math.min(zoomX, zoomY, 2);

  const cx = container.width  / 2;
  const cy = container.height / 2;

  return {
    zoom,
    x: cx - (fx + fw / 2) * zoom,
    y: cy - (fy + fh / 2) * zoom,
  };
}

export function PresentationMode({ elements, camera: _camera, setCamera, onExit, theme, containerRef }: PresentationModeProps) {
  const frames = getFrames(elements);
  const [current, setCurrent] = useState(0);
  const isDark = theme === 'dark';

  const goTo = useCallback((index: number) => {
    const frame = frames[index];
    if (!frame || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const target = fitFrame(frame, { width: rect.width, height: rect.height });
    setCamera(() => target);
    setCurrent(index);
  }, [frames, setCamera, containerRef]);

  useEffect(() => {
    if (frames.length > 0) goTo(0);
  }, []);  // eslint-disable-line

  const prev = useCallback(() => goTo(Math.max(0, current - 1)), [goTo, current]);
  const next = useCallback(() => goTo(Math.min(frames.length - 1, current + 1)), [goTo, current, frames.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')                    { e.preventDefault(); prev(); }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onExit]);

  if (frames.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(10,10,18,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <MonitorPlay size={48} color="#6965db" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#e2e2f0' : '#1e1e2e', marginBottom: 8 }}>
          No Frames Found
        </div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          Create Frame elements on your canvas to use Presentation Mode.
        </div>
        <button
          onClick={onExit}
          style={{
            padding: '10px 24px', borderRadius: 100, border: 'none',
            background: '#6965db', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          Back to Canvas
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Overlay controls */}
      <div style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 900, display: 'flex', alignItems: 'center', gap: 12,
        background: isDark ? 'rgba(26,26,36,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? '#3a3a4a' : '#e2e2f0'}`,
        borderRadius: 100, padding: '10px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <button
          onClick={prev}
          disabled={current === 0}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: current === 0 ? 'transparent' : '#6965db',
            color: current === 0 ? '#888' : '#fff', cursor: current === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {frames.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 20 : 8,
                height: 8, borderRadius: 4, border: 'none',
                background: i === current ? '#6965db' : (isDark ? '#444' : '#ccc'),
                cursor: 'pointer', transition: 'all 0.2s', padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === frames.length - 1}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: current === frames.length - 1 ? 'transparent' : '#6965db',
            color: current === frames.length - 1 ? '#888' : '#fff',
            cursor: current === frames.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <ChevronRight size={18} />
        </button>

        <div style={{ width: 1, height: 24, background: isDark ? '#3a3a4a' : '#e2e2f0', margin: '0 4px' }} />

        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e2f0' : '#1e1e2e', minWidth: 48 }}>
          {current + 1} / {frames.length}
        </span>

        <button
          onClick={onExit}
          title="Exit presentation (Esc)"
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: 'rgba(255,80,80,0.15)', color: '#e05555',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 900, display: 'flex', alignItems: 'center', gap: 8,
        background: isDark ? 'rgba(26,26,36,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? '#3a3a4a' : '#e2e2f0'}`,
        borderRadius: 100, padding: '6px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <Maximize2 size={14} color="#6965db" />
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e2f0' : '#1e1e2e' }}>
          {(frames[current] as any)?.text || `Frame ${current + 1}`}
        </span>
        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>— Presentation Mode</span>
      </div>
    </>
  );
}
