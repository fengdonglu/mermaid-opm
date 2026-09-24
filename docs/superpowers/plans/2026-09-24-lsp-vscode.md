# lsp-vscode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable OPL Language Server (`mermaid-opm-lsp`) and a lightweight VS Code extension (`mermaid-opm-vscode`) providing syntax highlighting, live diagnostics, completion, hover, and document outline for `.opl` files.

**Architecture:** Convert the repo to npm workspaces (root = core library). Additively record source positions in the core parser/model and export `parseOpl`. The LSP package implements four capabilities as pure functions over an in-memory `TextDocument`, wired to a stdio server. The VS Code extension contains a TextMate grammar, a `vscode-languageclient` client that launches the bundled server, and `Open Preview` / `Export SVG` commands that use the core `renderSvg`.

**Tech Stack:** TypeScript ESM, npm workspaces, `vscode-languageserver` + `vscode-languageserver-textdocument`, `vscode-languageclient`, esbuild, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-lsp-vscode-design.md`

## Global Constraints

- New code, comments, and English docs are in **English** (Chinese only in `*.zh.md`).
- Core changes are **backward compatible** (new optional fields only); the existing root test suite must stay green.
- Never invent OPL syntax or LSP capabilities.
- LSP feature logic lives in pure functions (`(doc, params) => result`) so it is unit-testable without a live editor connection.
- `packages/lsp` and `packages/vscode-opm` resolve `mermaid-opm` to the **core source** in dev/test via an alias (`../../src/index.ts`), so tests do not require a root build; production bundles inline the core.
- License MIT, holder `fengdonglu`.

---

### Task 1: Core source positions + public `parseOpl`

**Files:**
- Modify: `src/core/model/types.ts`
- Modify: `src/core/opl/parse.ts`
- Modify: `src/core/model/validate.ts`
- Modify: `src/index.ts`
- Test: `test/positions.spec.ts`

**Interfaces:**
- Produces: `export interface Position { line: number; column: number }`; optional `position?: Position` on `Thing`, `State`, `Link`; `parseOpl` exported from `mermaid-opm`.

- [ ] **Step 1: Write the failing test**

`test/positions.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/index.js';

describe('source positions', () => {
  it('records the declaration position of things, states, and links', () => {
    const src = 'opm\nOrder is physical.\nOrder can be new or closed.\nHandling consumes Order.';
    const m = parseOpl(src);
    expect(m.things.get('Order')!.position).toEqual({ line: 2, column: 1 });
    expect(m.things.get('Order')!.states[0].position).toEqual({ line: 3, column: 1 });
    const link = m.links.find((l) => l.kind === 'consumption')!;
    expect(link.position).toEqual({ line: 4, column: 1 });
  });

  it('positions reserved-name and unknown-kind diagnostics at the thing declaration', () => {
    // "to" is a reserved word used as a name, so it exercises reserved-name; "A" only declared -> unknown-kind.
    const m = parseOpl('opm\nto is physical.\nA is informatical.');
    const reserved = m.diagnostics.find((d) => d.code === 'reserved-name');
    expect(reserved?.line).toBe(2);
    const unknown = m.diagnostics.find((d) => d.code === 'unknown-kind' && d.message.includes('A'));
    expect(unknown?.line).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/positions.spec.ts`
Expected: FAIL — `position`/`parseOpl` not present.

- [ ] **Step 3: Implement**

In `src/core/model/types.ts` add:
```ts
export interface Position { line: number; column: number }
```
Add `position?: Position;` to `Thing`, `State`, and `Link`.

In `src/core/opl/parse.ts`:
- Change `ensureThing(model, rawName)` → `ensureThing(model, rawName, position?: Position)`. When creating a new `Thing`, set `position`. Keep all callers working by passing the current sentence position.
- Thread the sentence position through the parsers: change `parseEntitySentence`, `parseStructuralSentence`, `parseProceduralSentence`, `parseTaggedSentence` to accept a trailing `position: Position` and pass it to `ensureThing` and to `addLink`/`addLinkEndpoints` (which set `link.position`).
- In `parseOpl`, call each parser with `{ line: sentence.line, column: sentence.column }`.
- `parseEntitySentence` state creation: set the new `State`'s `position` to the sentence position.

In `src/core/model/validate.ts`:
- `reserved-name`: use `thing.position ?? { line: 1, column: 1 }`.
- `unknown-kind`: use `thing.position ?? { line: 1, column: 1 }`.
- `process-no-io`: use `thing.position ?? { line: 1, column: 1 }`.
- `unknown-reference`: use `link.position ?? { line: 1, column: 1 }`.

In `src/index.ts` add:
```ts
export { parseOpl } from './core/opl/parse.js';
export type { ParseOptions } from './core/opl/parse.js';
export type { Diagnostic, Severity } from './core/opl/diagnostics.js';
export type { Position } from './core/model/types.js';
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/positions.spec.ts && npm test && npm run typecheck`
Expected: PASS; existing suite green.

- [ ] **Step 5: Commit**

```bash
git add src test/positions.spec.ts
git commit -m "feat: record source positions; export parseOpl"
```

---

### Task 2: npm workspaces scaffolding + CI

**Files:**
- Modify: `package.json` (root)
- Create: `packages/lsp/package.json`, `packages/lsp/tsconfig.json`, `packages/lsp/build.mjs`, `packages/lsp/vitest.config.ts`
- Create: `packages/vscode-opm/package.json`, `packages/vscode-opm/tsconfig.json`, `packages/vscode-opm/build.mjs`, `packages/vscode-opm/vitest.config.ts`
- Modify: `test/conventions.spec.ts` (scan `packages`)
- Modify: `.github/workflows/ci.yml`
- Test: `test/workspaces.spec.ts`

**Interfaces:**
- Produces: workspace packages `mermaid-opm-lsp` and `mermaid-opm-vscode` resolvable by npm; LSP and extension `mermaid-opm` alias to core source.

- [ ] **Step 1: Write the failing test**

`test/workspaces.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

describe('workspaces', () => {
  it('root declares packages/* workspaces', () => {
    expect(read('package.json').workspaces).toContain('packages/*');
  });
  it('defines the lsp and vscode packages', () => {
    expect(read('packages/lsp/package.json').name).toBe('mermaid-opm-lsp');
    expect(read('packages/vscode-opm/package.json').name).toBe('mermaid-opm-vscode');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/workspaces.spec.ts`
Expected: FAIL — no `workspaces`/packages.

- [ ] **Step 3: Implement**

Root `package.json`: add `"workspaces": ["packages/*"]` (keep everything else; do NOT change `files`).

`packages/lsp/package.json`:
```json
{
  "name": "mermaid-opm-lsp",
  "version": "0.1.0",
  "description": "Language Server for OPL (ISO 19450) used by mermaid-opm",
  "type": "module",
  "license": "MIT",
  "bin": { "opm-lsp": "./dist/server.js" },
  "main": "./dist/server.js",
  "files": ["dist"],
  "scripts": { "build": "tsc -p tsconfig.json --noEmit && node build.mjs", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": {},
  "devDependencies": {
    "mermaid-opm": "file:../..",
    "vscode-languageserver": "^9.0.1",
    "vscode-languageserver-textdocument": "^1.0.12",
    "esbuild": "^0.24.0", "typescript": "^5.6.0", "vitest": "^2.1.0", "@types/node": "^22.0.0"
  }
}
```
> All runtime deps are bundled into `dist/server.js` by `build.mjs`, so they belong in `devDependencies`; `mermaid-opm` must NOT be a published dependency (`file:../..` would break installs).

`packages/vscode-opm/package.json`:
```json
{
  "name": "mermaid-opm-vscode",
  "version": "0.1.0",
  "description": "VS Code support for OPL (ISO 19450) — syntax highlighting, diagnostics, preview",
  "type": "module",
  "license": "MIT",
  "engines": { "vscode": "^1.94.0" },
  "categories": ["Programming Languages", "Visualization"],
  "main": "./dist/extension.js",
  "activationEvents": ["onLanguage:opm"],
  "contributes": {
    "languages": [{ "id": "opm", "aliases": ["OPL"], "extensions": [".opl"] }],
    "grammars": [{ "language": "opm", "scopeName": "source.opl", "path": "./syntaxes/opl.tmLanguage.json" }],
    "commands": [
      { "command": "opm.preview", "title": "OPM: Open Preview" },
      { "command": "opm.exportSvg", "title": "OPM: Export SVG" }
    ],
    "configuration": {
      "title": "mermaid-opm",
      "properties": { "opm.diagnostics.enable": { "type": "boolean", "default": true, "description": "Enable OPL diagnostics." } }
    }
  },
  "scripts": { "build": "tsc --noEmit && node build.mjs", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": {},
  "devDependencies": {
    "mermaid-opm": "file:../..",
    "vscode-languageclient": "^9.0.1",
    "esbuild": "^0.24.0", "typescript": "^5.6.0", "vitest": "^2.1.0", "@types/node": "^22.0.0", "@types/vscode": "^1.94.0"
  }
}
```
> `vscode-languageclient` and `mermaid-opm` are bundled into `dist/extension.js`/`dist/server.js`; `vscode` is external (provided by the host). So they belong in `devDependencies`.

`packages/lsp/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
    "strict": true, "skipLibCheck": true, "esModuleInterop": true, "noEmit": true,
    "baseUrl": ".", "paths": { "mermaid-opm": ["../../src/index.ts"] },
    "types": ["node"]
  },
  "include": ["src"]
}
```
`packages/vscode-opm/tsconfig.json`: same, but `"types": ["node", "vscode"]`.

`packages/lsp/vitest.config.ts` (alias core source so tests need no root build):
```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { 'mermaid-opm': fileURLToPath(new URL('../../src/index.ts', import.meta.url)) } },
  test: { environment: 'node', include: ['test/**/*.spec.ts'] },
});
```
`packages/vscode-opm/vitest.config.ts`: same alias, `include: ['test/**/*.spec.ts']`.

`packages/lsp/build.mjs` (bundle server + core to a single Node ESM file):
```js
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
await build({
  entryPoints: ['src/server.ts'],
  bundle: true, format: 'esm', platform: 'node',
  outfile: 'dist/server.js',
  alias: { 'mermaid-opm': fileURLToPath(new URL('../../src/index.ts', import.meta.url)) },
  // createRequire banner is REQUIRED: bundled CJS deps (vscode-languageserver) call
  // require('node:...') at runtime, which esbuild's ESM `__require` shim cannot do.
  banner: { js: '#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
```
`packages/vscode-opm/build.mjs` (two explicit builds so output paths are exactly `dist/extension.js` and `dist/server.js`; `vscode` is external):
```js
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const core = fileURLToPath(new URL('../../src/index.ts', import.meta.url));
const alias = { 'mermaid-opm': core };
const cjsShim = { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' };
await build({
  entryPoints: ['src/extension.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: 'dist/extension.js',
  external: ['vscode'], alias, banner: cjsShim,
});
await build({
  entryPoints: ['../lsp/src/server.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: 'dist/server.js',
  external: ['vscode'], alias, banner: cjsShim,
});
```

`test/conventions.spec.ts`: add `'packages'` to the scanned directories array (`['src', 'test', 'scripts', 'demo', 'packages']`).

`.github/workflows/ci.yml`: after `npm ci`: `npm run build` (root), then `npm run build --workspaces --if-present` (so built bundles exist for smoke tests), then `npm test` (root) and `npm test --workspaces --if-present`. Build MUST precede workspace tests because the LSP smoke test spawns the built `dist/server.js`.

- [ ] **Step 4: Install and verify**

Run:
```bash
npm install
npx vitest run test/workspaces.spec.ts
npm test
```
Expected: workspaces linked; root suite green. (LSP/extension packages have no source yet; their `test` scripts will be added in later tasks — `--if-present` tolerates missing scripts.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json packages test/conventions.spec.ts test/workspaces.spec.ts .github/workflows/ci.yml
git commit -m "chore: convert to npm workspaces; scaffold lsp and vscode packages"
```

---

### Task 3: LSP — server skeleton + diagnostics feature

**Files:**
- Create: `packages/lsp/src/features/diagnostics.ts`
- Create: `packages/lsp/src/server.ts`
- Test: `packages/lsp/test/diagnostics.spec.ts`

**Interfaces:**
- Produces: `computeDiagnostics(doc: TextDocument): Diagnostic[]` (LSP types). `convertPosition` helper (1-based → 0-based).
- Consumes: `parseOpl`/model types via the `mermaid-opm` alias.

- [ ] **Step 1: Write the failing test**

`packages/lsp/test/diagnostics.spec.ts`:
```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w mermaid-opm-lsp -- diagnostics` (or `npx vitest run test/diagnostics.spec.ts` from `packages/lsp`)
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`packages/lsp/src/features/diagnostics.ts`:
```ts
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { renderModel } from 'mermaid-opm';

function range(line1: number, col1: number, length: number): Range {
  const line = Math.max(0, line1 - 1);
  const character = Math.max(0, col1 - 1);
  return { start: { line, character }, end: { line, character: character + Math.max(1, length) } };
}

export function computeDiagnostics(doc: TextDocument): Diagnostic[] {
  const model = renderModel(doc.getText());
  return model.diagnostics.map((d) => ({
    severity: d.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    code: d.code,
    source: 'mermaid-opm',
    message: `${d.code} ${d.message}`.trim(),
    range: range(d.line, d.column, 1),
  }));
}
```

`packages/lsp/src/server.ts` (no shebang here — `build.mjs` adds the banner shebang):
```ts
import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeDiagnostics } from './features/diagnostics.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

documents.onDidChangeContent((change) => {
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: computeDiagnostics(change.document) });
});

connection.onInitialize(() => ({ capabilities: { textDocumentSync: 1 } }));

documents.listen(connection);
connection.listen();
```

- [ ] **Step 4: Run tests**

Run: from `packages/lsp`: `npx vitest run`; then `npm run build -w mermaid-opm-lsp` (produces `dist/server.js`).
Expected: PASS; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/lsp
git commit -m "feat(lsp): diagnostics feature and stdio server"
```

---

### Task 4: LSP — completion feature

**Files:**
- Create: `packages/lsp/src/features/completion.ts`
- Modify: `packages/lsp/src/server.ts`
- Test: `packages/lsp/test/completion.spec.ts`

**Interfaces:**
- Produces: `computeCompletion(doc: TextDocument): CompletionItem[]`.
- Consumes: `parseOpl` for declared names; `RESERVED` keywords list is duplicated as an exported constant `KEYWORDS` in this file (do not import from core internals).

- [ ] **Step 1: Write the failing test**

`packages/lsp/test/completion.spec.ts`:
```ts
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
```

- [ ] **Step 2–4: RED → implement → GREEN**

`packages/lsp/src/features/completion.ts`:
```ts
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';
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
```
In `server.ts` add:
```ts
connection.onCompletion((p) => computeCompletion(documents.get(p.textDocument.uri)!));
connection.onCompletionResolve((item) => item);
```
And declare the capability in `onInitialize`:
```ts
capabilities: { textDocumentSync: 1, completionProvider: { resolveProvider: false, triggerCharacters: [' ', '.'] } }
```
Run from `packages/lsp`: `npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/lsp
git commit -m "feat(lsp): completion for keywords and declared names"
```

---

### Task 5: LSP — hover feature

**Files:**
- Create: `packages/lsp/src/features/hover.ts`
- Modify: `packages/lsp/src/server.ts`
- Test: `packages/lsp/test/hover.spec.ts`

**Interfaces:**
- Produces: `computeHover(doc: TextDocument, position: { line: number; character: number }): Hover | null` (position is 0-based LSP).
- Consumes: `parseOpl`; the word under the cursor is extracted from the document line.

- [ ] **Step 1: Write the failing test**

`packages/lsp/test/hover.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeHover } from '../src/features/hover.js';

const doc = (text: string) => TextDocument.create('file:///m.opl', 'opm', 1, text);

describe('hover', () => {
  it('describes a thing (kind + essence + affiliation + states)', () => {
    const text = 'opm\nOrder is physical and environmental.\nOrder can be new or closed.';
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
```

- [ ] **Step 2–4: RED → implement → GREEN**

`packages/lsp/src/features/hover.ts`:
```ts
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { Hover } from 'vscode-languageserver';
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
```
In `server.ts` add:
```ts
connection.onHover((p) => computeHover(documents.get(p.textDocument.uri)!, p.position));
```
and capability `hoverProvider: true`.
Run from `packages/lsp`: `npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/lsp
git commit -m "feat(lsp): hover for things and states"
```

---

### Task 6: LSP — document symbols (outline)

**Files:**
- Create: `packages/lsp/src/features/symbols.ts`
- Modify: `packages/lsp/src/server.ts`
- Test: `packages/lsp/test/symbols.spec.ts`

**Interfaces:**
- Produces: `computeSymbols(doc: TextDocument): DocumentSymbol[]`.
- Consumes: `parseOpl`; positions (Task 1) for ranges.

- [ ] **Step 1: Write the failing test**

`packages/lsp/test/symbols.spec.ts`:
```ts
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
```

- [ ] **Step 2–4: RED → implement → GREEN**

`packages/lsp/src/features/symbols.ts`:
```ts
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentSymbol, SymbolKind, Range } from 'vscode-languageserver';
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
```
In `server.ts` add `connection.onDocumentSymbol((p) => computeSymbols(documents.get(p.textDocument.uri)!));` and capability `documentSymbolProvider: true`.
Run from `packages/lsp`: `npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/lsp
git commit -m "feat(lsp): document symbols outline"
```

---

### Task 7: VS Code — contributions + TextMate grammar

**Files:**
- Create: `packages/vscode-opm/syntaxes/opl.tmLanguage.json`
- Test: `packages/vscode-opm/test/contributions.spec.ts`

**Interfaces:**
- Produces: contributed language `opm` for `.opl`, a `source.opl` grammar, and the two commands (already declared in Task 2's package.json).

- [ ] **Step 1: Write the failing test**

`packages/vscode-opm/test/contributions.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(join(here, '..', p), 'utf8'));

describe('extension contributions', () => {
  it('registers the opm language for .opl', () => {
    const c = readJson('package.json').contributes;
    expect(c.languages[0].id).toBe('opm');
    expect(c.languages[0].extensions).toContain('.opl');
    expect(c.commands.map((x: any) => x.command)).toEqual(['opm.preview', 'opm.exportSvg']);
  });
  it('ships a parseable TextMate grammar', () => {
    const g = readJson('syntaxes/opl.tmLanguage.json');
    expect(g.scopeName).toBe('source.opl');
    expect(Array.isArray(g.patterns)).toBe(true);
    expect(g.patterns.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: from `packages/vscode-opm`: `npx vitest run test/contributions.spec.ts`
Expected: FAIL — grammar missing.

- [ ] **Step 3: Implement the grammar**

`packages/vscode-opm/syntaxes/opl.tmLanguage.json` (conservative regex highlighting):
```json
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "OPL",
  "scopeName": "source.opl",
  "patterns": [
    { "match": "//.*$", "name": "comment.line.double-slash.opl" },
    { "match": "^\\s*opm\\s*$", "name": "keyword.control.header.opl" },
    { "match": "\\b(is|and|can|be|or|by|of|if|from|to|an|initial|final)\\b", "name": "keyword.operator.opl" },
    { "match": "\\b(physical|informatical|systemic|environmental)\\b", "name": "storage.modifier.opl" },
    { "match": "\\b(consumes|yields|affects|requires|occurs|exists|changes|handles|consists|exhibits|instance)\\b", "name": "keyword.other.link.opl" }
  ]
}
```

- [ ] **Step 4: Run tests**

Run: from `packages/vscode-opm`: `npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/vscode-opm
git commit -m "feat(vscode): language contribution and TextMate grammar"
```

---

### Task 8: VS Code — language client + preview + export commands

**Files:**
- Create: `packages/vscode-opm/src/extension.ts`
- Test: `packages/vscode-opm/test/commands.spec.ts`

**Interfaces:**
- Produces: an activated extension that starts the language client and registers `opm.preview`/`opm.exportSvg`.
- Consumes: `renderSvg` from `mermaid-opm`; the bundled server at `dist/server.js`.

- [ ] **Step 1: Write the failing test (static — `vscode` is not importable in tests)**

`packages/vscode-opm/test/commands.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('extension entry', () => {
  it('registers commands and launches the language client, and bundles a server', () => {
    const src = readFileSync(join(here, '..', 'src', 'extension.ts'), 'utf8');
    expect(src).toContain('opm.preview');
    expect(src).toContain('opm.exportSvg');
    expect(src).toContain('LanguageClient');
    expect(src).toContain('server.js');
    expect(readFileSync(join(here, '..', 'package.json'), 'utf8')).toContain('dist/extension.js');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: from `packages/vscode-opm`: `npx vitest run test/commands.spec.ts` → FAIL.

- [ ] **Step 3: Implement**

`packages/vscode-opm/src/extension.ts`:
```ts
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node.js';
import { renderSvg } from 'mermaid-opm';

let client: LanguageClient | undefined;
let panel: vscode.WebviewPanel | undefined;

function currentOpl(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === 'opm') return editor.document.getText();
  return undefined;
}

function previewHtml(source: string): string {
  let body: string;
  try { body = renderSvg(source); } catch (e) { body = `<pre>${String((e as Error).message)}</pre>`; }
  return `<!doctype html><html><body style="margin:0;padding:12px">${body}</body></html>`;
}

export function activate(context: vscode.ExtensionContext): void {
  const serverModule = context.asAbsolutePath('dist/server.js');
  const serverOptions: ServerOptions = { run: { module: serverModule, transport: TransportKind.stdio }, debug: { module: serverModule, transport: TransportKind.stdio } };
  client = new LanguageClient('mermaid-opm', 'OPL Language Server', serverOptions, { documentSelector: [{ language: 'opm' }] } as LanguageClientOptions);
  client.start();

  context.subscriptions.push(vscode.commands.registerCommand('opm.preview', () => {
    const source = currentOpl();
    if (source === undefined) { vscode.window.showInformationMessage('Open an .opl file first.'); return; }
    if (!panel) {
      panel = vscode.window.createWebviewPanel('opmPreview', 'OPD Preview', vscode.ViewColumn.Beside, {});
      panel.onDidDispose(() => { panel = undefined; });
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (panel && e.document.languageId === 'opm') panel.webview.html = previewHtml(e.document.getText());
      });
    }
    panel.webview.html = previewHtml(source);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('opm.exportSvg', async () => {
    const source = currentOpl();
    if (source === undefined) { vscode.window.showInformationMessage('Open an .opl file first.'); return; }
    const target = await vscode.window.showSaveDialog({ filters: { SVG: ['svg'] } });
    if (!target) return;
    await vscode.workspace.fs.writeFile(target, Buffer.from(renderSvg(source), 'utf8'));
    vscode.window.showInformationMessage(`Exported ${target.fsPath}`);
  }));
}

export async function deactivate(): Promise<void> {
  if (client) await client.stop();
}
```

- [ ] **Step 4: Run tests and build**

Run from `packages/vscode-opm`: `npx vitest run`; then `npm run build -w mermaid-opm-vscode` (produces `dist/extension.js` and `dist/server.js`).
Expected: PASS; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/vscode-opm
git commit -m "feat(vscode): language client, preview and export commands"
```

---

### Task 9: Docs + CI + final verification

**Files:**
- Create: `docs/usage/vscode.md`, `docs/usage/vscode.zh.md`
- Modify: `docs/usage/editor-integration.md`(+`.zh.md`), `README.md`, `README.zh.md`, `CHANGELOG.md`, `docs/index.md`(+`.zh.md`)
- Modify: `.github/workflows/ci.yml` (ensure workspace build/test steps)

- [ ] **Step 1: Write the docs**

- `docs/usage/vscode.md` (+ zh) with language header lines: install (VSIX / marketplace placeholder), what the extension provides (highlighting, diagnostics, completion, hover, outline), the two commands, and a note that go-to-definition/formatting are not yet included. Mirror into `.zh.md`.
- Update `editor-integration.md`(+zh): replace "no LSP" with "an LSP and VS Code extension are available" and link to `vscode.md`; keep the CLI-on-save and library-API paths as alternatives.
- `README.md`/`README.zh.md`: add an "Editor (VS Code)" subsection linking `docs/usage/vscode.md`.
- `docs/index.md`/`index.zh.md`: add the vscode doc to the usage list (zh links to `.zh.md`).
- `CHANGELOG.md`: add an `## [Unreleased]` entry for the LSP + VS Code extension.
- CI: ensure the workflow runs `npm run build`, `npm test`, and `npm test --workspaces --if-present`.

- [ ] **Step 2: Final verification**

Run, from repo root:
```bash
npm run typecheck
npm test
npm run build
npm test --workspaces --if-present
npm run build --workspaces --if-present
npx vitest run test/docs.spec.ts test/docs-links.spec.ts test/samples.spec.ts test/conventions.spec.ts
```
Expected: all pass; docs code blocks still zero-diagnostic; zh links valid; no CJK in code.

- [ ] **Step 3: Commit**

```bash
git add docs README.md README.zh.md CHANGELOG.md .github
git commit -m "docs: document VS Code extension and LSP; update CI"
```

---

## Self-Review

**Spec coverage (§ → task):** workspaces §3 → Task 2; core positions §4 → Task 1; LSP diagnostics/completion/hover/symbols §5 → Tasks 3–6; VS Code contributions/grammar/client/commands §6 → Tasks 7–8; docs/CI §7 → Tasks 2, 9; acceptance §8 → Task 9; out-of-scope §2.2/§10 respected (no formatting/go-to-definition).

**Placeholder scan:** no TBD/TODO; every code step shows the code; every test step names the command and expected result. The only forward-looking value is the marketplace install line in the vscode doc, which is explicitly a placeholder for the user's eventual publishing step (documented as such in the doc text, not a code placeholder).

**Type consistency:** `Position {line,column}` (Task 1) is consumed by `symbols.ts`/`diagnostics.ts` (0-based conversion in one place per feature); `computeDiagnostics`/`computeCompletion`/`computeHover`/`computeSymbols` signatures are stable across Tasks 3–6; the `mermaid-opm` alias appears identically in both `vitest.config.ts` and `build.mjs` for each package; `dist/server.js`/`dist/extension.js` names match `build.mjs` outputs and the client/`main` references.
