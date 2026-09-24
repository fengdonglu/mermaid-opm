import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentSymbol, Range } from 'vscode-languageserver';
import { SymbolKind } from 'vscode-languageserver';
import { parseOpl } from 'mermaid-opm';

function range(line1: number, col1: number, length: number): Range {
  const line = Math.max(0, line1 - 1);
  const character = Math.max(0, col1 - 1);
  return { start: { line, character }, end: { line, character: character + Math.max(1, length) } };
}

export function computeSymbols(doc: TextDocument): DocumentSymbol[] {
  const model = parseOpl(doc.getText());
  const symbols: DocumentSymbol[] = [];
  for (const thing of model.things.values()) {
    const at = thing.position ?? { line: 1, column: 1 };
    const children: DocumentSymbol[] = thing.states.map((st) => {
      const p = st.position ?? at;
      const r = range(p.line, p.column, st.name.length);
      return { name: st.name, kind: SymbolKind.EnumMember, range: r, selectionRange: r };
    });
    const r = range(at.line, at.column, thing.name.length);
    symbols.push({ name: thing.name, kind: SymbolKind.Class, range: r, selectionRange: r, children });
  }
  return symbols;
}
