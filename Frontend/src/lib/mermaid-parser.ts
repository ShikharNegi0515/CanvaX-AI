/**
 * Minimal Mermaid flowchart parser → CanvasElement array
 * Supports: flowchart LR/TD/BT/RL
 *   Nodes: A[rect] A(rect-round) A{diamond} A([ellipse]) A((ellipse))
 *   Edges: A --> B   A -->|label| B   A --- B
 */
import type { CanvasElement } from '../store/useCanvasStore';

type ShapeType = 'rectangle' | 'ellipse' | 'diamond';

interface MNode {
  id: string;
  label: string;
  shape: ShapeType;
}
interface MEdge {
  from: string;
  to: string;
  label?: string;
}

function parseShape(raw: string): { id: string; label: string; shape: ShapeType } | null {
  // id[(label)]  ellipse (stadium)
  let m = raw.match(/^(\w+)\(\[(.+?)\]\)$/);
  if (m) return { id: m[1], label: m[2], shape: 'ellipse' };
  // id((label))  circle
  m = raw.match(/^(\w+)\(\((.+?)\)\)$/);
  if (m) return { id: m[1], label: m[2], shape: 'ellipse' };
  // id([label])  round rect
  m = raw.match(/^(\w+)\(\[(.+?)\]\)$/);
  if (m) return { id: m[1], label: m[2], shape: 'rectangle' };
  // id{label}  diamond
  m = raw.match(/^(\w+)\{(.+?)\}$/);
  if (m) return { id: m[1], label: m[2], shape: 'diamond' };
  // id(label)  rounded rect
  m = raw.match(/^(\w+)\((.+?)\)$/);
  if (m) return { id: m[1], label: m[2], shape: 'rectangle' };
  // id[label]  rect
  m = raw.match(/^(\w+)\[(.+?)\]$/);
  if (m) return { id: m[1], label: m[2], shape: 'rectangle' };
  // bare id  (no brackets)
  m = raw.match(/^(\w+)$/);
  if (m) return { id: m[1], label: m[1], shape: 'rectangle' };
  return null;
}

export function parseMermaid(code: string): CanvasElement[] {
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
  const nodes = new Map<string, MNode>();
  const edges: MEdge[] = [];

  // Determine direction
  let isVertical = true;
  const firstLine = lines[0] ?? '';
  if (/flowchart\s+(LR|RL)/i.test(firstLine)) isVertical = false;

  for (const line of lines) {
    if (/^(flowchart|graph)\s/i.test(line)) continue;
    if (line.startsWith('%%')) continue;

    // Edge patterns: A --> B | A -->|label| B | A --- B
    // First try with label
    const edgeLabelMatch = line.match(/^(.+?)\s*(?:-->|---)\s*\|(.+?)\|\s*(.+)$/);
    if (edgeLabelMatch) {
      const fromRaw = edgeLabelMatch[1].trim();
      const label = edgeLabelMatch[2].trim();
      const toRaw = edgeLabelMatch[3].trim();
      const from = parseShape(fromRaw) ?? { id: fromRaw, label: fromRaw, shape: 'rectangle' as ShapeType };
      const to = parseShape(toRaw) ?? { id: toRaw, label: toRaw, shape: 'rectangle' as ShapeType };
      if (!nodes.has(from.id)) nodes.set(from.id, from);
      if (!nodes.has(to.id)) nodes.set(to.id, to);
      edges.push({ from: from.id, to: to.id, label });
      continue;
    }
    // Plain edge: A --> B
    const edgeMatch = line.match(/^(.+?)\s*(-->|---)\s*(.+)$/);
    if (edgeMatch) {
      const fromRaw = edgeMatch[1].trim();
      const toRaw = edgeMatch[3].trim();
      const from = parseShape(fromRaw) ?? { id: fromRaw, label: fromRaw, shape: 'rectangle' as ShapeType };
      const to = parseShape(toRaw) ?? { id: toRaw, label: toRaw, shape: 'rectangle' as ShapeType };
      if (!nodes.has(from.id)) nodes.set(from.id, from);
      if (!nodes.has(to.id)) nodes.set(to.id, to);
      edges.push({ from: from.id, to: to.id });
      continue;
    }
    // Standalone node definition
    const parsed = parseShape(line);
    if (parsed && !nodes.has(parsed.id)) nodes.set(parsed.id, parsed);
  }

  // Layout: assign positions using topological sort
  const W = 180, H = 70, gapH = 80, gapV = 80;
  const nodeArr = [...nodes.values()];
  const pos = new Map<string, { x: number; y: number }>();

  if (isVertical) {
    // TOP-DOWN: simple BFS layer assignment
    const inDegree = new Map<string, number>();
    nodeArr.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1));
    const layers: string[][] = [];
    const queue = nodeArr.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
    const visited = new Set<string>();
    let layerIdx = 0;
    while (queue.length > 0) {
      layers.push([...queue]);
      const nextQ: string[] = [];
      queue.forEach(id => {
        visited.add(id);
        edges.filter(e => e.from === id).forEach(e => {
          if (!visited.has(e.to)) nextQ.push(e.to);
        });
      });
      queue.length = 0;
      queue.push(...nextQ);
      layerIdx++;
      if (layerIdx > 100) break; // safety
    }
    // Add any remaining
    const remaining = nodeArr.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length) layers.push(remaining);

    layers.forEach((layer, li) => {
      const totalW = layer.length * W + (layer.length - 1) * gapH;
      layer.forEach((id, i) => {
        pos.set(id, {
          x: 100 + i * (W + gapH),
          y: 100 + li * (H + gapV),
        });
      });
      void totalW;
    });
  } else {
    // LEFT-RIGHT
    const inDegree = new Map<string, number>();
    nodeArr.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1));
    const layers: string[][] = [];
    const queue = nodeArr.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
    const visited = new Set<string>();
    let li = 0;
    while (queue.length > 0) {
      layers.push([...queue]);
      const nextQ: string[] = [];
      queue.forEach(id => {
        visited.add(id);
        edges.filter(e => e.from === id).forEach(e => {
          if (!visited.has(e.to)) nextQ.push(e.to);
        });
      });
      queue.length = 0;
      queue.push(...nextQ);
      li++;
      if (li > 100) break;
    }
    const remaining = nodeArr.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length) layers.push(remaining);

    layers.forEach((layer, col) => {
      layer.forEach((id, row) => {
        pos.set(id, {
          x: 100 + col * (W + gapH),
          y: 100 + row * (H + gapV),
        });
      });
    });
  }

  // Build elements
  const elements: CanvasElement[] = [];
  const idMap = new Map<string, string>(); // mermaid id → uuid

  nodeArr.forEach(node => {
    const uuid = crypto.randomUUID();
    idMap.set(node.id, uuid);
    const p = pos.get(node.id) ?? { x: 100, y: 100 };

    const isTerminal = node.label.toLowerCase() === 'start' || node.label.toLowerCase() === 'end'
      || node.label.toLowerCase() === 'stop';

    elements.push({
      id: uuid,
      type: isTerminal ? 'ellipse' : node.shape,
      x: p.x, y: p.y,
      width: W, height: H,
      text: node.label,
      strokeColor: '#1e1e2e',
      backgroundColor: node.shape === 'diamond' ? '#fff9db' : '#e7f5ff',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      fontSize: 16,
      fontFamily: 'normal',
    } as CanvasElement);
  });

  // Edges → arrows
  edges.forEach(edge => {
    const fromId = idMap.get(edge.from);
    const toId   = idMap.get(edge.to);
    if (!fromId || !toId) return;

    const fp = pos.get(edge.from)!;
    const tp = pos.get(edge.to)!;

    const sx = fp.x + W / 2;
    const sy = fp.y + H / 2;
    const ex = tp.x + W / 2;
    const ey = tp.y + H / 2;

    const arrowId = crypto.randomUUID();
    elements.push({
      id: arrowId,
      type: 'arrow',
      x: sx, y: sy,
      width: 0, height: 0,
      points: [0, 0, ex - sx, ey - sy],
      strokeColor: '#1e1e2e',
      strokeWidth: 2,
      roughness: 1,
      endArrowhead: 'arrow',
      startArrowhead: 'none',
    } as CanvasElement);

    if (edge.label) {
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2 - 18;
      elements.push({
        id: crypto.randomUUID(),
        type: 'text',
        x: mx - 20, y: my,
        width: 60, height: 24,
        text: edge.label,
        strokeColor: '#444',
        fontSize: 13,
        fontFamily: 'normal',
      } as CanvasElement);
    }
  });

  return elements;
}
