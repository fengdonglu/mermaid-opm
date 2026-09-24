import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse tagged links and diagnostics', () => {
  it('parses tagged link between declared things', () => {
    const m = p('Driver is physical. Console is physical. Driver communicates via Console.');
    const t = m.links.find((l) => l.kind === 'tagged')!;
    expect(t.tag).toBe('communicates via');
    expect(t.source.thingId).toBe('Driver');
    expect(t.target.thingId).toBe('Console');
  });
  it('warns on unrecognized sentence', () => {
    const m = p('Console is physical.\nFoo bar baz.');
    expect(m.diagnostics.some((d) => d.code === 'unrecognized-sentence')).toBe(true);
    expect(m.diagnostics[0].line).toBe(3);
  });
  it('warns on unknown kind', () => {
    const m = p('Mystery is informatical.');
    expect(m.diagnostics.some((d) => d.code === 'unknown-kind')).toBe(true);
  });
});
