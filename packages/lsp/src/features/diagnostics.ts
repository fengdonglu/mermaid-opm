import type { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { renderModel } from 'mermaid-opm';

function range(line1: number, col1: number, length: number): Range {
  const line = Math.max(0, line1 - 1);
  const character = Math.max(0, col1 - 1);
  return { start: { line, character }, end: { line, character: character + Math.max(1, length) } };
}

export function computeDiagnostics(doc: TextDocument, enabled = true): Diagnostic[] {
  if (!enabled) return [];
  const model = renderModel(doc.getText());
  return model.diagnostics.map((d) => ({
    severity: d.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    code: d.code,
    source: 'mermaid-opm',
    message: `${d.code} ${d.message}`.trim(),
    range: range(d.line, d.column, 1),
  }));
}
