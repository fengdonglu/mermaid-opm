import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';
import { validate } from '../src/core/model/validate.js';

describe('validate', () => {
  it('flags a process with no input/output', () => {
    const m = parseOpl('opm\nHandle handles Order.');
    validate(m);
    expect(m.diagnostics.some((d) => d.code === 'process-no-io' && d.severity === 'warning')).toBe(true);
  });
  it('does not flag a connected process', () => {
    const m = parseOpl('opm\nHandling consumes Order.\nHandling yields Receipt.');
    validate(m);
    expect(m.diagnostics.some((d) => d.code === 'process-no-io')).toBe(false);
  });
});
