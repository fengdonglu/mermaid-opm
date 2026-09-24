import { describe, it, expect } from 'vitest';
import { splitSentences } from '../src/core/opl/tokenize.js';

describe('splitSentences', () => {
  it('splits on periods and records positions', () => {
    const s = splitSentences('opm\nOrder is physical.\nHandling consumes Order.');
    expect(s.map((x) => x.text)).toEqual(['Order is physical.', 'Handling consumes Order.']);
    expect(s[0].line).toBe(2);
    expect(s[1].line).toBe(3);
    expect(s[0].column).toBe(1);
    expect(s[1].column).toBe(1);
  });
  it('strips // comments', () => {
    const s = splitSentences('opm\nOrder is physical. // trailing\nHandling consumes Order.');
    expect(s[0].text).toBe('Order is physical.');
  });
  it('ignores the opm header and blank lines', () => {
    const s = splitSentences('opm\n\n');
    expect(s).toEqual([]);
  });
  it('splits multiple sentences on one line', () => {
    const s = splitSentences('opm\nA is x. B is y.');
    expect(s.map((x) => x.text)).toEqual(['A is x.', 'B is y.']);
    expect(s[0].line).toBe(2);
    expect(s[1].line).toBe(2);
    expect(s[0].column).toBe(1);
    expect(s[1].column).toBe(9);
  });
  it('records the column of a sentence after leading spaces', () => {
    const s = splitSentences('opm\n   A is x.');
    expect(s.map((x) => x.text)).toEqual(['A is x.']);
    expect(s[0].line).toBe(2);
    expect(s[0].column).toBe(4);
  });
});
