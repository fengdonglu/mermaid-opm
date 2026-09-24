import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolKind } from 'vscode-languageserver';
import { computeSymbols } from '../src/features/symbols.js';

const doc = (text: string) => TextDocument.create('file:///m.opl', 'opm', 1, text);

describe('document symbols', () => {
  it('lists things and their states with ranges', () => {
    const out = computeSymbols(doc('opm\nOrder is physical.\nOrder can be new or closed.\nHandling consumes Order.'));
    const order = out.find((s) => s.name === 'Order')!;
    expect(order).toBeTruthy();
    expect(order.range.start.line).toBe(1); // 0-based line 2
    expect(order.children?.map((c) => c.name)).toEqual(['new', 'closed']);
    const handling = out.find((s) => s.name === 'Handling')!;
    expect(handling.kind).toBe(SymbolKind.Class);
  });
});
