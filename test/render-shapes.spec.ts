import { describe, it, expect } from 'vitest';
import { objectShape, processShape, defaultTheme } from '../src/render/shapes.js';
import type { SceneNode } from '../src/layout/types.js';

const obj: SceneNode = { id: 'Order', thingId: 'Order', kind: 'object', label: 'Order', states: ['open', 'closed'], x: 10, y: 20, width: 140, height: 60 };
const proc: SceneNode = { id: 'P', thingId: 'P', kind: 'process', label: 'P', states: [], x: 0, y: 0, width: 140, height: 44 };
const theme = defaultTheme;

describe('node shapes', () => {
  it('object is a rect with state separators', () => {
    const s = objectShape(obj, theme);
    expect(s).toContain('<rect');
    expect(s.match(/<line/g)?.length).toBe(1); // 2 states -> 1 separator
    expect(s).toContain('open');
    expect(s).toContain('closed');
  });
  it('stateless object renders its name exactly once, centered inside', () => {
    const s = objectShape({ ...obj, states: [] }, theme);
    expect(s.match(/>Order<\/text>/g)?.length).toBe(1);
    expect(s).toContain('<text x="80" y="50" text-anchor="middle" dominant-baseline="middle"');
  });
  it('process is an ellipse', () => {
    expect(processShape(proc, theme)).toContain('<ellipse');
  });
});
