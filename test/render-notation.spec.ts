import { describe, it, expect } from 'vitest';
import { markerDefs, edgeSvg } from '../src/render/notation.js';
import { defaultTheme } from '../src/render/theme.js';
import type { SceneEdge } from '../src/layout/types.js';

const edge = (kind: SceneEdge['kind']): SceneEdge => ({
  id: 'e1', kind, source: 'A', target: 'B',
  points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
});

describe('notation', () => {
  it('markerDefs defines all needed markers', () => {
    const d = markerDefs(defaultTheme);
    for (const id of ['arrow-filled', 'arrow-open', 'tri-filled', 'tri-open', 'tri-dot', 'tri-tri', 'circle-fill', 'circle-open']) {
      expect(d).toContain(`id="${id}"`);
    }
  });
  it('consumption edge uses filled arrow at target', () => {
    const s = edgeSvg(edge('consumption'), defaultTheme);
    expect(s).toContain('marker-end="url(#arrow-filled)"');
  });
  it('effect edge has arrows on both ends', () => {
    const s = edgeSvg(edge('effect'), defaultTheme);
    expect(s).toContain('marker-start="url(#arrow-filled)"');
    expect(s).toContain('marker-end="url(#arrow-filled)"');
  });
  it('agent edge ends with filled circle', () => {
    expect(edgeSvg(edge('agent'), defaultTheme)).toContain('marker-end="url(#circle-fill)"');
  });
  it('hollow markers use the theme hollowFill token, not a hardcoded white', () => {
    const theme = { ...defaultTheme, hollowFill: '#010203' };
    const d = markerDefs(theme);
    expect(d).not.toContain('fill="#ffffff"');
    expect(d).toContain('fill="#010203"');
  });
});
