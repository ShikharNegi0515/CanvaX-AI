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
  
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  
  const viewX = -pan.x / zoom;
  const viewY = -pan.y / zoom;
  const viewW = vw / zoom;
  const viewH = vh / zoom;

  let minX = viewX;
  let minY = viewY;
  let maxX = viewX + viewW;
  let maxY = viewY + viewH;

  elements.forEach(el => {
    const w = el.width || 40;
    const h = el.height || 40;
    const ex = (el.x || 0) + Math.min(0, w);
    const ey = (el.y || 0) + Math.min(0, h);
    const ew = Math.abs(w);
    const eh = Math.abs(h);
    
    if (ex < minX) minX = ex;
    if (ey < minY) minY = ey;
    if (ex + ew > maxX) maxX = ex + ew;
    if (ey + eh > maxY) maxY = ey + eh;
  });

  const padding = 100 / zoom;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const boundsW = maxX - minX;
  const boundsH = maxY - minY;

  // Compute scale and offsets to fit everything inside MAP_SIZE
  const scale = Math.min(MAP_SIZE / boundsW, MAP_SIZE / boundsH, 0.1); // Max scale 0.1
  const offsetX = (MAP_SIZE - boundsW * scale) / 2 - minX * scale;
  const offsetY = (MAP_SIZE - boundsH * scale) / 2 - minY * scale;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = (clickX - offsetX) / scale;
    const targetCanvasY = (clickY - offsetY) / scale;

    const newViewX = targetCanvasX - viewW / 2;
    const newViewY = targetCanvasY - viewH / 2;

    onPanChange({ x: -newViewX * zoom, y: -newViewY * zoom });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleMinimapClick}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
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
        const w = el.width || 40;
        const h = el.height || 40;
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        const x = (el.x || 0) + Math.min(0, w);
        const y = (el.y || 0) + Math.min(0, h);

        const miniX = x * scale + offsetX;
        const miniY = y * scale + offsetY;
        const miniW = Math.max(absW * scale, 3);
        const miniH = Math.max(absH * scale, 3);

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
              borderRadius: el.type === 'ellipse' ? '50%' : 2,
              opacity: 0.8,
            }}
          />
        );
      })}

      {/* Viewport rectangle indicator */}
      <div
        style={{
          position: 'absolute',
          left: viewX * scale + offsetX,
          top: viewY * scale + offsetY,
          width: viewW * scale,
          height: viewH * scale,
          border: '1.5px solid #06b6d4',
          borderRadius: 4,
          background: 'rgba(6,182,212,0.15)',
          pointerEvents: 'none',
          boxShadow: '0 0 0 9999px rgba(13,21,38,0.4)', // Darken outside viewport
        }}
      />
    </div>
  );
}
