import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse procedural links', () => {
  it('consumes / yields / affects', () => {
    const m = p('Handling consumes Order. Handling yields Receipt. Handling affects Customer.');
    expect(m.links.map((l) => l.kind)).toEqual(['consumption', 'production', 'effect']);
    expect(m.things.get('Handling')!.kind).toBe('process');
    expect(m.things.get('Order')!.kind).toBe('object');
  });
  it('parses passive consumption', () => {
    const m = p('Order is consumed by Handling.');
    expect(m.links[0]).toMatchObject({ kind: 'consumption' });
    expect(m.links[0].source.thingId).toBe('Order');
    expect(m.links[0].target.thingId).toBe('Handling');
  });
  it('orients active consumes and requires as object -> process', () => {
    const c = p('Handling consumes Order.').links[0];
    expect(c.kind).toBe('consumption');
    expect(c.source).toEqual({ thingId: 'Order' });
    expect(c.target).toEqual({ thingId: 'Handling' });

    const r = p('Handling requires System.').links[0];
    expect(r.kind).toBe('instrument');
    expect(r.source).toEqual({ thingId: 'System' });
    expect(r.target).toEqual({ thingId: 'Handling' });
  });
  it('orients active yields and affects as process -> object', () => {
    const y = p('Handling yields Receipt.').links[0];
    expect(y.kind).toBe('production');
    expect(y.source).toEqual({ thingId: 'Handling' });
    expect(y.target).toEqual({ thingId: 'Receipt' });

    const a = p('Handling affects Customer.').links[0];
    expect(a.kind).toBe('effect');
    expect(a.source).toEqual({ thingId: 'Handling' });
    expect(a.target).toEqual({ thingId: 'Customer' });
  });
  it('orients passive yielded as process -> object', () => {
    const y = p('Receipt is yielded by Handling.').links[0];
    expect(y.kind).toBe('production');
    expect(y.source).toEqual({ thingId: 'Handling' });
    expect(y.target).toEqual({ thingId: 'Receipt' });
  });
  it('parses input-output pair', () => {
    const m = p('Handling changes Order from open to closed.');
    expect(m.links.map((l) => l.kind).sort()).toEqual(['consumption', 'production']);
    const c = m.links.find((l) => l.kind === 'consumption')!;
    const pr = m.links.find((l) => l.kind === 'production')!;
    expect(c.source).toEqual({ thingId: 'Order', stateName: 'open' });
    expect(c.target.thingId).toBe('Handling');
    expect(pr.source.thingId).toBe('Handling');
    expect(pr.target).toEqual({ thingId: 'Order', stateName: 'closed' });
  });
  it('parses enabling links', () => {
    const m = p('Clerk handles Handling. Handling requires System. Handling occurs if Approval exists.');
    expect(m.things.get('Clerk')!.kind).toBe('object');
    expect(m.links.map((l) => l.kind)).toEqual(['agent', 'instrument', 'condition']);
  });
  it('parses condition with state', () => {
    const m = p('Handling occurs if Order is paid.');
    const l = m.links[0];
    expect(l.kind).toBe('condition');
    expect(l.source).toEqual({ thingId: 'Order', stateName: 'paid' });
  });
});
