import { useRef } from 'react';
import { type CanvasElement } from '../../store/useCanvasStore';

interface MinimapProps {
  elements: CanvasElement[];
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
}

export function Minimap({ elements, zoom, pan, onPanChange }: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const MAP_SIZE = 160;
  const SCALE = 0.05;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert map coordinates back to canvas pan
    const targetCanvasX = (clickX - MAP_SIZE / 2) / SCALE;
    const targetCanvasY = (clickY - MAP_SIZE / 2) / SCALE;

    onPanChange({ x: -targetCanvasX * zoom, y: -targetCanvasY * zoom });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleMinimapClick}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: MAP_SIZE,
        height: MAP_SIZE,
        background: '#0d1526',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 100,
        cursor: 'pointer',
      }}
      title="Canvas Minimap - Click to pan"
    >
      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(6,182,212,0.15) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Render mini elements */}
      {elements.map((el) => {
        const miniX = (el.x || 0) * SCALE + MAP_SIZE / 2;
        const miniY = (el.y || 0) * SCALE + MAP_SIZE / 2;
        const miniW = Math.max((el.width || 40) * SCALE, 4);
        const miniH = Math.max((el.height || 40) * SCALE, 4);

        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: miniX,
              top: miniY,
              width: miniW,
              height: miniH,
              background: el.strokeColor || '#06b6d4',
              borderRadius: 2,
              opacity: 0.8,
            }}
          />
        );
      })}

      {/* Viewport rectangle indicator */}
      <div
        style={{
          position: 'absolute',
          left: (-pan.x / zoom) * SCALE + MAP_SIZE / 2 - 20,
          top: (-pan.y / zoom) * SCALE + MAP_SIZE / 2 - 15,
          width: 40,
          height: 30,
          border: '1.5px solid #06b6d4',
          borderRadius: 4,
          background: 'rgba(6,182,212,0.15)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
