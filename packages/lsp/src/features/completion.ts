import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { CompletionItem } from 'vscode-languageserver';
import { CompletionItemKind } from 'vscode-languageserver';
import { parseOpl } from 'mermaid-opm';

export const KEYWORDS = [
  'is', 'and', 'physical', 'informatical', 'systemic', 'environmental',
  'consists', 'of', 'exhibits', 'an', 'instance', 'can', 'be', 'or',
  'consumes', 'yields', 'affects', 'requires', 'occurs', 'if', 'exists',
  'changes', 'from', 'to', 'handles', 'by', 'initial', 'final',
];

export function computeCompletion(doc: TextDocument): CompletionItem[] {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const kw of KEYWORDS) {
    items.push({ label: kw, kind: CompletionItemKind.Keyword });
    seen.add(kw);
  }
  const model = parseOpl(doc.getText());
  for (const thing of model.things.values()) {
    if (!seen.has(thing.name)) { items.push({ label: thing.name, kind: CompletionItemKind.Class }); seen.add(thing.name); }
    for (const st of thing.states) {
      if (!seen.has(st.name)) { items.push({ label: st.name, kind: CompletionItemKind.EnumMember }); seen.add(st.name); }
    }
  }
  return items;
}
