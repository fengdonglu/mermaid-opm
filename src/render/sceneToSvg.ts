import type { Scene, SceneEdge, SceneNode } from '../layout/types.js';
import { nodeSvg } from './shapes.js';
import { edgeSvg, markerDefs } from './notation.js';
import { defaultTheme, type Theme } from './theme.js';

const STRUCTURAL = new Set(['aggregation', 'generalization', 'exhibition', 'classification']);
// Endpoint the triangle marker points to: generalization points to the general (target) and classification to the class (target); aggregation points to the whole (source) and exhibition to the exhibitor (source)
const MARKER_AT_TARGET = new Set(['generalization', 'classification']);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function triangleInner(kind: string, theme: Theme): string {
  if (kind === 'exhibition') {
    return `<path d="M0,0 L-14,7 L0,14 z" fill="${theme.hollowFill}" stroke="${theme.lineColor}" stroke-width="2"/><path d="M-4,4 L-10,7 L-4,10 z" fill="${theme.lineColor}"/>`;
  }
  if (kind === 'classification') {
    return `<path d="M0,0 L-14,7 L0,14 z" fill="${theme.hollowFill}" stroke="${theme.lineColor}" stroke-width="2"/><circle cx="-6" cy="7" r="2.5" fill="${theme.lineColor}"/>`;
  }
  const fill = kind === 'aggregation' ? theme.lineColor : theme.hollowFill;
  return `<path d="M0,0 L-14,7 L0,14 z" fill="${fill}" stroke="${theme.lineColor}" stroke-width="2"/>`;
}

function structuralMarker(edge: SceneEdge, theme: Theme): string {
  if (!STRUCTURAL.has(edge.kind) || edge.points.length < 2) return '';
  const atTarget = MARKER_AT_TARGET.has(edge.kind);
  const node = atTarget ? edge.points[edge.points.length - 1] : edge.points[0];
  const neighbor = atTarget ? edge.points[edge.points.length - 2] : edge.points[1];
  // Orient the triangle tip (the path's +x direction) toward the connected node
  const angle = Math.atan2(node.y - neighbor.y, node.x - neighbor.x) * 180 / Math.PI;
  return `<g transform="translate(${node.x},${node.y}) rotate(${angle})">${triangleInner(edge.kind, theme)}</g>`;
}

// If the endpoint attaches to the node's left/right side, only align y to the state row's center; when attached to the top/bottom side, also align x to the node's centerline.
function attachesHorizontally(node: SceneNode, point: { x: number; y: number }): boolean {
  const dx = Math.min(Math.abs(point.x - node.x), Math.abs(point.x - (node.x + node.width)));
  const dy = Math.min(Math.abs(point.y - node.y), Math.abs(point.y - (node.y + node.height)));
  return dx <= dy;
}

// Snap one endpoint of the edge to the vertical center of the compartment holding the referenced state. Mutates the given edge in place (callers should copy the Scene first).
export function anchorEdge(edge: SceneEdge, nodes: SceneNode[], end: 'source' | 'target'): void {
  const stateName = end === 'source' ? edge.sourceState : edge.targetState;
  if (!stateName) return;
  const thing = end === 'source' ? edge.source : edge.target;
  const node = nodes.find((n) => n.thingId === thing);
  if (!node || node.states.length === 0) return;
  const stateIndex = node.states.indexOf(stateName);
  if (stateIndex < 0) return;
  const index = end === 'source' ? 0 : edge.points.length - 1;
  const point = edge.points[index];
  if (!point) return;
  const rowH = node.height / node.states.length;
  const y = node.y + rowH * (stateIndex + 0.5);
  if (attachesHorizontally(node, point)) {
    point.y = y;
  } else {
    point.x = node.x + node.width / 2;
    point.y = y;
  }
}

function edgeMidpoint(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  let target = total / 2;
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (target <= seg) {
      const t = seg === 0 ? 0 : target / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
    target -= seg;
  }
  return points[points.length - 1];
}

function tagLabel(edge: SceneEdge, theme: Theme): string {
  if (edge.kind !== 'tagged' || !edge.tag) return '';
  const mid = edgeMidpoint(edge.points);
  return `<text x="${mid.x}" y="${mid.y - 4}" text-anchor="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(edge.tag)}</text>`;
}

export function sceneToSvg(scene: Scene, theme: Theme = defaultTheme): string {
  const body: string[] = [];
  body.push(markerDefs(theme));
  for (const edge of scene.edges) {
    const anchored: SceneEdge = { ...edge, points: edge.points.map((p) => ({ ...p })) };
    anchorEdge(anchored, scene.nodes, 'source');
    anchorEdge(anchored, scene.nodes, 'target');
    body.push(edgeSvg(anchored, theme));
    if (STRUCTURAL.has(anchored.kind)) body.push(structuralMarker(anchored, theme));
    body.push(tagLabel(anchored, theme));
  }
  for (const node of scene.nodes) body.push(nodeSvg(node, theme));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(scene.width)} ${Math.ceil(scene.height)}" width="${Math.ceil(scene.width)}" height="${Math.ceil(scene.height)}" role="img">${body.join('')}</svg>`;
}
