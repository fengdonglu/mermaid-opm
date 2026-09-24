import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeHover } from '../src/features/hover.js';

const doc = (text: string) => TextDocument.create('file:///m.opl', 'opm', 1, text);

describe('hover', () => {
  it('describes a thing (kind + essence + affiliation + states)', () => {
    const text = 'opm\nOrder is physical and environmental.\nOrder can be new or closed.\nOrder consists of Line.';
    const h = computeHover(doc(text), { line: 1, character: 2 }); // "Order" on line 2
    expect(h).not.toBeNull();
    const value = h!.contents && (h!.contents as any).value;
    expect(value).toContain('Order');
    expect(value).toContain('object');
    expect(value).toContain('physical');
    expect(value).toContain('environmental');
    expect(value).toContain('new');
  });
  it('returns null for unknown words', () => {
    expect(computeHover(doc('opm\n'), { line: 0, character: 0 })).toBeNull();
  });
});
