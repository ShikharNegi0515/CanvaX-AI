import rough from 'roughjs';
import type { CanvasElement } from '../../store/useCanvasStore';

export type RC = ReturnType<typeof rough.canvas>;

const imageCache = new Map<string, HTMLImageElement>();

/** Map our roughness level to roughjs roughness value */
function toRoughness(r: number) {
  if (r === 0) return 0;
  if (r === 1) return 1.5;
  return 3.5;
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex || hex === 'transparent') return 'transparent';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getStrokeOptions(el: CanvasElement) {
  const opacity = (el.opacity ?? 100) / 100;
  const strokeColor = el.strokeColor ?? '#1e1e1e';
  const bg = el.backgroundColor ?? 'transparent';
  const fillStyle = el.fillStyle ?? 'hachure';
  const roughness = toRoughness(el.roughness ?? 1);
  const strokeWidth = el.strokeWidth ?? 2;

  const lineDash: number[] =
    el.strokeStyle === 'dashed' ? [12, 8] :
    el.strokeStyle === 'dotted' ? [3, 6] :
    [];

  return {
    roughness,
    seed: el.seed ?? 1,
    stroke: hexToRgba(strokeColor, opacity),
    strokeWidth,
    fill: bg === 'transparent' ? 'transparent' : hexToRgba(bg, opacity * 0.8),
    fillStyle: bg === 'transparent' ? 'solid' : fillStyle,
    fillWeight: strokeWidth / 2,
    hachureGap: strokeWidth * 4,
    lineDash,
  } as Parameters<RC['rectangle']>[4];
}

export function drawElement(rc: RC, ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const opts = getStrokeOptions(el);
  const opacity = (el.opacity ?? 100) / 100;

  ctx.save();

  // Translate to element center for rotation
  const cx = (el.x ?? 0) + (el.width ?? 0) / 2;
  const cy = (el.y ?? 0) + (el.height ?? 0) / 2;

  if (el.angle) {
    ctx.translate(cx, cy);
    ctx.rotate(el.angle);
    ctx.translate(-cx, -cy);
  }

  ctx.globalAlpha = opacity * ctx.globalAlpha;

  switch (el.type) {
    case 'rectangle': {
      let bx = el.x ?? 0;
      let by = el.y ?? 0;
      let bw = el.width ?? 100;
      let bh = el.height ?? 80;
      // Normalize negative dimensions
      if (bw < 0) { bx += bw; bw = -bw; }
      if (bh < 0) { by += bh; bh = -bh; }
      if (el.edges === 'round') {
        rc.path(
          `M ${bx + 20} ${by} L ${bx + bw - 20} ${by} Q ${bx + bw} ${by} ${bx + bw} ${by + 20} L ${bx + bw} ${by + bh - 20} Q ${bx + bw} ${by + bh} ${bx + bw - 20} ${by + bh} L ${bx + 20} ${by + bh} Q ${bx} ${by + bh} ${bx} ${by + bh - 20} L ${bx} ${by + 20} Q ${bx} ${by} ${bx + 20} ${by} Z`,
          opts
        );
      } else {
        rc.rectangle(bx, by, bw, bh, opts);
      }
      break;
    }
    case 'diamond': {
      let dx = el.x ?? 0;
      let dy = el.y ?? 0;
      let dw = el.width ?? 100;
      let dh = el.height ?? 80;
      if (dw < 0) { dx += dw; dw = -dw; }
      if (dh < 0) { dy += dh; dh = -dh; }
      rc.path(
        `M ${dx + dw / 2} ${dy} L ${dx + dw} ${dy + dh / 2} L ${dx + dw / 2} ${dy + dh} L ${dx} ${dy + dh / 2} Z`,
        opts
      );
      break;
    }
    case 'ellipse': {
      // Element x,y is top-left corner; roughjs needs center
      const ew = el.width ?? 100;
      const eh = el.height ?? 80;
      // Handle negative dimensions (drawn in any direction)
      const absW = Math.abs(ew);
      const absH = Math.abs(eh);
      const originX = ew < 0 ? (el.x ?? 0) + ew : (el.x ?? 0);
      const originY = eh < 0 ? (el.y ?? 0) + eh : (el.y ?? 0);
      const cx = originX + absW / 2;
      const cy = originY + absH / 2;
      rc.ellipse(cx, cy, absW, absH, opts);
      break;
    }
    case 'line':
    case 'arrow': {
      const pts = el.points ?? [0, 0, 100, 0];
      if (pts.length < 4) break;
      const ox = el.x ?? 0;
      const oy = el.y ?? 0;
      // Draw all segments
      for (let i = 0; i < pts.length - 2; i += 2) {
        rc.line(ox + pts[i], oy + pts[i + 1], ox + pts[i + 2], oy + pts[i + 3], opts);
      }
      // Draw arrowhead
      if (el.type === 'arrow' && (el.endArrowhead ?? 'arrow') === 'arrow' && pts.length >= 4) {
        const lastIdx = pts.length - 2;
        const x2 = ox + pts[lastIdx];
        const y2 = oy + pts[lastIdx + 1];
        const x1 = ox + pts[lastIdx - 2];
        const y1 = oy + pts[lastIdx - 1];
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const size = 12 + (el.strokeWidth ?? 2) * 2;
        ctx.save();
        ctx.strokeStyle = el.strokeColor ?? '#1e1e1e';
        ctx.fillStyle = el.strokeColor ?? '#1e1e1e';
        ctx.lineWidth = el.strokeWidth ?? 2;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 7), y2 - size * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 7), y2 - size * Math.sin(angle + Math.PI / 7));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'draw': {
      // Smooth freehand path
      const pts = el.points ?? [];
      if (pts.length < 4) break;
      const ox = el.x ?? 0;
      const oy = el.y ?? 0;
      // Bucket-fill polygon: roughness===0 and fillStyle===solid means a closed filled region
      if (el.roughness === 0 && el.fillStyle === 'solid' && el.backgroundColor && el.backgroundColor !== 'transparent') {
        ctx.save();
        const bg = el.backgroundColor;
        ctx.fillStyle = bg;
        ctx.strokeStyle = bg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox + pts[0], oy + pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(ox + pts[i], oy + pts[i + 1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = el.strokeColor ?? '#1e1e1e';
        ctx.lineWidth = el.strokeWidth ?? 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (el.strokeStyle === 'dashed') ctx.setLineDash([12, 8]);
        else if (el.strokeStyle === 'dotted') ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(ox + pts[0], oy + pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(ox + pts[i], oy + pts[i + 1]);
        }
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'text': {
      // Text rendering is handled at the end of drawElement
      break;
    }
    case 'frame': {
      let bx = el.x ?? 0;
      let by = el.y ?? 0;
      let bw = el.width ?? 200;
      let bh = el.height ?? 200;
      if (bw < 0) { bx += bw; bw = -bw; }
      if (bh < 0) { by += bh; bh = -bh; }
      ctx.save();
      ctx.strokeStyle = '#b2bec3';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#b2bec3';
      ctx.fillText(el.label ?? 'Frame', bx, by - 5);
      ctx.restore();
      break;
    }
    case 'image': {
      if (el.imageUrl) {
        let img = imageCache.get(el.imageUrl);
        if (!img) {
          img = new Image();
          img.src = el.imageUrl;
          imageCache.set(el.imageUrl, img);
          img.onload = () => {
            window.dispatchEvent(new CustomEvent('canvas-image-loaded'));
          };
        }
        if (img.complete) {
          ctx.drawImage(img, el.x ?? 0, el.y ?? 0, el.width ?? 200, el.height ?? 200);
        }
      }
      break;
    }
    default:
      break;
  }

  if (el.text) {
    renderText(ctx, el);
  }

  ctx.restore();
}

function renderText(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const fontFamilyMap: Record<string, string> = {
    hand: 'Caveat, cursive',
    normal: 'Inter, sans-serif',
    code: '"Courier New", monospace',
    serif: 'Georgia, serif',
    comic: '"Comic Sans MS", cursive',
    impact: 'Impact, sans-serif',
  };
  const font = fontFamilyMap[el.fontFamily ?? 'hand'] ?? fontFamilyMap['hand'];
  const fontSize = el.fontSize ?? 20;
  const lineHeight = fontSize * 1.5;
  const padding = 4;
  const boxWidth = el.autoSize ? Infinity : Math.abs(el.width ?? 200) - padding * 2;

  ctx.save();
  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = el.strokeColor ?? '#1e1e1e';
  
  const rawLines = (el.text ?? '').split('\n');
  const wrappedLines: string[] = [];
  
  rawLines.forEach((rawLine) => {
    if (rawLine === '') {
      wrappedLines.push('');
      return;
    }
    const words = rawLine.split(' ');
    let currentLine = '';
    for (let n = 0; n < words.length; n++) {
      const word = words[n];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > boxWidth) {
        if (currentLine !== '') {
          wrappedLines.push(currentLine);
          currentLine = '';
          n--;
        } else {
          let tempWord = '';
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const charTest = tempWord + char;
            if (ctx.measureText(charTest).width > boxWidth && tempWord !== '') {
              wrappedLines.push(tempWord);
              tempWord = char;
            } else {
              tempWord = charTest;
            }
          }
          currentLine = tempWord;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  });

  const isShape = el.type !== 'text';
  let ex = el.x ?? 0;
  let ey = el.y ?? 0;
  let ew = el.width ?? 200;
  let eh = el.height ?? 200;
  if (ew < 0) { ex += ew; ew = -ew; }
  if (eh < 0) { ey += eh; eh = -eh; }

  let startY = ey + padding;
  
  if (isShape) {
    const totalHeight = wrappedLines.length * lineHeight;
    startY = ey + (eh - totalHeight) / 2;
  }
  
  ctx.textBaseline = 'top';
  ctx.textAlign = isShape ? 'center' : 'left';
  
  let currentY = startY;
  const centerX = ex + ew / 2;
  
  wrappedLines.forEach(line => {
    if (line !== '') {
      const startX = isShape ? centerX : ex + padding;
      ctx.fillText(line, startX, currentY);
    }
    currentY += lineHeight;
  });
  
  ctx.restore();
}

export function measureTextDimensions(text: string, el: CanvasElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const fontFamilyMap: Record<string, string> = {
    hand: 'Caveat, cursive',
    normal: 'Inter, sans-serif',
    code: '"Courier New", monospace',
    serif: 'Georgia, serif',
    comic: '"Comic Sans MS", cursive',
    impact: 'Impact, sans-serif',
  };
  const font = fontFamilyMap[el.fontFamily ?? 'hand'] ?? fontFamilyMap['hand'];
  const fontSize = el.fontSize ?? 20;
  const lineHeight = fontSize * 1.5;
  const padding = 4;
  const boxWidth = el.autoSize ? Infinity : Math.abs(el.width ?? 200) - padding * 2;
  
  ctx.font = `${fontSize}px ${font}`;
  
  const rawLines = text.split('\n');
  const wrappedLines: string[] = [];
  
  let maxWidth = 0;

  rawLines.forEach((rawLine) => {
    if (rawLine === '') {
      wrappedLines.push('');
      return;
    }
    const words = rawLine.split(' ');
    let currentLine = '';
    for (let n = 0; n < words.length; n++) {
      const word = words[n];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > boxWidth) {
        if (currentLine !== '') {
          wrappedLines.push(currentLine);
          maxWidth = Math.max(maxWidth, ctx.measureText(currentLine).width);
          currentLine = '';
          n--;
        } else {
          let tempWord = '';
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const charTest = tempWord + char;
            if (ctx.measureText(charTest).width > boxWidth && tempWord !== '') {
              wrappedLines.push(tempWord);
              maxWidth = Math.max(maxWidth, ctx.measureText(tempWord).width);
              tempWord = char;
            } else {
              tempWord = charTest;
            }
          }
          currentLine = tempWord;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      wrappedLines.push(currentLine);
      maxWidth = Math.max(maxWidth, ctx.measureText(currentLine).width);
    }
  });

  return {
    width: maxWidth + padding * 2,
    height: wrappedLines.length * lineHeight + padding * 2
  };
}
