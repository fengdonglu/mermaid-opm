import { describe, it, expect } from 'vitest';
import { parseOpl, renderModel } from '../src/index.js';

describe('source positions', () => {
  it('records the declaration position of things, states, and links', () => {
    const src = 'opm\nOrder is physical.\nOrder can be new or closed.\nHandling consumes Order.';
    const m = parseOpl(src);
    expect(m.things.get('Order')!.position).toEqual({ line: 2, column: 1 });
    expect(m.things.get('Order')!.states[0].position).toEqual({ line: 3, column: 1 });
    const link = m.links.find((l) => l.kind === 'consumption')!;
    expect(link.position).toEqual({ line: 4, column: 1 });
  });

  it('positions reserved-name and unknown-kind diagnostics at the thing declaration', () => {
    // "to" is a reserved word used as a name, so it exercises reserved-name; "A" only declared -> unknown-kind.
    const m = renderModel('opm\nto is physical.\nA is informatical.');
    const reserved = m.diagnostics.find((d) => d.code === 'reserved-name');
    expect(reserved?.line).toBe(2);
    const unknown = m.diagnostics.find((d) => d.code === 'unknown-kind' && d.message.includes('A'));
    expect(unknown?.line).toBe(3);
  });
});
