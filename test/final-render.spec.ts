import { describe, it, expect } from 'vitest';
import { renderSvg, renderModel } from '../src/index.js';
import { layout } from '../src/layout/index.js';
import { anchorEdge } from '../src/render/sceneToSvg.js';

const CHANGE = 'opm\nHandling changes Order from open to closed.';

const near = (a: number, b: number) => Math.abs(a - b) < 0.01;

describe('state-qualified edge anchoring', () => {
  it('anchors consumption/production terminals to their state rows', () => {
    const scene = layout(renderModel(CHANGE));
    const order = scene.nodes.find((n) => n.thingId === 'Order')!;
    const rowH = order.height / order.states.length;
    const yOpen = order.y + rowH * (order.states.indexOf('open') + 0.5);
    const yClosed = order.y + rowH * (order.states.indexOf('closed') + 0.5);
    expect(near(yOpen, yClosed)).toBe(false);

    const anchored = scene.edges.map((e) => {
      const copy = { ...e, points: e.points.map((p) => ({ ...p })) };
      anchorEdge(copy, scene.nodes, 'source');
      anchorEdge(copy, scene.nodes, 'target');
      return copy;
    });
    const consumption = anchored.find((e) => e.kind === 'consumption')!;
    const production = anchored.find((e) => e.kind === 'production')!;
    expect(near(consumption.points[0].y, yOpen)).toBe(true);
    expect(near(production.points[production.points.length - 1].y, yClosed)).toBe(true);
  });

  it('does not mutate the caller scene points', () => {
    const scene = layout(renderModel(CHANGE));
    const before = scene.edges.map((e) => e.points.map((p) => `${p.x},${p.y}`).join(' '));
    renderSvg(CHANGE);
    const after = scene.edges.map((e) => e.points.map((p) => `${p.x},${p.y}`).join(' '));
    expect(after).toEqual(before);
  });

  it('renders the two Order terminals at different y matching the state rows', () => {
    const scene = layout(renderModel(CHANGE));
    const order = scene.nodes.find((n) => n.thingId === 'Order')!;
    const rowH = order.height / order.states.length;
    const expected = [0, 1].map((i) => order.y + rowH * (i + 0.5));

    const svg = renderSvg(CHANGE);
    const ys: number[] = [];
    for (const m of svg.matchAll(/<polyline points="([^"]+)"/g)) {
      for (const pair of m[1].split(' ')) {
        const [x, y] = pair.split(',').map(Number);
        if (near(x, order.x) || near(x, order.x + order.width)) ys.push(y);
      }
    }
    for (const y of expected) {
      expect(ys.some((v) => near(v, y)), `expected y=${y} among ${ys.join(',')}`).toBe(true);
    }
  });
});

describe('tagged edge label', () => {
  it('renders the tag text on a tagged edge', () => {
    const svg = renderSvg(
      'opm\nHandling consumes Driver.\nHandling consumes Console.\nDriver communicates via Console.'
    );
    expect(svg).toContain('communicates via');
  });
});
