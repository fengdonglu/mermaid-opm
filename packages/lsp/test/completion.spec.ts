import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeCompletion, KEYWORDS } from '../src/features/completion.js';

const doc = (text: string) => TextDocument.create('file:///m.opl', 'opm', 1, text);

describe('completion', () => {
  it('offers keywords', () => {
    const labels = computeCompletion(doc('opm\n')).map((c) => c.label);
    expect(labels).toContain('consumes');
    expect(labels).toContain('physical');
  });
  it('offers declared thing and state names', () => {
    const labels = computeCompletion(doc('opm\nHandling consumes Order.\nOrder is paid.')).map((c) => c.label);
    expect(labels).toContain('Handling');
    expect(labels).toContain('Order');
    expect(labels).toContain('paid');
  });
  it('KEYWORDS is non-empty', () => {
    expect(KEYWORDS.length).toBeGreaterThan(5);
  });
});
