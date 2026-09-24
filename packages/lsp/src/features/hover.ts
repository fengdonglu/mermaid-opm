import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Hover } from 'vscode-languageserver';
import { parseOpl } from 'mermaid-opm';

function wordAt(doc: TextDocument, line: number, character: number): string {
  const text = doc.getText().split(/\r?\n/)[line] ?? '';
  let start = character;
  let end = character;
  while (start > 0 && /[^\s.]/.test(text[start - 1])) start--;
  while (end < text.length && /[^\s.]/.test(text[end])) end++;
  return text.slice(start, end).trim();
}

export function computeHover(doc: TextDocument, position: { line: number; character: number }): Hover | null {
  const word = wordAt(doc, position.line, position.character);
  if (!word) return null;
  const model = parseOpl(doc.getText());
  const thing = model.things.get(word);
  if (!thing) return null;
  const lines = [`**${thing.name}**`, `kind: ${thing.kind}`, `essence: ${thing.essence}`, `affiliation: ${thing.affiliation}`];
  if (thing.states.length) lines.push(`states: ${thing.states.map((s) => s.name).join(', ')}`);
  return { contents: { kind: 'markdown', value: lines.join('\n\n') } };
}
