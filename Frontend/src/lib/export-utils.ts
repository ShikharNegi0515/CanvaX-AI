import rough from 'roughjs';
import type { CanvasElement } from '../store/useCanvasStore';
import { drawElement } from '../components/canvas/rough-utils';

export function getBoundingBox(elements: CanvasElement[]) {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(el => {
    let ex = el.x ?? 0;
    let ey = el.y ?? 0;
    let ew = el.width ?? 0;
    let eh = el.height ?? 0;

    if (el.type === 'line' || el.type === 'arrow' || el.type === 'draw') {
      const pts = el.points ?? [];
      for (let i = 0; i < pts.length; i += 2) {
        const px = ex + pts[i];
        const py = ey + pts[i + 1];
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    } else {
      if (ew < 0) { ex += ew; ew = -ew; }
      if (eh < 0) { ey += eh; eh = -eh; }
      minX = Math.min(minX, ex);
      minY = Math.min(minY, ey);
      maxX = Math.max(maxX, ex + ew);
      maxY = Math.max(maxY, ey + eh);
    }
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export async function exportCanvasToPNG(elements: CanvasElement[], backgroundColor: string) {
  if (elements.length === 0) {
    alert("Canvas is empty!");
    return;
  }
  
  const padding = 40;
  const bbox = getBoundingBox(elements);
  
  const canvas = document.createElement('canvas');
  // Use a higher DPR for better export quality
  const dpr = window.devicePixelRatio ? Math.max(window.devicePixelRatio, 2) : 2; 
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.scale(dpr, dpr);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Translate context so the top-left element is at (padding, padding)
  ctx.translate(-bbox.minX + padding, -bbox.minY + padding);
  
  const roughInstance = typeof (rough as any).canvas === 'function' ? rough : (rough as any).default;
  const rc = roughInstance.canvas(canvas);
  
  // Wait for webfonts to be ready before exporting so text doesn't fall back to standard fonts
  await document.fonts.ready;
  
  elements.forEach(el => {
    drawElement(rc, ctx, el);
  });
  
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvax-design-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      resolve();
    }, 'image/png', 1.0);
  });
}

export async function exportCanvasToSVG(elements: CanvasElement[], backgroundColor: string) {
  if (elements.length === 0) {
    alert("Canvas is empty!");
    return;
  }
  
  // For SVG export, a full vector implementation requires mapping each drawElement to an SVG node.
  // As a quick fallback, we generate a high-res PNG and embed it into an SVG container.
  const padding = 40;
  const bbox = getBoundingBox(elements);
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;
  
  const canvas = document.createElement('canvas');
  const dpr = 2; 
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.scale(dpr, dpr);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(-bbox.minX + padding, -bbox.minY + padding);
  
  const roughInstance = typeof (rough as any).canvas === 'function' ? rough : (rough as any).default;
  const rc = roughInstance.canvas(canvas);
  await document.fonts.ready;
  elements.forEach(el => drawElement(rc, ctx, el));
  
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <image href="${dataUrl}" width="${width}" height="${height}" />
    </svg>
  `.trim();
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canvax-design-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
