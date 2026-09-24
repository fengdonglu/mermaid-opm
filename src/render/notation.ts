import type { SceneEdge } from '../layout/types.js';
import type { Theme } from './theme.js';

export { markerDefs } from './markers.js';

function markers(kind: SceneEdge['kind']): { start?: string; end?: string } {
  switch (kind) {
    case 'consumption':
    case 'production':
    case 'input-output':
      return { end: 'arrow-filled' };
    case 'effect':
      return { start: 'arrow-filled', end: 'arrow-filled' };
    case 'agent':
      return { end: 'circle-fill' };
    case 'instrument':
      return { end: 'circle-open' };
    case 'condition':
      return { end: 'arrow-open' };
    case 'tagged':
      return { start: 'arrow-open', end: 'arrow-open' };
    default:
      // Structural links (aggregation/generalization/exhibition/classification)
      // have their triangle marker drawn by sceneToSvg's structuralMarker at the corresponding endpoint
      return {};
  }
}

export function edgeSvg(edge: SceneEdge, theme: Theme): string {
  if (edge.points.length < 2) return '';
  const pts = edge.points.map((p) => `${p.x},${p.y}`).join(' ');
  const mk = markers(edge.kind);
  const attrs: string[] = [
    `points="${pts}"`, 'fill="none"', `stroke="${theme.lineColor}"`, 'stroke-width="1.5"',
  ];
  if (mk.start) attrs.push(`marker-start="url(#${mk.start})"`);
  if (mk.end) attrs.push(`marker-end="url(#${mk.end})"`);
  return `<polyline ${attrs.join(' ')}/><title>${edge.kind}</title>`;
}
