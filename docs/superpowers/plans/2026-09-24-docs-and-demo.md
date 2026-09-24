# docs-and-demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `mermaid-opm` into a publishable, well-documented project: a polished OPL→OPD demo gallery, a bilingual documentation set (English + `.zh.md` copies), an `AGENTS.md` convention file with English-only code comments, and GitHub infrastructure (MIT LICENSE, CONTRIBUTING, CI, Pages, templates).

**Architecture:** No new runtime code. Adds a static demo gallery that loads the existing built bundle (`dist/mermaid-opm.mjs`) and the real Mermaid plugin; adds Markdown docs and GitHub config; adds tests that validate every demo sample and every documentation `opm` code block renders with no `unrecognized-sentence`/`unknown-kind` diagnostics; converts existing Chinese code comments to English.

**Tech Stack:** TypeScript ESM, Vitest (jsdom), esbuild, Mermaid (peer), plain static HTML/CSS/JS for the demo, Markdown docs, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-24-docs-and-demo-design.md`

## Global Constraints

- Code, comments, and English docs are written in **English**. Chinese exists only in `*.zh.md` copies.
- The software (plugin/CLI) has **no i18n**; all runtime strings and diagnostics are English.
- Every `opm` code block in demos and in the English docs must render and produce **zero** `unrecognized-sentence` and **zero** `unknown-kind` diagnostics (enforced by tests).
- Only the syntax subset implemented in v1 may be used (see spec `2026-09-23-opm-opl-mermaid-design.md` §5). Never invent syntax.
- License: **MIT**, copyright holder `fengdonglu`.
- Docs are plain Markdown (no site generator). Internal imports in `.ts` remain `.js`-suffixed.
- Do not modify behavior of `src/` beyond translating comments.

---

### Task 1: English-only code comments + AGENTS.md + conventions test

**Files:**
- Create: `AGENTS.md`
- Create: `test/conventions.spec.ts`
- Modify (comments only): every `src/**/*.ts`, `test/**/*.ts`, `scripts/*.mjs`, `demo/index.html` containing CJK characters.

**Interfaces:**
- Produces: a repo-wide guard that no CJK characters appear in code files (`src`, `test`, `scripts`, `demo`).

- [ ] **Step 1: Write the failing test**

`test/conventions.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CJK = /[\u4e00-\u9fff]/;
const CODE_EXT = new Set(['.ts', '.mjs', '.js', '.html', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.superpowers', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (CODE_EXT.has(extname(p))) out.push(p);
  }
  return out;
}

describe('conventions', () => {
  it('code files contain no CJK characters (English only)', () => {
    const offenders: string[] = [];
    for (const d of ['src', 'test', 'scripts', 'demo']) {
      for (const f of walk(join(root, d))) {
        if (CJK.test(readFileSync(f, 'utf8'))) offenders.push(f);
      }
    }
    expect(offenders, `CJK found in: ${offenders.join(', ')}`).toEqual([]);
  });
  it('AGENTS.md exists and states the English-only + Vibe Coding rules', () => {
    const md = readFileSync(join(root, 'AGENTS.md'), 'utf8');
    expect(md.toLowerCase()).toContain('english');
    expect(md.toLowerCase()).toContain('vibe coding');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/conventions.spec.ts`
Expected: FAIL — CJK characters found in source comments; `AGENTS.md` missing.

- [ ] **Step 3: Translate comments and write AGENTS.md**

Find CJK in code:
Run: `rg -n "[\p{Han}]" src test scripts demo`
Translate every Chinese comment to concise English; change **no code behavior**. (Files known to contain them: `src/core/opl/parse.ts`, `src/core/opl/tokenize.ts`, `src/render/sceneToSvg.ts`, `src/mermaid/renderer.ts`, `src/mermaid/diagram.ts`, and possibly others.)

Create `AGENTS.md` with these sections (English):
- **Project** — one-paragraph description of `mermaid-opm`.
- **Repository layout** — `src/` (layers), `test/`, `demo/`, `docs/`, `scripts/`.
- **Commands** — `npm run build`, `npm test`, `npm run typecheck`, `npm run dev`.
- **Coding conventions** — TypeScript ESM, `.js` import suffixes, **comments and docs in English**, render core must be DOM-free, colors only from the theme, parser must not throw (diagnostics carry line/column), TDD expected, never invent OPL syntax.
- **Docs conventions** — English is canonical; Chinese copies are `*.zh.md` siblings; if they conflict, English wins.
- **Commits** — Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…).
- **Vibe Coding** — a sentence stating the project is developed via AI-assisted "Vibe Coding".

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/conventions.spec.ts && npm test`
Expected: PASS; full suite green.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md test/conventions.spec.ts src test scripts demo
git commit -m "docs: add AGENTS.md; translate code comments to English"
```

---

### Task 2: Demo samples + samples test

**Files:**
- Create: `demo/samples/01-objects-processes.opl` … `demo/samples/10-tagged.opl` (10 files, contents below)
- Create: `test/samples.spec.ts`
- Keep: `demo/samples/onstar.opl` (already exists; must also pass)

**Interfaces:**
- Produces: `demo/samples/NN-*.opl` used by the demo gallery (Task 3) and validated here.

- [ ] **Step 1: Write the failing test**

`test/samples.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSvg, renderModel } from '../src/index.js';

const samplesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo', 'samples');
const files = readdirSync(samplesDir).filter((f) => f.endsWith('.opl'));

describe('demo samples', () => {
  it('has at least 10 sample files', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });
  for (const file of files) {
    it(`${file} renders with no unrecognized/unknown-kind diagnostics`, () => {
      const src = readFileSync(join(samplesDir, file), 'utf8');
      expect(renderSvg(src)).toContain('<svg');
      const codes = renderModel(src).diagnostics.map((d) => d.code);
      expect(codes).not.toContain('unrecognized-sentence');
      expect(codes).not.toContain('unknown-kind');
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/samples.spec.ts`
Expected: FAIL — fewer than 10 sample files.

- [ ] **Step 3: Create the 10 sample files**

Exact contents (each starts with `opm` on its own line):

`demo/samples/01-objects-processes.opl`:
```
opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

`demo/samples/02-essence-affiliation.opl`:
```
opm
Customer is physical and environmental.
Order is informatical.
Processing is informatical.
Processing consumes Order.
Processing affects Customer.
```

`demo/samples/03-object-states.opl`:
```
opm
Order is physical.
Order can be new, open, or closed.
Order is initial new.
Order is final closed.
Handling is physical.
Handling consumes Order.
Handling affects Order.
```

`demo/samples/04-input-output.opl`:
```
opm
Order is physical.
Order can be new or closed.
Handling is physical.
Handling changes Order from new to closed.
```

`demo/samples/05-enabling-agent-instrument.opl`:
```
opm
Clerk is physical and environmental.
System is physical.
Order is physical.
Handling is physical.
Handling consumes Order.
Clerk handles Handling.
Handling requires System.
```

`demo/samples/06-condition.opl`:
```
opm
Order is physical.
Order can be paid or unpaid.
Handling is physical.
Handling consumes Order.
Handling occurs if Order is paid.
```

`demo/samples/07-aggregation.opl`:
```
opm
OnStar System is physical.
OnStar System consists of Console, VCIM, Cellular Network, and GPS.
Console is physical.
VCIM is physical.
Cellular Network is physical.
GPS is physical.
```

`demo/samples/08-exhibition.opl`:
```
opm
Order is physical.
Order exhibits Price.
Order exhibits Priority.
Price is informatical.
Priority is informatical.
```

`demo/samples/09-generalization-classification.opl`:
```
opm
Document is informatical.
Order is informatical.
Order is a Document.
Special Order is informatical.
Special Order is an instance of Order.
```

`demo/samples/10-tagged.opl`:
```
opm
Driver is physical and environmental.
OnStar Console is physical.
Driver communicates via OnStar Console.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/samples.spec.ts`
Expected: PASS. If a sample reports a warning, adjust the sample (do not change `src/`); the goal is zero `unrecognized-sentence`/`unknown-kind`.

- [ ] **Step 5: Commit**

```bash
git add demo/samples test/samples.spec.ts
git commit -m "test: add 10 OPL demo samples with zero-diagnostic validation"
```

---

### Task 3: Demo gallery UI

**Files:**
- Rewrite: `demo/index.html`
- Create: `demo/examples.mjs`
- Create: `demo/demo.css`
- Modify: `test/demo.spec.ts` (extend existing)

**Interfaces:**
- Consumes: `demo/samples/*.opl` (Task 2), `dist/mermaid-opm.mjs` (`registerOpm`).
- Produces: `demo/examples.mjs` default-exports an array of `{ id, title, sample, explanation }`.

- [ ] **Step 1: Write the failing test (extend `test/demo.spec.ts`)**

Append to the existing `test/demo.spec.ts` (keep its current assertions):
```ts
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

it('demo page wires the plugin and lists 10 examples with existing samples', async () => {
  const html = readFileSync(join(root, 'demo', 'index.html'), 'utf8');
  expect(html).toContain('importmap');
  expect(html).toContain('registerOpm');
  const mod = await import('../demo/examples.mjs');
  const examples = mod.default as Array<{ id: string; title: string; sample: string; explanation: string }>;
  expect(examples.length).toBe(10);
  for (const ex of examples) {
    expect(ex.title.length).toBeGreaterThan(0);
    expect(ex.explanation.length).toBeGreaterThan(0);
    expect(existsSync(join(root, 'demo', 'samples', ex.sample))).toBe(true);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/demo.spec.ts`
Expected: FAIL — `demo/examples.mjs` missing.

- [ ] **Step 3: Implement the gallery**

`demo/examples.mjs`:
```js
export default [
  { id: 'objects-processes', title: 'Objects, processes, and transformation', sample: '01-objects-processes.opl',
    explanation: 'An Object is a thing that exists; a Process transforms objects. "Handling consumes Order." and "Handling yields Handled Order." are transformation links: consumption points into the process, production points out of it.' },
  { id: 'essence-affiliation', title: 'Essence and affiliation', sample: '02-essence-affiliation.opl',
    explanation: 'Essence is physical or informatical; affiliation is systemic or environmental. "Customer is physical and environmental." marks an object outside the system that interacts with it.' },
  { id: 'object-states', title: 'Object states', sample: '03-object-states.opl',
    explanation: 'A stateful object is drawn as a rectangle divided into state compartments. States are listed with "can be", and initial/final states are named explicitly.' },
  { id: 'input-output', title: 'Input-output pair (state change)', sample: '04-input-output.opl',
    explanation: '"Handling changes Order from new to closed." expands into two links: the input state feeds the process, and the process produces the output state.' },
  { id: 'enabling', title: 'Enabling links: agent and instrument', sample: '05-enabling-agent-instrument.opl',
    explanation: 'Enabling links do not transform their source. An agent (a human) is drawn with a filled circle at the process; an instrument with a hollow circle.' },
  { id: 'condition', title: 'Condition link', sample: '06-condition.opl',
    explanation: '"Handling occurs if Order is paid." makes the process conditional on a state of another object, drawn with an open arrow at the process.' },
  { id: 'aggregation', title: 'Aggregation-participation', sample: '07-aggregation.opl',
    explanation: '"Whole consists of A, B, and C." builds the whole-part hierarchy, drawn with a filled triangle pointing at the whole.' },
  { id: 'exhibition', title: 'Exhibition-characterization', sample: '08-exhibition.opl',
    explanation: '"Order exhibits Price." attaches a feature to an object, drawn with a triangle that contains a smaller filled triangle.' },
  { id: 'generalization', title: 'Generalization and classification', sample: '09-generalization-classification.opl',
    explanation: '"Order is a Document." is generalization (hollow triangle to the general); "Special Order is an instance of Order." is classification (triangle containing a dot).' },
  { id: 'tagged', title: 'Tagged structural link', sample: '10-tagged.opl',
    explanation: '"Driver communicates via OnStar Console." is a user-defined tagged link; the tag is rendered along the edge.' },
];
```

`demo/index.html` (English-only, two columns, sidebar nav, dynamic rendering):
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mermaid-opm — OPL to OPD demo</title>
  <link rel="stylesheet" href="./demo.css" />
</head>
<body>
  <header>
    <h1>mermaid-opm</h1>
    <p>Render Object-Process Language (ISO 19450) as Object-Process Diagrams — in Mermaid or from the CLI.</p>
  </header>
  <main>
    <nav id="toc" aria-label="Examples"></nav>
    <section class="panel source">
      <h2 id="title"></h2>
      <p id="explanation"></p>
      <pre><code id="opl"></code></pre>
    </section>
    <section class="panel output">
      <h2>Rendered OPD</h2>
      <div id="diagram" class="mermaid"></div>
      <p id="error" class="error" hidden></p>
    </section>
  </main>
  <script type="importmap">{"imports":{"mermaid":"https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"}}</script>
  <script type="module">
    import mermaid from 'mermaid';
    import { registerOpm } from '../dist/mermaid-opm.mjs';
    import examples from './examples.mjs';
    // Disable auto-run before any await so mermaid does not process an empty .mermaid on DOMContentLoaded.
    mermaid.initialize({ startOnLoad: false });
    await registerOpm();

    const toc = document.getElementById('toc');
    const title = document.getElementById('title');
    const explanation = document.getElementById('explanation');
    const oplEl = document.getElementById('opl');
    const diagram = document.getElementById('diagram');
    const errorEl = document.getElementById('error');

    for (const ex of examples) {
      const a = document.createElement('button');
      a.textContent = ex.title;
      a.dataset.id = ex.id;
      a.addEventListener('click', () => select(ex));
      toc.appendChild(a);
    }

    async function select(ex) {
      for (const b of toc.children) b.classList.toggle('active', b.dataset.id === ex.id);
      title.textContent = ex.title;
      explanation.textContent = ex.explanation;
      errorEl.hidden = true;
      diagram.removeAttribute('data-processed');
      diagram.innerHTML = '';
      try {
        const source = await (await fetch(`./samples/${ex.sample}`)).text();
        oplEl.textContent = source.trim();
        const { svg } = await mermaid.render(`opm-${ex.id}-${Date.now()}`, source);
        diagram.innerHTML = svg;
      } catch (e) {
        errorEl.hidden = false;
        errorEl.textContent = String(e.message || e);
      }
    }

    select(examples[0]);
  </script>
</body>
</html>
```

`demo/demo.css`:
```css
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 system-ui, sans-serif; }
header { padding: 20px 24px; border-bottom: 1px solid #8884; }
header h1 { margin: 0 0 4px; font-size: 22px; }
header p { margin: 0; opacity: 0.75; }
main { display: grid; grid-template-columns: 220px 1fr 1fr; gap: 16px; padding: 16px 24px; align-items: start; }
nav { display: flex; flex-direction: column; gap: 4px; position: sticky; top: 16px; }
nav button { text-align: left; padding: 8px 10px; border: 1px solid #8884; border-radius: 6px; background: transparent; cursor: pointer; font: inherit; }
nav button.active { background: #4b7bec22; border-color: #4b7bec; font-weight: 600; }
.panel { border: 1px solid #8884; border-radius: 8px; padding: 12px 14px; min-width: 0; }
.panel pre { overflow: auto; background: #8881; padding: 10px; border-radius: 6px; }
.panel.output { overflow: auto; }
.error { color: #c0392b; white-space: pre-wrap; }
@media (max-width: 900px) { main { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/demo.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add demo/index.html demo/examples.mjs demo/demo.css test/demo.spec.ts
git commit -m "feat: two-column OPL demo gallery with 10 examples"
```

---

### Task 4: README (English + Chinese)

**Files:**
- Rewrite: `README.md`
- Create: `README.zh.md`
- Modify: `test/docs.spec.ts` (add README language-link assertion)

**Interfaces:**
- Consumes: the validated `opm` example from README (existing).
- Produces: `README.md` / `README.zh.md` interlinked via a language line.

- [ ] **Step 1: Add the failing test to `test/docs.spec.ts`**

```ts
it('README and README.zh.md exist and link to each other', () => {
  const en = readFileSync(join(here, '..', 'README.md'), 'utf8');
  const zh = readFileSync(join(here, '..', 'README.zh.md'), 'utf8');
  expect(en).toContain('README.zh.md');
  expect(zh).toContain('README.md');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/docs.spec.ts`
Expected: FAIL — `README.zh.md` missing / no cross-links.

- [ ] **Step 3: Write both READMEs**

`README.md` sections (English, `fengdonglu` where a URL is needed):
- Title + one-line description + badges (CI status, npm version, license MIT).
- Language line: `English | [中文](README.zh.md)`.
- **What it is** — OPM/OPL/ISO 19450 context and the two deliverables (Mermaid plugin + CLI).
- **Install** — `npm i mermaid-opm mermaid` and CDN note.
- **Quick start — Mermaid plugin** — a ```js block with `registerOpm()` + `mermaid.render`, then a ```opm example (must be valid; reuse the sample from `demo/samples/01-objects-processes.opl`).
- **Quick start — CLI** — `npx opm2svg model.opl -o model.svg` and `--json`.
- **Demo** — link to `demo/index.html` and the Pages URL; note `npm run dev`.
- **Supported / Not supported** — mirror spec §5 and the v1 limitations (named initial states only; article-form generalization; no in-zoom/multi-OPD/events/result/invocation; no LSP yet).
- **Known limitations** — external Mermaid diagrams require the host to load the plugin (fixed renderers like GitHub Markdown do not); give the CLI as the alternative.
- **Documentation** — links into `docs/usage/`, `docs/development/`, `docs/about/`.
- **Roadmap** — P1 items incl. LSP.
- **Development note** — a short paragraph: “This project was developed through AI-assisted **Vibe Coding**.”
- **License** — MIT © fengdonglu.

`README.zh.md`: faithful Chinese translation of the above, language line `[English](README.md) | 中文`, and a note that English is canonical if they conflict.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/docs.spec.ts`
Expected: PASS (README's ```opm block renders with no unrecognized/unknown-kind).

- [ ] **Step 5: Commit**

```bash
git add README.md README.zh.md test/docs.spec.ts
git commit -m "docs: rewrite bilingual README"
```

---

### Task 5: usage docs (EN + zh) + docs scanning test

**Files:**
- Create: `docs/usage/getting-started.md`, `opl-syntax.md`, `cli.md`, `mermaid-plugin.md`, `editor-integration.md`
- Create their `.zh.md` siblings (5 files)
- Modify: `test/docs.spec.ts` (scan usage docs)

**Interfaces:**
- Produces: usage documentation; the docs test validates every English `opm` block in `docs/usage`.

- [ ] **Step 1: Extend `test/docs.spec.ts` to scan the English docs**

Replace the single-file README `opm`-block test with a walker that validates `README.md`, `docs/index.md`, and `docs/{usage,development,about}/*.md` (excluding `*.zh.md`; `docs/superpowers/` is deliberately **not** scanned):
```ts
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';

function mdFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) mdFiles(p, out);
    else if (name.endsWith('.md') && !name.endsWith('.zh.md')) out.push(p);
  }
  return out;
}

it('every ```opm block in the English docs renders with no diagnostics', () => {
  const files = [join(here, '..', 'README.md'), join(here, '..', 'docs', 'index.md')].filter(existsSync);
  for (const sub of ['usage', 'development', 'about']) {
    files.push(...mdFiles(join(here, '..', 'docs', sub)));
  }
  let blocks = 0;
  for (const file of files) {
    const md = readFileSync(file, 'utf8');
    for (const m of md.matchAll(/```opm\r?\n([\s\S]*?)```/g)) {
      blocks++;
      const body = m[1];
      expect(renderSvg(body), file).toContain('<svg');
      const codes = renderModel(body).diagnostics.map((d) => d.code);
      expect(codes, file).not.toContain('unrecognized-sentence');
      expect(codes, file).not.toContain('unknown-kind');
    }
  }
  expect(blocks).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/docs.spec.ts`
Expected: FAIL — `docs/index.md` and `docs/usage/*` missing.

- [ ] **Step 3: Write the five usage docs (EN) and their `.zh.md` copies**

Each English doc starts with: `English | [中文](<name>.zh.md)`; each `.zh.md` starts with `[English](<name>.md) | 中文`.

- `getting-started.md` — installation (`npm i mermaid-opm mermaid`), minimal plugin example (```js + ```opm), minimal CLI example, link to demo.
- `opl-syntax.md` — the supported subset, sentence by sentence, grouped: entities (essence/affiliation), states (list, initial/final named), structural (consists of/exhibits/is a/is an instance of/tagged), procedural (consumes/yields/affects/changes/handles/requires/occurs if). Use only valid ```opm blocks. Include a "Not supported (v1)" section and the ambiguity rules (bare initial unsupported; article-form generalization only).
- `cli.md` — `opm2svg <input.opl> [-o out.svg] [--json out.json]`; exit codes (non-zero on any `error` diagnostic); unknown flag = usage error; example commands and their effects.
- `mermaid-plugin.md` — `registerExternalDiagrams`/`registerOpm`, the `opm` off-keyword, the `startOnLoad` pitfall (disable auto-run before awaiting registration), host requirements, and the fixed-renderer limitation.
- `editor-integration.md` — state clearly there is **no LSP in v1**; show how to get diagnostics by running the CLI on save, and how to call `renderModel(source).diagnostics` from an editor extension (mention Monaco/CodeMirror); forward-reference the roadmap.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/docs.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/usage test/docs.spec.ts
git commit -m "docs: add usage documentation (EN + zh)"
```

---

### Task 6: development docs (EN + zh)

**Files:**
- Create: `docs/development/architecture.md`, `build-and-test.md`, `integration.md`, `extending.md`, `roadmap.md`
- Create their `.zh.md` siblings (5 files)

**Interfaces:**
- Consumes: docs scanning test from Task 5 (validates any `opm` blocks here too).

- [ ] **Step 1: Write the five documents (EN + zh)**

Language header lines as in Task 5.

- `architecture.md` — the layers `core/opl → core/model → layout → render`, the two entrypoints, DOM-free render core, and a diagram of the data flow.
- `build-and-test.md` — `npm run build` / `test` / `typecheck` / `dev`; outputs (`dist/index.js`, `dist/cli/cli.js`, `dist/mermaid-opm.mjs`); how to run a single test.
- `integration.md` — consuming the library with Vite, webpack, and plain ESM; Node/SSR usage (`renderSvg`, `renderModel`); CDN usage in the browser; the `mermaid` peer dependency.
- `extending.md` — how to add a new link kind (parser → model `LinkKind` → layout → `render/notation`), add a theme token, and add a demo sample; reference `AGENTS.md`.
- `roadmap.md` — P1: event/result/invocation links, no-article generalization, `--theme`/`--strict`, ELK layout, and a future **LSP / VS Code extension**.

- [ ] **Step 2: Run tests to verify pass**

Run: `npx vitest run test/docs.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/development
git commit -m "docs: add development documentation (EN + zh)"
```

---

### Task 7: about docs + docs index (EN + zh)

**Files:**
- Create: `docs/about/what-is-opm-opl.md`, `references.md`, `faq.md`
- Create their `.zh.md` siblings
- Create: `docs/index.md`, `docs/index.zh.md`

**Interfaces:**
- Produces: documentation entry point navigable from README.

- [ ] **Step 1: Write the documents (EN + zh)**

- `what-is-opm-opl.md` — OPM/OPL/OPD overview, the bimodal principle, ISO 19450.
- `references.md` — ISO 19450; GB/T 39470-2020; OPCAT and its manuals (as project references); note the local reference material location.
- `faq.md` — why Mermaid; why no GUI editing; why no layout persistence; why no LSP yet; how to render on GitHub.
- `index.md` — a table of contents linking to `usage/*`, `development/*`, `about/*` (and to `index.zh.md`), with the language line.

- [ ] **Step 2: Run tests to verify pass**

Run: `npx vitest run test/docs.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/about docs/index.md docs/index.zh.md
git commit -m "docs: add about docs and documentation index (EN + zh)"
```

---

### Task 8: GitHub infrastructure

**Files:**
- Create: `LICENSE`, `CONTRIBUTING.md`, `CONTRIBUTING.zh.md`, `CHANGELOG.md`
- Create: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/pull_request_template.md`
- Modify: `test/packaging.spec.ts` (assert LICENSE + CI exist)

**Interfaces:**
- Produces: publish/repo infrastructure.

- [ ] **Step 1: Extend `test/packaging.spec.ts`**

Add:
```ts
it('ships an MIT LICENSE for fengdonglu and a CI workflow', () => {
  const license = readFileSync(join(here, '..', 'LICENSE'), 'utf8');
  expect(license).toMatch(/MIT License/);
  expect(license).toContain('fengdonglu');
  expect(existsSync(join(here, '..', '.github', 'workflows', 'ci.yml'))).toBe(true);
});
```
(Use the same `here` pattern already present in `test/packaging.spec.ts`; add the needed `existsSync` import.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/packaging.spec.ts`
Expected: FAIL — no LICENSE / ci.yml.

- [ ] **Step 3: Write the infrastructure files**

- `LICENSE` — standard MIT license text, `Copyright (c) 2026 fengdonglu`.
- `CONTRIBUTING.md` (+ `CONTRIBUTING.zh.md`) — dev setup, TDD expectation, Conventional Commits, PR checklist; link `AGENTS.md`.
- `CHANGELOG.md` — Keep a Changelog format with an `## [0.1.0] - 2026-09-24` section summarizing v1 and this docs/demo work.
- `.github/workflows/ci.yml` — on push/PR: Node 20 + 22 matrix; `npm ci`, `npm run typecheck`, `npm test`, `npm run build`.
- `.github/workflows/pages.yml` — on push to `main`: `npm ci && npm run build`; upload an artifact containing `demo/` plus `dist/` (so `demo/index.html`'s `../dist/mermaid-opm.mjs` resolves); deploy to GitHub Pages. (Set the Pages source to “GitHub Actions” in repo settings — note this in `README.md`.)
- `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md` — standard templates with a short checklist.
- `.github/pull_request_template.md` — summary, test plan, checklist.

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run test/packaging.spec.ts && npm test`
Expected: PASS; full suite green.

- [ ] **Step 5: Commit**

```bash
git add LICENSE CONTRIBUTING.md CONTRIBUTING.zh.md CHANGELOG.md .github test/packaging.spec.ts
git commit -m "chore: add MIT license, contributing guide, CI/Pages, and templates"
```

---

### Task 9: Update user's global config + final verification

**Files:**
- Modify (outside repo): `C:\Users\fengd\.claude\CLAUDE.md`

**Interfaces:**
- Produces: the “converse in Chinese; project output in English” rule in the user's global assistant config.

- [ ] **Step 1: Update the global CLAUDE.md**

Append under the existing 语言 section:
```markdown
- 与用户对话使用中文。
- 项目产出（代码注释、文档、提交信息）使用英文；中文仅作为文档副本（*.zh.md）。
- 派生子 agent 时，保持同样的语言约定。
```

- [ ] **Step 2: Final verification of the repository**

Run each and confirm green:
```bash
npm run typecheck
npm test
npm run build
npx vitest run test/conventions.spec.ts test/samples.spec.ts test/docs.spec.ts test/demo.spec.ts test/packaging.spec.ts
```
Expected: all pass; `test/docs.spec.ts` validates README + all English docs; `test/samples.spec.ts` validates 10+ samples.

- [ ] **Step 3: Manual browser check of the demo**

Run `npm run dev` and open `http://localhost:3000/demo/index.html`; confirm both columns render and all 10 examples switch and render. (If a headless check is available, load the page, expect `.mermaid svg` count ≥ 1 after selecting the first example.)

- [ ] **Step 4: Commit any remaining repo changes**

```bash
git add -A
git commit -m "chore: final docs-and-demo verification pass" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage (§ → task):** A demo gallery §3 → Tasks 2–3; B docs §4 → Tasks 4–7; C bilingual `.zh.md` → Tasks 4–7; D conventions §5 → Tasks 1, 9; E GitHub §6 → Task 8; tests §7 → Tasks 2, 5, 8; acceptance §8 → Task 9 verification. Spec §2.3 hard constraints enforced by `test/conventions.spec.ts`, `test/samples.spec.ts`, and the extended `test/docs.spec.ts`.

**Placeholder scan:** no TBD/TODO; each doc task lists exact filenames, required sections, and language-header lines; test code is complete; sample contents are verbatim.

**Type consistency:** `examples.mjs` entries use `{ id, title, sample, explanation }` consumed by both `test/demo.spec.ts` and `demo/index.html`; sample filenames match between Task 2 creation and Task 3 metadata; the `docs.spec.ts` walker excludes `*.zh.md` and `docs/superpowers`.
