export function getFloodFillPath(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number
): number[] | null {
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  
  const startI = (startY * width + startX) * 4;
  const startR = data[startI], startG = data[startI+1], startB = data[startI+2], startA = data[startI+3];
  
  const match = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const i = (y * width + x) * 4;
    return Math.abs(data[i]-startR) < 20 && Math.abs(data[i+1]-startG) < 20 && Math.abs(data[i+2]-startB) < 20 && Math.abs(data[i+3]-startA) < 20;
  };

  const mask = new Uint8Array(width * height);
  const q = new Int32Array(width * height * 2);
  let head = 0;
  let tail = 0;
  
  q[tail++] = startX;
  q[tail++] = startY;
  mask[startY * width + startX] = 1;
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let count = 0;

  while(head < tail) {
    const x = q[head++];
    const y = q[head++];
    count++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    if (count > 2000000) break; // Limit
    
    if (x+1 < width && !mask[y*width + x+1] && match(x+1, y)) { mask[y*width + x+1] = 1; q[tail++] = x+1; q[tail++] = y; }
    if (x-1 >= 0 && !mask[y*width + x-1] && match(x-1, y)) { mask[y*width + x-1] = 1; q[tail++] = x-1; q[tail++] = y; }
    if (y+1 < height && !mask[(y+1)*width + x] && match(x, y+1)) { mask[(y+1)*width + x] = 1; q[tail++] = x; q[tail++] = y+1; }
    if (y-1 >= 0 && !mask[(y-1)*width + x] && match(x, y-1)) { mask[(y-1)*width + x] = 1; q[tail++] = x; q[tail++] = y-1; }
  }

  if (count < 10) return null; // Too small
  if (minX <= 2 || minY <= 2 || maxX >= width - 3 || maxY >= height - 3) return null; // Hit bounds, leaked

  // Moore neighborhood tracing
  let startPixel = null;
  outer: for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (mask[y*width + x]) {
        startPixel = {x, y};
        break outer;
      }
    }
  }
  if (!startPixel) return null;

  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
  
  let cx = startPixel.x, cy = startPixel.y;
  let dir = 2; // Pretend we arrived going East
  
  const points: number[] = [];
  let steps = 0;
  do {
    points.push(cx, cy);
    steps++;
    let found = false;
    let nextDir = (dir + 5) % 8; 
    for (let i = 0; i < 8; i++) {
      const d = (nextDir + i) % 8;
      const nx = cx + dx[d];
      const ny = cy + dy[d];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny*width + nx]) {
        cx = nx;
        cy = ny;
        dir = d;
        found = true;
        break;
      }
    }
    if (!found) break; 
    if (steps > 20000) break;
  } while (cx !== startPixel.x || cy !== startPixel.y);

  // Simplify points
  const simplified: number[] = [];
  let step = Math.max(1, Math.floor(points.length / 200)); 
  for (let i = 0; i < points.length; i += 2 * step) {
    simplified.push(points[i], points[i+1]);
  }
  if (simplified.length < 6) return null;

  return simplified;
}
