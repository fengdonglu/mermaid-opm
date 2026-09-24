import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse structural links', () => {
  it('parses aggregation with list', () => {
    const m = p('OnStar System consists of Console, VCIM, and GPS.');
    const agg = m.links.filter((l) => l.kind === 'aggregation');
    expect(agg).toHaveLength(3);
    expect(agg[0].source.thingId).toBe('OnStar System');
    expect(agg.map((l) => l.target.thingId)).toEqual(['Console', 'VCIM', 'GPS']);
  });
  it('parses exhibition', () => {
    const m = p('Order exhibits Status.');
    expect(m.links[0]).toMatchObject({ kind: 'exhibition' });
  });
  it('parses generalization', () => {
    const m = p('SpecialOrder is a Order.');
    expect(m.links[0]).toMatchObject({ kind: 'generalization' });
    expect(m.links[0].target.thingId).toBe('Order');
  });
  it('parses classification', () => {
    const m = p('Order1 is an instance of Order.');
    expect(m.links[0]).toMatchObject({ kind: 'classification' });
  });
});
