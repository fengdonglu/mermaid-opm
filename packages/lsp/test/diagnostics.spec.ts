import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { computeDiagnostics } from '../src/features/diagnostics.js';

const doc = (text: string) => TextDocument.create('file:///m.opl', 'opm', 1, text);

describe('diagnostics', () => {
  it('reports warnings for unrecognized sentences with a range', () => {
    const out = computeDiagnostics(doc('opm\nFoo bar baz.'));
    expect(out.length).toBeGreaterThan(0);
    const d = out[0];
    expect(d.severity).toBe(DiagnosticSeverity.Warning);
    expect(d.range.start.line).toBe(1); // 0-based line 2
    expect(d.range.start.character).toBe(0);
    expect(String(d.message)).toContain('unrecognized-sentence');
  });
  it('returns no diagnostics for a clean model', () => {
    expect(computeDiagnostics(doc('opm\nHandling consumes Order.\nHandling yields Receipt.'))).toEqual([]);
  });
  it('returns no diagnostics when disabled', () => {
    expect(computeDiagnostics(doc('opm\nFoo bar baz.'), false)).toEqual([]);
  });
});
