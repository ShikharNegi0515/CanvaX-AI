import type { CanvasElement, ArrowBinding } from '../store/useCanvasStore';

export interface ConnectionPoint {
  x: number;
  y: number;
  point: ArrowBinding['point'];
}

/** Returns the 4 cardinal connection points for a shape */
export function getConnectionPoints(el: CanvasElement): ConnectionPoint[] {
  let ex = el.x ?? 0;
  let ey = el.y ?? 0;
  let ew = el.width ?? 0;
  let eh = el.height ?? 0;
  if (ew < 0) { ex += ew; ew = -ew; }
  if (eh < 0) { ey += eh; eh = -eh; }

  return [
    { point: 'top',    x: ex + ew / 2, y: ey },
    { point: 'right',  x: ex + ew,     y: ey + eh / 2 },
    { point: 'bottom', x: ex + ew / 2, y: ey + eh },
    { point: 'left',   x: ex,          y: ey + eh / 2 },
  ];
}

/** Returns the world-space coordinate of a named connection point on an element */
export function getConnectionPointCoords(el: CanvasElement, point: ArrowBinding['point']): { x: number; y: number } {
  const pts = getConnectionPoints(el);
  return pts.find(p => p.point === point) ?? pts[1]; // fallback right
}

const SNAP_RADIUS = 24; // px in canvas coords

/** Find the nearest connection point on any non-arrow/non-draw element within snap radius.
 *  Returns null if none found, otherwise { element, connectionPoint, worldX, worldY }
 */
export function findSnapTarget(
  ptr: { x: number; y: number },
  elements: CanvasElement[],
  excludeId?: string,
): { element: CanvasElement; cp: ConnectionPoint } | null {
  let best: { element: CanvasElement; cp: ConnectionPoint } | null = null;
  let bestDist = SNAP_RADIUS;

  for (const el of elements) {
    if (el.id === excludeId) continue;
    if (el.type === 'arrow' || el.type === 'line' || el.type === 'draw' || el.type === 'text') continue;

    for (const cp of getConnectionPoints(el)) {
      const dist = Math.hypot(ptr.x - cp.x, ptr.y - cp.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { element: el, cp };
      }
    }
  }

  return best;
}

/** Calculate arrow points [0,0,dx,dy] from startEl connection point to endEl connection point */
export function calcBoundArrowPoints(
  startEl: CanvasElement,
  startPoint: ArrowBinding['point'],
  endEl: CanvasElement,
  endPoint: ArrowBinding['point'],
): { x: number; y: number; points: number[] } {
  const src = getConnectionPointCoords(startEl, startPoint);
  const dst = getConnectionPointCoords(endEl, endPoint);
  return {
    x: src.x,
    y: src.y,
    points: [0, 0, dst.x - src.x, dst.y - src.y],
  };
}

/** Update all arrows that are bound to a moved shape */
export function getUpdatedBoundArrows(
  movedIds: string[],
  allElements: CanvasElement[],
): { id: string; attrs: Partial<CanvasElement> }[] {
  const movedSet = new Set(movedIds);
  const updates: { id: string; attrs: Partial<CanvasElement> }[] = [];
  const elMap = new Map(allElements.map(e => [e.id, e]));

  for (const arrow of allElements) {
    if (arrow.type !== 'arrow' && arrow.type !== 'line') continue;

    const startEl = arrow.startBinding ? elMap.get(arrow.startBinding.elementId) : undefined;
    const endEl   = arrow.endBinding   ? elMap.get(arrow.endBinding.elementId)   : undefined;

    if (!startEl && !endEl) continue;
    // Only recalc if at least one bound shape was moved
    if (!movedSet.has(startEl?.id ?? '') && !movedSet.has(endEl?.id ?? '')) continue;

    if (startEl && endEl) {
      const result = calcBoundArrowPoints(
        startEl, arrow.startBinding!.point,
        endEl,   arrow.endBinding!.point,
      );
      updates.push({ id: arrow.id, attrs: { x: result.x, y: result.y, points: result.points } });
    } else if (startEl) {
      const src = getConnectionPointCoords(startEl, arrow.startBinding!.point);
      const pts = arrow.points ?? [0, 0, 100, 0];
      updates.push({ id: arrow.id, attrs: {
        x: src.x,
        y: src.y,
        points: [0, 0, pts[2], pts[3]],
      }});
    } else if (endEl) {
      const dst = getConnectionPointCoords(endEl, arrow.endBinding!.point);
      const sx = (arrow.x ?? 0);
      const sy = (arrow.y ?? 0);
      updates.push({ id: arrow.id, attrs: {
        points: [0, 0, dst.x - sx, dst.y - sy],
      }});
    }
  }

  return updates;
}
