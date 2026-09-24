import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse entities', () => {
  it('parses essence and affiliation', () => {
    const m = p('Driver is physical and environmental.');
    const t = m.things.get('Driver')!;
    expect(t.essence).toBe('physical');
    expect(t.affiliation).toBe('environmental');
  });
  it('defaults to informatical and systemic', () => {
    const t = p('Order is informatical.').things.get('Order')!;
    expect(t.affiliation).toBe('systemic');
  });
  it('parses a named initial state', () => {
    const t = p('Order is initial pending.').things.get('Order')!;
    expect(t.states[0]).toMatchObject({ name: 'pending', initial: true });
  });
  it('parses state list with initial/final markers', () => {
    const t = p('Order is initial pending. Order is final done.').things.get('Order')!;
    expect(t.states.map((s) => s.name)).toEqual(['pending', 'done']);
    expect(t.states[0].initial).toBe(true);
    expect(t.states[1].final).toBe(true);
  });
  it('parses can-be list', () => {
    const t = p('Order can be new, open, or closed.').things.get('Order')!;
    expect(t.states.map((s) => s.name)).toEqual(['new', 'open', 'closed']);
  });
  it('supports multi-word initial state', () => {
    const t = p('Order can be in progress, done. Order is initial in progress.').things.get('Order')!;
    const inProgress = t.states.filter((s) => s.name === 'in progress');
    expect(inProgress).toHaveLength(1);
    expect(inProgress[0].initial).toBe(true);
  });
  it('does not swallow keyword-like entity names (case-sensitive guard)', () => {
    const m = p('Instance is physical. Changes is physical.');
    expect(m.things.get('Instance')!.essence).toBe('physical');
    expect(m.things.get('Changes')!.essence).toBe('physical');
  });
  it('does not swallow an instance-of link as an entity/state declaration', () => {
    const m = p('Order1 is an instance of Order.');
    expect(m.things.get('Order1')!.states).toEqual([]);
    expect(m.things.get('Order')!.states).toEqual([]);
    expect(m.links.some((l) => l.kind === 'classification')).toBe(true);
  });
});
