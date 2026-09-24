import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';
import { emptyModel } from '../src/core/model/types.js';
import { layout } from '../src/layout/index.js';

describe('layout', () => {
  it('produces a node per thing and no overlapping nodes', () => {
    const m = parseOpl('opm\nHandling consumes Order.\nHandling yields Receipt.');
    const s = layout(m);
    expect(s.nodes.map((n) => n.thingId).sort()).toEqual(['Handling', 'Order', 'Receipt']);
    for (let i = 0; i < s.nodes.length; i++) {
      for (let j = i + 1; j < s.nodes.length; j++) {
        const a = s.nodes[i], b = s.nodes[j];
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${a.thingId} overlaps ${b.thingId}`).toBe(false);
      }
    }
  });
  it('emits one edge per link with points', () => {
    const m = parseOpl('opm\nHandling consumes Order.');
    const s = layout(m);
    expect(s.edges).toHaveLength(1);
    expect(s.edges[0].points.length).toBeGreaterThanOrEqual(2);
  });
  it('returns finite dimensions when there are no layoutable nodes', () => {
    for (const m of [emptyModel(), parseOpl('opm\nA is physical.')]) {
      const s = layout(m);
      expect(s.nodes).toHaveLength(0);
      expect(Number.isFinite(s.width) && s.width >= 0, `width=${s.width}`).toBe(true);
      expect(Number.isFinite(s.height) && s.height >= 0, `height=${s.height}`).toBe(true);
    }
  });
});
