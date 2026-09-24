# mermaid-opm 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个 Mermaid 外部图插件与 CLI，把 ISO 19450 的 OPL 文本（子集）渲染成 OPD（对象-过程图）SVG。

**Architecture:** 分层：`core/opl`（文本→OPM 模型+诊断）→ `core/model`（语义 SSOT+校验）→ `layout`（dagre→Scene）→ `render`（Scene→SVG 字符串，DOM-free）→ 两个入口：`mermaid` 外部图插件与 `cli`。未来 SysML v2 复用同一分层，只替换 `opl` 与 `render/notation`。

**Tech Stack:** TypeScript（ESM）、`@dagrejs/dagre`（布局）、`esbuild`（打包）、`vitest` + `jsdom`（测试）、`mermaid`（peer，集成与端到端验证）。

**Spec:** `docs/superpowers/specs/2026-09-23-opm-opl-mermaid-design.md`

## Global Constraints

- 包名 `mermaid-opm`；许可 MIT；`"type": "module"`；所有内部 import 带 `.js` 后缀（NodeNext ESM）。
- 渲染核心必须 DOM-free：`sceneToSvg` 不得访问 `document`/`window`。
- 颜色一律取自主题对象，禁止硬编码 hex。
- 解析失败不得抛栈，必须产出带 `line`/`column` 的 `Diagnostic`。
- 依赖上限：运行时仅 `@dagrejs/dagre`；`mermaid` 作为 peerDependencies/可选。
- OPL 子集与记号严格遵循 spec §5/§8；不实现 in-scope 之外的构造。

---

### Task 1: 项目脚手架与测试工具链

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `build.mjs`
- Create: `src/index.ts`
- Test: `test/scaffold.spec.ts`

**Interfaces:**
- Produces: `src/index.ts` 导出 `VERSION: string`（供后续任务扩展导出面）。

- [ ] **Step 1: 写失败的测试**

`test/scaffold.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('scaffold', () => {
  it('exports a version string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/scaffold.spec.ts`
Expected: FAIL（找不到 `../src/index.js`）

- [ ] **Step 3: 写最小实现与配置**

`src/index.ts`:
```ts
export const VERSION = '0.1.0';
```

`package.json`:
```json
{
  "name": "mermaid-opm",
  "version": "0.1.0",
  "description": "Mermaid external diagram plugin and CLI that renders ISO 19450 OPL into OPD",
  "type": "module",
  "license": "MIT",
  "bin": { "opm2svg": "./dist/cli.js" },
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "exports": {
    ".": { "import": "./dist/index.js" },
    "./browser": "./dist/mermaid-opm.mjs"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json && node build.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@dagrejs/dagre": "^1.1.4" },
  "peerDependencies": { "mermaid": ">=11" },
  "peerDependenciesMeta": { "mermaid": { "optional": true } },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0",
    "esbuild": "^0.24.0",
    "@types/node": "^22.0.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

`tsconfig.build.json`:
```json
{ "extends": "./tsconfig.json", "include": ["src"], "exclude": ["**/*.spec.ts"] }
```

`build.mjs`:
```js
import { build } from 'esbuild';
await build({
  entryPoints: ['src/index.ts'],
  bundle: true, format: 'esm', platform: 'browser',
  external: ['mermaid'], outfile: 'dist/mermaid-opm.mjs',
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', include: ['test/**/*.spec.ts'], setupFiles: ['test/setup.ts'] },
});
```

`test/setup.ts`:
```ts
// jsdom 未实现 SVG getBBox，mermaid 渲染需要
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.getBBox) {
  (SVGElement.prototype as any).getBBox = () => ({ x: 0, y: 0, width: 100, height: 20 });
}
```

- [ ] **Step 4: 安装依赖并运行测试**

Run: `npm install && npx vitest run test/scaffold.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json build.mjs vitest.config.ts src/index.ts test/setup.ts test/scaffold.spec.ts
git commit -m "chore: scaffold TypeScript ESM project with vitest/esbuild"
```

---

### Task 2: M0 去风险 spike —— 验证外部图渲染入口

**Files:**
- Create: `src/mermaid/spikeDiagram.ts`
- Test: `test/mermaid-spike.spec.ts`

**Interfaces:**
- Produces: 确认 `renderer.draw(text, id, version, diagramObject)` 中可通过 `document.getElementById(id)` 拿到 mermaid 创建的 `<svg>` 元素并注入内容。该结论用于 Task 14。

- [ ] **Step 1: 写失败的测试**

`test/mermaid-spike.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import mermaid from 'mermaid';
import { spikeDiagram } from '../src/mermaid/spikeDiagram.js';

describe('mermaid external diagram spike', () => {
  it('lets draw() inject content into the rendered svg', async () => {
    await mermaid.registerExternalDiagrams(
      [{ id: 'opm-spike', detector: (t) => /^\s*opm-spike(?:\s|$)/.test(t), loader: async () => ({ id: 'opm-spike', diagram: spikeDiagram }) }],
      { lazyLoad: false }
    );
    const { svg } = await mermaid.render('spiketest', 'opm-spike\nx');
    expect(svg).toContain('data-spike-ok');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/mermaid-spike.spec.ts`
Expected: FAIL（`spikeDiagram` 不存在）

- [ ] **Step 3: 写最小实现**

`src/mermaid/spikeDiagram.ts`:
```ts
import type { DiagramDefinition } from 'mermaid';

export const spikeDiagram: DiagramDefinition = {
  parser: { parse: () => {} },
  db: {},
  renderer: {
    draw: (_text: string, id: string) => {
      const svg = document.getElementById(id);
      if (svg) {
        svg.setAttribute('viewBox', '0 0 100 40');
        svg.setAttribute('data-spike-ok', 'true');
      }
    },
  },
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/mermaid-spike.spec.ts`
Expected: PASS。若失败且 `getElementById(id)` 为空，则改为在 draw 中 `document.querySelector('svg')`/`svg.parentElement` 探测（记录到代码注释），直至测试通过——这是 spike 的目的。

- [ ] **Step 5: 提交**

```bash
git add src/mermaid/spikeDiagram.ts test/mermaid-spike.spec.ts
git commit -m "test: spike mermaid external diagram draw pipeline"
```

---

### Task 3: 诊断与 OPM 模型类型

**Files:**
- Create: `src/core/opl/diagnostics.ts`
- Create: `src/core/model/types.ts`
- Test: `test/model-types.spec.ts`

**Interfaces:**
- Produces:
  - `type Severity = 'error' | 'warning'`
  - `interface Diagnostic { severity: Severity; code: string; message: string; line: number; column: number }`
  - `type ThingKind`, `type Essence`, `type Affiliation`
  - `interface State { name: string; initial?: boolean; final?: boolean }`
  - `interface Thing { id: string; name: string; kind: ThingKind; essence: Essence; affiliation: Affiliation; states: State[] }`
  - `type LinkKind`（见 spec §6）
  - `interface Endpoint { thingId: string; stateName?: string }`
  - `interface Link { id: string; kind: LinkKind; source: Endpoint; target: Endpoint; tag?: string }`
  - `interface OpmModel { things: Map<string, Thing>; links: Link[]; diagnostics: Diagnostic[] }`
  - `function thingId(name: string): string`（规范化：trim + 折叠空白）

- [ ] **Step 1: 写失败的测试**

`test/model-types.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { thingId } from '../src/core/model/types.js';

describe('thingId', () => {
  it('normalizes whitespace', () => {
    expect(thingId('Driver   Rescuing')).toBe(thingId('Driver Rescuing'));
  });
  it('trims', () => {
    expect(thingId('  Order ')).toBe('Order');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/model-types.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/core/opl/diagnostics.ts`:
```ts
export type Severity = 'error' | 'warning';
export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  line: number;
  column: number;
}
```

`src/core/model/types.ts`:
```ts
import type { Diagnostic } from '../opl/diagnostics.js';

export type ThingKind = 'object' | 'process' | 'unknown';
export type Essence = 'physical' | 'informatical';
export type Affiliation = 'systemic' | 'environmental';

export interface State { name: string; initial?: boolean; final?: boolean }

export interface Thing {
  id: string; name: string; kind: ThingKind;
  essence: Essence; affiliation: Affiliation; states: State[];
}

export type LinkKind =
  | 'aggregation' | 'exhibition' | 'generalization' | 'classification' | 'tagged'
  | 'consumption' | 'production' | 'effect' | 'input-output'
  | 'agent' | 'instrument' | 'condition';

export interface Endpoint { thingId: string; stateName?: string }

export interface Link {
  id: string; kind: LinkKind; source: Endpoint; target: Endpoint; tag?: string;
}

export interface OpmModel {
  things: Map<string, Thing>;
  links: Link[];
  diagnostics: Diagnostic[];
}

export function thingId(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function emptyModel(): OpmModel {
  return { things: new Map(), links: [], diagnostics: [] };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/model-types.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/diagnostics.ts src/core/model/types.ts test/model-types.spec.ts
git commit -m "feat: add diagnostics and OPM model types"
```

---

### Task 4: OPL 句子切分与词法

**Files:**
- Create: `src/core/opl/tokenize.ts`
- Test: `test/tokenize.spec.ts`

**Interfaces:**
- Produces:
  - `interface Sentence { text: string; line: number; column: number }`
  - `function splitSentences(source: string): Sentence[]`（剥离 `//` 注释；按句号切分；记录每条句子的起始 line/column；忽略空句）

- [ ] **Step 1: 写失败的测试**

`test/tokenize.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { splitSentences } from '../src/core/opl/tokenize.js';

describe('splitSentences', () => {
  it('splits on periods and records positions', () => {
    const s = splitSentences('opm\nOrder is physical.\nHandling consumes Order.');
    expect(s.map((x) => x.text)).toEqual(['Order is physical.', 'Handling consumes Order.']);
    expect(s[0].line).toBe(2);
    expect(s[1].line).toBe(3);
  });
  it('strips // comments', () => {
    const s = splitSentences('opm\nOrder is physical. // trailing\nHandling consumes Order.');
    expect(s[0].text).toBe('Order is physical.');
  });
  it('ignores the opm header and blank lines', () => {
    const s = splitSentences('opm\n\n');
    expect(s).toEqual([]);
  });
  it('splits multiple sentences on one line', () => {
    const s = splitSentences('opm\nA is x. B is y.');
    expect(s.map((x) => x.text)).toEqual(['A is x.', 'B is y.']);
    expect(s[0].line).toBe(2);
    expect(s[1].line).toBe(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/tokenize.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/core/opl/tokenize.ts`:
```ts
export interface Sentence { text: string; line: number; column: number }

export function splitSentences(source: string): Sentence[] {
  const norm = source.replace(/\r\n?/g, '\n');

  // 剥离首行 "opm" 头
  let body = norm;
  let lineOffset = 0;
  const firstNl = norm.indexOf('\n');
  const firstLine = (firstNl === -1 ? norm : norm.slice(0, firstNl)).trim();
  if (firstLine.toLowerCase() === 'opm') {
    body = firstNl === -1 ? '' : norm.slice(firstNl + 1);
    lineOffset = 1;
  }

  const out: Sentence[] = [];
  let line = 1 + lineOffset;
  let col = 1;
  let buf = '';
  let started = false;
  let startLine = line;
  let startCol = col;

  const flush = () => {
    const text = buf.trim();
    if (text.length > 0) out.push({ text, line: startLine, column: startCol });
    buf = '';
    started = false;
  };

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '/' && body[i + 1] === '/') {
      while (i + 1 < body.length && body[i + 1] !== '\n') i++;
      continue;
    }
    if (ch === '.') { buf += ch; flush(); col++; continue; }
    if (ch === '\n') {
      if (buf.trim().length > 0) buf += ' ';
      line++; col = 1;
      continue;
    }
    if (!started && /\S/.test(ch)) { started = true; startLine = line; startCol = col; }
    if (started) buf += ch;
    col++;
  }
  flush();
  return out;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/tokenize.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/tokenize.ts test/tokenize.spec.ts
git commit -m "feat: add OPL sentence splitter with positions"
```

---

### Task 5: 解析器 —— 实体声明（本质/归属/状态/初终态）与类型推断

**Files:**
- Create: `src/core/opl/reserved.ts`
- Create: `src/core/opl/parse.ts`
- Test: `test/parse-entities.spec.ts`

**Interfaces:**
- Consumes: `splitSentences`, `thingId`, `emptyModel`, `Diagnostic`.
- Produces:
  - `const RESERVED: Set<string>`
  - `interface ParseOptions { strict?: boolean }`
  - `function parseOpl(source: string, opts?: ParseOptions): OpmModel`
  - 内部：`ensureThing(model, name): Thing`（默认 `informatical/systemic/unknown`，kind 待链接推断）

- [ ] **Step 1: 写失败的测试**

`test/parse-entities.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse entities', () => {
  it('parses essence and affiliation', () => {
    const m = p('Driver is physical and environmental.');
    const t = m.things.get('Driver')!;
    expect(t.essence).toBe('physical');
    expect(t.affiliation).toBe('environmental');
  });
  it('defaults to informatical and systemic', () => {
    const t = p('Order is informatical.').things.get('Order')!;
    expect(t.affiliation).toBe('systemic');
  });
  it('parses a named initial state', () => {
    const t = p('Order is initial pending.').things.get('Order')!;
    expect(t.states[0]).toMatchObject({ name: 'pending', initial: true });
  });
  it('parses state list with initial/final markers', () => {
    const t = p('Order is initial pending. Order is final done.').things.get('Order')!;
    expect(t.states.map((s) => s.name)).toEqual(['pending', 'done']);
    expect(t.states[0].initial).toBe(true);
    expect(t.states[1].final).toBe(true);
  });
  it('parses can-be list', () => {
    const t = p('Order can be new, open, or closed.').things.get('Order')!;
    expect(t.states.map((s) => s.name)).toEqual(['new', 'open', 'closed']);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/parse-entities.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/core/opl/reserved.ts`:
```ts
export const RESERVED = new Set([
  'is', 'and', 'physical', 'informatical', 'systemic', 'environmental',
  'consists', 'of', 'exhibits', 'an', 'instance', 'can', 'be', 'or',
  'consumes', 'yields', 'affects', 'requires', 'occurs', 'if', 'exists',
  'changes', 'from', 'to', 'handles', 'by', 'initial', 'final',
]);

export const ESSENCE = new Set(['physical', 'informatical']);
export const AFFILIATION = new Set(['systemic', 'environmental']);
```

`src/core/opl/parse.ts`:
```ts
import { splitSentences } from './tokenize.js';
import { RESERVED, ESSENCE, AFFILIATION } from './reserved.js';
import { emptyModel, thingId, type OpmModel, type Thing } from '../model/types.js';

export interface ParseOptions { strict?: boolean }

// 含这些关键字的是结构/过程语句，交给后续解析器，实体解析器不碰
const NON_ENTITY = /\b(consumes|yields|affects|requires|occurs|changes|handles|consists|exhibits|instance)\b/i;

function ensureThing(model: OpmModel, rawName: string): Thing {
  const name = thingId(rawName);
  let t = model.things.get(name);
  if (!t) {
    t = { id: name, name, kind: 'unknown', essence: 'informatical', affiliation: 'systemic', states: [] };
    model.things.set(name, t);
  }
  return t;
}

function parseEntitySentence(model: OpmModel, text: string): boolean {
  const body = text.replace(/\.$/, '').trim();
  if (NON_ENTITY.test(body)) return false;

  // A can be s1, s2, or s3.
  const canM = /^(.+?)\s+can\s+be\s+(.+)$/i.exec(body);
  if (canM) {
    const thing = ensureThing(model, canM[1]);
    const stateNames = canM[2].replace(/\s+or\s+/gi, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const sn of stateNames) {
      if (!thing.states.some((s) => s.name === sn)) thing.states.push({ name: sn });
    }
    return true;
  }

  const isM = /^(.+?)\s+is\s+(.+)$/i.exec(body);
  if (!isM) return false;
  const name = isM[1].trim();
  const rhs = isM[2].trim();
  const rhsWords = rhs.split(/\s+/);
  const lower = rhsWords.map((w) => w.toLowerCase());

  // A is physical [and environmental]. / A is informatical [and systemic].
  if (lower.every((w) => w === 'and' || ESSENCE.has(w) || AFFILIATION.has(w))) {
    const thing = ensureThing(model, name);
    for (const w of lower) {
      if (ESSENCE.has(w)) thing.essence = w as Thing['essence'];
      if (AFFILIATION.has(w)) thing.affiliation = w as Thing['affiliation'];
    }
    return true;
  }

  // A is initial s1. / A is final s1.
  if ((lower[0] === 'initial' || lower[0] === 'final') && rhsWords.length === 2) {
    const thing = ensureThing(model, name);
    const sn = rhsWords[1];
    let st = thing.states.find((s) => s.name === sn);
    if (!st) { st = { name: sn }; thing.states.push(st); }
    if (lower[0] === 'initial') st.initial = true; else st.final = true;
    return true;
  }

  // A is s1. （单 token、非保留字、且不是已声明事物 → 状态；否则视为泛化等交后续解析器）
  if (rhsWords.length === 1 && !RESERVED.has(lower[0]) && !model.things.has(thingId(rhs))) {
    const thing = ensureThing(model, name);
    if (!thing.states.some((s) => s.name === rhs)) thing.states.push({ name: rhs });
    return true;
  }

  return false;
}

export function parseOpl(source: string, opts: ParseOptions = {}): OpmModel {
  const model = emptyModel();
  for (const sentence of splitSentences(source)) {
    const handledEntity = parseEntitySentence(model, sentence.text);
    if (handledEntity) continue;
    // 链接解析在 Task 6/7/8 注册；此处暂不处理
  }
  return model;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/parse-entities.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/reserved.ts src/core/opl/parse.ts test/parse-entities.spec.ts
git commit -m "feat: parse OPL entity/state declarations"
```

---

### Task 6: 解析器 —— 结构链接

**Files:**
- Modify: `src/core/opl/parse.ts`
- Test: `test/parse-structural.spec.ts`

**Interfaces:**
- Consumes: `ensureThing`。
- Produces: `parseStructuralSentence(model, text): boolean`，识别：
  - `Whole consists of Part.`（含逗号列表）
  - `A exhibits B.`
  - `Special is a General.` / `Special is General.`
  - `Instance is an instance of Class.`
  - 生成 `Link` 并推断裂表两端的 `kind='object'`（`consists of`/`exhibits`/`generalization` 可用过程；第一版仅对象）

- [ ] **Step 1: 写失败的测试**

`test/parse-structural.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse structural links', () => {
  it('parses aggregation with list', () => {
    const m = p('OnStar System consists of Console, VCIM, and GPS.');
    const agg = m.links.filter((l) => l.kind === 'aggregation');
    expect(agg).toHaveLength(3);
    expect(agg[0].source.thingId).toBe('OnStar System');
    expect(agg.map((l) => l.target.thingId)).toEqual(['Console', 'VCIM', 'GPS']);
  });
  it('parses exhibition', () => {
    const m = p('Order exhibits Status.');
    expect(m.links[0]).toMatchObject({ kind: 'exhibition' });
  });
  it('parses generalization', () => {
    const m = p('SpecialOrder is a Order.');
    expect(m.links[0]).toMatchObject({ kind: 'generalization' });
    expect(m.links[0].target.thingId).toBe('Order');
  });
  it('parses classification', () => {
    const m = p('Order1 is an instance of Order.');
    expect(m.links[0]).toMatchObject({ kind: 'classification' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/parse-structural.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

在 `src/core/opl/parse.ts` 增加（并加入主循环，位于实体解析之后、返回 `false` 之前）：
```ts
let linkSeq = 0;
function addLink(model: OpmModel, kind: Link['kind'], src: string, tgt: string, tag?: string): void {
  model.links.push({ id: `l${++linkSeq}`, kind, source: { thingId: thingId(src) }, target: { thingId: thingId(tgt) }, tag });
}

function parseStructuralSentence(model: OpmModel, text: string): boolean {
  const body = text.replace(/\.$/, '').trim();

  let m = /^(.+?)\s+consists\s+of\s+(.+)$/i.exec(body);
  if (m) {
    const whole = ensureThing(model, m[1]);
    whole.kind = whole.kind === 'unknown' ? 'object' : whole.kind;
    const parts = m[2].replace(/\s+and\s+/gi, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) { ensureThing(model, part).kind = 'object'; addLink(model, 'aggregation', m[1], part); }
    return true;
  }

  m = /^(.+?)\s+exhibits\s+(.+)$/i.exec(body);
  if (m) {
    ensureThing(model, m[1]).kind = 'object';
    ensureThing(model, m[2]).kind = 'object';
    addLink(model, 'exhibition', m[1], m[2]);
    return true;
  }

  m = /^(.+?)\s+is\s+an?\s+(.+)$/i.exec(body);
  if (m) {
    if (/^instance\s+of\s+/i.test(m[2])) {
      const cls = m[2].replace(/^instance\s+of\s+/i, '');
      ensureThing(model, m[1]).kind = 'object';
      ensureThing(model, cls).kind = 'object';
      addLink(model, 'classification', m[1], cls);
    } else {
      // A is a B  → 泛化（对象）；A is B 由实体解析的"状态"分支处理
      ensureThing(model, m[1]).kind = 'object';
      ensureThing(model, m[2]).kind = 'object';
      addLink(model, 'generalization', m[1], m[2]);
    }
    return true;
  }

  return false;
}
```
（import 行补充 `Link` 类型。）

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/parse-structural.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/parse.ts test/parse-structural.spec.ts
git commit -m "feat: parse OPL structural links"
```

---

### Task 7: 解析器 —— 过程链接（变换与使能）

**Files:**
- Modify: `src/core/opl/parse.ts`
- Test: `test/parse-procedural.spec.ts`

**Interfaces:**
- Produces: `parseProceduralSentence(model, text): boolean`，识别 spec §5.3 过程链接表：
  - `P consumes O.` / `O is consumed by P.`
  - `P yields O.` / `O is yielded by P.`
  - `P affects O.`
  - `P changes O from s1 to s2.` → 两条链接（consumption 状态→过程、production 过程→状态）
  - `A handles P.`
  - `P requires I.`
  - `P occurs if O exists.` / `P occurs if O is s.`
  - 主语→`process`，宾语→`object`

- [ ] **Step 1: 写失败的测试**

`test/parse-procedural.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse procedural links', () => {
  it('consumes / yields / affects — with correct directions', () => {
    const m = p('Handling consumes Order. Handling yields Receipt. Handling affects Customer.');
    expect(m.links.map((l) => l.kind)).toEqual(['consumption', 'production', 'effect']);
    const [c, y, e] = m.links;
    // consumption: 对象→过程
    expect(c.source.thingId).toBe('Order');
    expect(c.target.thingId).toBe('Handling');
    // production: 过程→对象
    expect(y.source.thingId).toBe('Handling');
    expect(y.target.thingId).toBe('Receipt');
    expect(e.source.thingId).toBe('Handling');
    expect(e.target.thingId).toBe('Customer');
    expect(m.things.get('Handling')!.kind).toBe('process');
    expect(m.things.get('Order')!.kind).toBe('object');
  });
  it('parses passive consumption', () => {
    const m = p('Order is consumed by Handling.');
    expect(m.links[0]).toMatchObject({ kind: 'consumption' });
    expect(m.links[0].source.thingId).toBe('Order');
    expect(m.links[0].target.thingId).toBe('Handling');
  });
  it('parses passive production with process→object direction', () => {
    const m = p('Receipt is yielded by Handling.');
    expect(m.links[0]).toMatchObject({ kind: 'production' });
    expect(m.links[0].source.thingId).toBe('Handling');
    expect(m.links[0].target.thingId).toBe('Receipt');
  });
  it('parses input-output pair', () => {
    const m = p('Handling changes Order from open to closed.');
    expect(m.links.map((l) => l.kind).sort()).toEqual(['consumption', 'production']);
    const c = m.links.find((l) => l.kind === 'consumption')!;
    const pr = m.links.find((l) => l.kind === 'production')!;
    expect(c.source).toEqual({ thingId: 'Order', stateName: 'open' });
    expect(c.target.thingId).toBe('Handling');
    expect(pr.source.thingId).toBe('Handling');
    expect(pr.target).toEqual({ thingId: 'Order', stateName: 'closed' });
  });
  it('parses enabling links', () => {
    const m = p('Clerk handles Handling. Handling requires System. Handling occurs if Approval exists.');
    expect(m.things.get('Clerk')!.kind).toBe('object');
    expect(m.links.map((l) => l.kind)).toEqual(['agent', 'instrument', 'condition']);
    const inst = m.links.find((l) => l.kind === 'instrument')!;
    // instrument: 对象→过程
    expect(inst.source.thingId).toBe('System');
    expect(inst.target.thingId).toBe('Handling');
  });
  it('parses condition with state', () => {
    const m = p('Handling occurs if Order is paid.');
    const l = m.links[0];
    expect(l.kind).toBe('condition');
    expect(l.source).toEqual({ thingId: 'Order', stateName: 'paid' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/parse-procedural.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

在 `src/core/opl/parse.ts` 增加：
```ts
function addLinkEndpoints(model: OpmModel, kind: Link['kind'], src: Endpoint, tgt: Endpoint): void {
  model.links.push({ id: `l${++linkSeq}`, kind, source: src, target: tgt });
}

function parseProceduralSentence(model: OpmModel, text: string): boolean {
  const body = text.replace(/\.$/, '').trim();

  // P changes O from s1 to s2.
  let m = /^(.+?)\s+changes\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+)$/i.exec(body);
  if (m) {
    const process = ensureThing(model, m[1]); process.kind = 'process';
    const obj = ensureThing(model, m[2]); obj.kind = 'object';
    const s1 = m[3].trim(), s2 = m[4].trim();
    for (const sn of [s1, s2]) if (!obj.states.some((s) => s.name === sn)) obj.states.push({ name: sn });
    addLinkEndpoints(model, 'consumption', { thingId: obj.id, stateName: s1 }, { thingId: process.id });
    addLinkEndpoints(model, 'production', { thingId: process.id }, { thingId: obj.id, stateName: s2 });
    return true;
  }

  // O is consumed/yielded by P.
  m = /^(.+?)\s+is\s+(consumed|yielded)\s+by\s+(.+)$/i.exec(body);
  if (m) {
    const obj = ensureThing(model, m[1]); obj.kind = 'object';
    const process = ensureThing(model, m[3]); process.kind = 'process';
    // 消耗为 对象→过程；产生为 过程→对象
    if (m[2].toLowerCase() === 'consumed') {
      addLinkEndpoints(model, 'consumption', { thingId: obj.id }, { thingId: process.id });
    } else {
      addLinkEndpoints(model, 'production', { thingId: process.id }, { thingId: obj.id });
    }
    return true;
  }

  // P occurs if O exists. / P occurs if O is s.
  m = /^(.+?)\s+occurs\s+if\s+(.+?)\s+(exists|is\s+(.+))$/i.exec(body);
  if (m) {
    const process = ensureThing(model, m[1]); process.kind = 'process';
    const obj = ensureThing(model, m[2]); obj.kind = 'object';
    const src: Endpoint = m[3].toLowerCase() === 'exists' ? { thingId: obj.id } : { thingId: obj.id, stateName: m[4].trim() };
    addLinkEndpoints(model, 'condition', src, { thingId: process.id });
    return true;
  }

  // A handles P.
  m = /^(.+?)\s+handles\s+(.+)$/i.exec(body);
  if (m) {
    const agent = ensureThing(model, m[1]); agent.kind = 'object';
    const process = ensureThing(model, m[2]); process.kind = 'process';
    addLinkEndpoints(model, 'agent', { thingId: agent.id }, { thingId: process.id });
    return true;
  }

  // P verb O.  (consumes/yields/affects/requires)
  m = /^(.+?)\s+(consumes|yields|affects|requires)\s+(.+)$/i.exec(body);
  if (m) {
    const verb = m[2].toLowerCase();
    const kind = { consumes: 'consumption', yields: 'production', affects: 'effect', requires: 'instrument' }[verb] as Link['kind'];
    const process = ensureThing(model, m[1]); process.kind = 'process';
    const obj = ensureThing(model, m[3]); obj.kind = 'object';
    // 消耗/工具链方向为 对象→过程；产生/影响为 过程→对象
    if (verb === 'consumes' || verb === 'requires') {
      addLinkEndpoints(model, kind, { thingId: obj.id }, { thingId: process.id });
    } else {
      addLinkEndpoints(model, kind, { thingId: process.id }, { thingId: obj.id });
    }
    return true;
  }

  return false;
}
```
（`Endpoint` 类型加入 import。）

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/parse-procedural.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/parse.ts test/parse-procedural.spec.ts
git commit -m "feat: parse OPL procedural links"
```

---

### Task 8: 解析器 —— 标签链接、主循环接线与 kind 推断告警

**Files:**
- Modify: `src/core/opl/parse.ts`
- Test: `test/parse-tagged.spec.ts`

**Interfaces:**
- Produces: 主循环顺序：实体 → 结构 → 过程 → 标签 → 未识别（`unrecognized-sentence` warning）。标签链接识别 `A <tag> B.`（含两个已声明事物，中间为未知词）。`unknown-kind` 告警在解析末尾对仍为 `unknown` 的事物发出。

- [ ] **Step 1: 写失败的测试**

`test/parse-tagged.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';

const p = (s: string) => parseOpl('opm\n' + s);

describe('parse tagged links and diagnostics', () => {
  it('parses tagged link between declared things', () => {
    const m = p('Driver is physical. Console is physical. Driver communicates via Console.');
    const t = m.links.find((l) => l.kind === 'tagged')!;
    expect(t.tag).toBe('communicates via');
    expect(t.source.thingId).toBe('Driver');
    expect(t.target.thingId).toBe('Console');
  });
  it('warns on unrecognized sentence', () => {
    const m = p('Console is physical.\nFoo bar baz.');
    expect(m.diagnostics.some((d) => d.code === 'unrecognized-sentence')).toBe(true);
    expect(m.diagnostics[0].line).toBe(3);
  });
  it('warns on unknown kind', () => {
    const m = p('Mystery is informatical.');
    expect(m.diagnostics.some((d) => d.code === 'unknown-kind')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/parse-tagged.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

在 `src/core/opl/parse.ts` 增加：
```ts
function parseTaggedSentence(model: OpmModel, text: string): boolean {
  const body = text.replace(/\.$/, '').trim();
  const names = [...model.things.keys()].sort((a, b) => b.length - a.length);
  for (const a of names) {
    if (!body.startsWith(a + ' ')) continue;
    const afterA = body.slice(a.length + 1);
    for (const b of names) {
      if (a === b) continue;
      if (afterA.endsWith(' ' + b)) {
        const tag = afterA.slice(0, afterA.length - b.length - 1).trim();
        if (tag && !RESERVED.has(tag.toLowerCase())) {
          addLink(model, 'tagged', a, b, tag);
          return true;
        }
      }
    }
  }
  return false;
}
```

主循环（替换 `parseOpl` 内循环）：
```ts
for (const sentence of splitSentences(source)) {
  const t = sentence.text;
  if (parseEntitySentence(model, t)) continue;
  if (parseStructuralSentence(model, t)) continue;
  if (parseProceduralSentence(model, t)) continue;
  if (parseTaggedSentence(model, t)) continue;
  model.diagnostics.push({ severity: 'warning', code: 'unrecognized-sentence', message: `Unrecognized OPL sentence: ${t}`, line: sentence.line, column: sentence.column });
}
for (const thing of model.things.values()) {
  if (thing.kind === 'unknown') {
    model.diagnostics.push({ severity: 'warning', code: 'unknown-kind', message: `Cannot infer object/process for "${thing.name}"`, line: 1, column: 1 });
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/parse-tagged.spec.ts && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/opl/parse.ts test/parse-tagged.spec.ts
git commit -m "feat: parse tagged links, wire parser pipeline, unknown-kind warnings"
```

---

### Task 9: 校验规则

**Files:**
- Create: `src/core/model/validate.ts`
- Test: `test/validate.spec.ts`

**Interfaces:**
- Consumes: `parseOpl`、`OpmModel`。
- Produces: `function validate(model: OpmModel): void`，追加诊断：
  - `unknown-reference`（链接端点不在 `things` 中，warning）
  - `process-no-io`（process 无 input/output，warning）
  - `reserved-name`（名字是保留字，error）

- [ ] **Step 1: 写失败的测试**

`test/validate.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';
import { validate } from '../src/core/model/validate.js';

describe('validate', () => {
  it('flags a process with no input/output', () => {
    const m = parseOpl('opm\nHandle handles Order.');
    validate(m);
    expect(m.diagnostics.some((d) => d.code === 'process-no-io' && d.severity === 'warning')).toBe(true);
  });
  it('does not flag a connected process', () => {
    const m = parseOpl('opm\nHandling consumes Order.\nHandling yields Receipt.');
    validate(m);
    expect(m.diagnostics.some((d) => d.code === 'process-no-io')).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/validate.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/core/model/validate.ts`:
```ts
import { RESERVED } from '../opl/reserved.js';
import type { OpmModel } from './types.js';

export function validate(model: OpmModel): void {
  for (const thing of model.things.values()) {
    if (RESERVED.has(thing.name.toLowerCase())) {
      model.diagnostics.push({ severity: 'error', code: 'reserved-name', message: `"${thing.name}" is a reserved word`, line: 1, column: 1 });
    }
  }
  for (const link of model.links) {
    for (const ep of [link.source, link.target]) {
      if (!model.things.has(ep.thingId)) {
        model.diagnostics.push({ severity: 'warning', code: 'unknown-reference', message: `Unknown reference "${ep.thingId}"`, line: 1, column: 1 });
      }
    }
  }
  for (const thing of model.things.values()) {
    if (thing.kind !== 'process') continue;
    const hasIO = model.links.some(
      (l) => (l.kind === 'consumption' && l.target.thingId === thing.id) ||
             (l.kind === 'production' && l.source.thingId === thing.id)
    );
    if (!hasIO) {
      model.diagnostics.push({ severity: 'warning', code: 'process-no-io', message: `Process "${thing.name}" has no input or output`, line: 1, column: 1 });
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/validate.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/core/model/validate.ts test/validate.spec.ts
git commit -m "feat: add OPM model validation rules"
```

---

### Task 10: 布局（dagre 适配器 → Scene）

**Files:**
- Create: `src/layout/types.ts`
- Create: `src/layout/dagreAdapter.ts`
- Create: `src/layout/index.ts`
- Test: `test/layout.spec.ts`

**Interfaces:**
- Consumes: `OpmModel`。
- Produces:
  - `interface SceneNode { id: string; thingId: string; kind: 'object'|'process'; label: string; states: string[]; x: number; y: number; width: number; height: number }`
  - `interface SceneEdge { id: string; kind: LinkKind; source: string; target: string; points: { x: number; y: number }[]; sourceState?: string; targetState?: string }`
  - `interface Scene { nodes: SceneNode[]; edges: SceneEdge[]; width: number; height: number }`
  - `interface LayoutEngine { layout(model: OpmModel): Scene }`
  - `function layout(model: OpmModel): Scene`（默认 dagre 有向 LR）

- [ ] **Step 1: 写失败的测试**

`test/layout.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseOpl } from '../src/core/opl/parse.js';
import { layout } from '../src/layout/index.js';

describe('layout', () => {
  it('produces a node per thing and no overlapping nodes', () => {
    const m = parseOpl('opm\nHandling consumes Order.\nHandling yields Receipt.');
    const s = layout(m);
    expect(s.nodes.map((n) => n.thingId).sort()).toEqual(['Handling', 'Order', 'Receipt']);
    for (let i = 0; i < s.nodes.length; i++) {
      for (let j = i + 1; j < s.nodes.length; j++) {
        const a = s.nodes[i], b = s.nodes[j];
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${a.thingId} overlaps ${b.thingId}`).toBe(false);
      }
    }
  });
  it('emits one edge per link with points', () => {
    const m = parseOpl('opm\nHandling consumes Order.');
    const s = layout(m);
    expect(s.edges).toHaveLength(1);
    expect(s.edges[0].points.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/layout.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/layout/types.ts`:
```ts
import type { LinkKind, OpmModel } from '../core/model/types.js';

export interface SceneNode {
  id: string; thingId: string; kind: 'object' | 'process';
  label: string; states: string[];
  x: number; y: number; width: number; height: number;
}
export interface SceneEdge {
  id: string; kind: LinkKind; source: string; target: string;
  points: { x: number; y: number }[];
  sourceState?: string; targetState?: string;
}
export interface Scene { nodes: SceneNode[]; edges: SceneEdge[]; width: number; height: number }
export interface LayoutEngine { layout(model: OpmModel): Scene }
```

`src/layout/dagreAdapter.ts`:
```ts
import dagre from '@dagrejs/dagre';
import type { OpmModel } from '../core/model/types.js';
import type { Scene, SceneEdge, SceneNode } from './types.js';

const NODE_W = 140;
const ROW_H = 22;
const PAD = 20;

export function dagreLayout(model: OpmModel): Scene {
  // multigraph: 同一对节点间可能有多条链（如 requires 与 affects 同为 Process→Object）
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80, marginx: PAD, marginy: PAD });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: SceneNode[] = [];
  for (const thing of model.things.values()) {
    if (thing.kind === 'unknown') continue;
    const stateRows = thing.kind === 'object' ? Math.max(thing.states.length, 1) : 1;
    const height = Math.max(40, stateRows * ROW_H + 18);
    const node: SceneNode = {
      id: thing.id, thingId: thing.id, kind: thing.kind,
      label: thing.name, states: thing.states.map((s) => s.name),
      x: 0, y: 0, width: NODE_W, height,
    };
    nodes.push(node);
    g.setNode(thing.id, { width: node.width, height: node.height });
  }

  const edges: SceneEdge[] = [];
  for (const link of model.links) {
    if (!g.hasNode(link.source.thingId) || !g.hasNode(link.target.thingId)) continue;
    const e: SceneEdge = {
      id: link.id, kind: link.kind,
      source: link.source.thingId, target: link.target.thingId,
      points: [], sourceState: link.source.stateName, targetState: link.target.stateName,
    };
    edges.push(e);
    g.setEdge(link.source.thingId, link.target.thingId, { id: link.id }, link.id);
  }

  dagre.layout(g);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const id of g.nodes()) {
    const n = byId.get(id); const gn = g.node(id);
    if (!n || !gn) continue;
    n.x = gn.x - gn.width / 2;
    n.y = gn.y - gn.height / 2;
    n.width = gn.width; n.height = gn.height;
  }
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  for (const ge of g.edges()) {
    const e = edgeById.get((g.edge(ge) as { id: string }).id);
    if (e) e.points = (g.edge(ge) as { points: { x: number; y: number }[] }).points ?? [];
  }
  const graph = g.graph();
  return { nodes, edges, width: (graph.width ?? 0) + PAD * 2, height: (graph.height ?? 0) + PAD * 2 };
}
```

`src/layout/index.ts`:
```ts
import type { OpmModel } from '../core/model/types.js';
import { dagreLayout } from './dagreAdapter.js';
import type { Scene } from './types.js';

export type { Scene, SceneEdge, SceneNode, LayoutEngine } from './types.js';

export function layout(model: OpmModel): Scene {
  return dagreLayout(model);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/layout.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/layout test/layout.spec.ts
git commit -m "feat: dagre layout adapter producing scene graph"
```

---

### Task 11: 渲染 —— 主题与节点形状

**Files:**
- Create: `src/render/theme.ts`
- Create: `src/render/shapes.ts`
- Test: `test/render-shapes.spec.ts`

**Interfaces:**
- Consumes: `SceneNode`。
- Produces:
  - `interface Theme { objectFill: string; objectStroke: string; processFill: string; processStroke: string; textColor: string; lineColor: string; fontSize: number }`
  - `const defaultTheme: Theme`
  - `function objectShape(node: SceneNode, theme: Theme): string`
  - `function processShape(node: SceneNode, theme: Theme): string`
  - `function nodeSvg(node: SceneNode, theme: Theme): string`（按 kind 分发）

- [ ] **Step 1: 写失败的测试**

`test/render-shapes.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { objectShape, processShape, defaultTheme } from '../src/render/shapes.js';
import type { SceneNode } from '../src/layout/types.js';

const obj: SceneNode = { id: 'Order', thingId: 'Order', kind: 'object', label: 'Order', states: ['open', 'closed'], x: 10, y: 20, width: 140, height: 60 };
const proc: SceneNode = { id: 'P', thingId: 'P', kind: 'process', label: 'P', states: [], x: 0, y: 0, width: 140, height: 44 };
const theme = defaultTheme;

describe('node shapes', () => {
  it('object is a rect with state separators', () => {
    const s = objectShape(obj, theme);
    expect(s).toContain('<rect');
    expect(s.match(/<line/g)?.length).toBe(1); // 2 states → 1 separ器
    expect(s).toContain('open');
    expect(s).toContain('closed');
  });
  it('object without states shows its name once', () => {
    const noState: SceneNode = { ...obj, states: [] };
    const s = objectShape(noState, theme);
    expect(s.match(/>Order<\/text>/g)?.length).toBe(1);
  });
  it('process is an ellipse', () => {
    expect(processShape(proc, theme)).toContain('<ellipse');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/render-shapes.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/render/theme.ts`:
```ts
export interface Theme {
  objectFill: string; objectStroke: string;
  processFill: string; processStroke: string;
  textColor: string; lineColor: string; fontSize: number;
}
export const defaultTheme: Theme = {
  objectFill: '#eef6ff', objectStroke: '#3355aa',
  processFill: '#fff6ee', processStroke: '#aa5533',
  textColor: '#1a1a1a', lineColor: '#444444', fontSize: 13,
};
```

`src/render/shapes.ts`:
```ts
import type { SceneNode } from '../layout/types.js';
import type { Theme } from './theme.js';
export { defaultTheme } from './theme.js';
export type { Theme } from './theme.js';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function objectShape(node: SceneNode, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const parts: string[] = [];
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0" fill="${theme.objectFill}" stroke="${theme.objectStroke}" stroke-width="1.5"/>`);
  const rows = node.states.length;
  if (rows > 1) {
    const rowH = h / rows;
    for (let i = 1; i < rows; i++) {
      const ly = y + rowH * i;
      parts.push(`<line x1="${x}" y1="${ly}" x2="${x + w}" y2="${ly}" stroke="${theme.objectStroke}" stroke-width="1"/>`);
    }
  }
  if (rows > 0) {
    const rowH = h / rows;
    for (let i = 0; i < rows; i++) {
      parts.push(`<text x="${x + w / 2}" y="${y + rowH * i + rowH / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.states[i])}</text>`);
    }
    // 有状态时：对象名作为标题置于矩形上方，格内显示状态名
    parts.push(`<text x="${x + w / 2}" y="${y - 6}" text-anchor="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`);
  } else {
    // 无状态时：对象名居中显示一次
    parts.push(`<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`);
  }
  return parts.join('');
}

export function processShape(node: SceneNode, theme: Theme): string {
  const cx = node.x + node.width / 2, cy = node.y + node.height / 2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${theme.processFill}" stroke="${theme.processStroke}" stroke-width="1.5"/>` +
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${theme.fontSize}" fill="${theme.textColor}">${esc(node.label)}</text>`;
}

export function nodeSvg(node: SceneNode, theme: Theme): string {
  return node.kind === 'process' ? processShape(node, theme) : objectShape(node, theme);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/render-shapes.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/render/theme.ts src/render/shapes.ts test/render-shapes.spec.ts
git commit -m "feat: theme and node shape rendering"
```

---

### Task 12: 渲染 —— 记号与链

**Files:**
- Create: `src/render/markers.ts`
- Create: `src/render/notation.ts`
- Test: `test/render-notation.spec.ts`

**Interfaces:**
- Consumes: `SceneEdge`, `Theme`。
- Produces:
  - `function arrowMarker(kind: 'filled'|'open', theme: Theme, id: string): string`（`<marker>` defs）
  - `const markerDefs: (theme: Theme) => string`（聚合/泛化/展示/分类/填充箭头/开放箭头/实心圆/空心圆）
  - `function edgeSvg(edge: SceneEdge, theme: Theme): string`（折线 + 端点记号）
  - 端点记号规则（spec §8）：
    - consumption/production/input-output：实心箭头指向各自目标
    - effect：双端实心箭头
    - agent：实心圆（过程端）
    - instrument：空心圆（过程端）
    - condition：开放箭头（过程端）
    - aggregation：实心三角（指向整体/source）
    - generalization：空心三角（指向一般/source）
    - exhibition：三角含实心三角（指向 source）
    - classification：三角含实心圆点（指向 source）
    - tagged：开放箭头（单/双）

- [ ] **Step 1: 写失败的测试**

`test/render-notation.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { markerDefs, edgeSvg } from '../src/render/notation.js';
import { defaultTheme } from '../src/render/theme.js';
import type { SceneEdge } from '../src/layout/types.js';

const edge = (kind: SceneEdge['kind']): SceneEdge => ({
  id: 'e1', kind, source: 'A', target: 'B',
  points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
});

describe('notation', () => {
  it('markerDefs defines all needed markers', () => {
    const d = markerDefs(defaultTheme);
    for (const id of ['arrow-filled', 'arrow-open', 'tri-filled', 'tri-open', 'tri-dot', 'tri-tri', 'circle-fill', 'circle-open']) {
      expect(d).toContain(`id="${id}"`);
    }
  });
  it('consumption edge uses filled arrow at target', () => {
    const s = edgeSvg(edge('consumption'), defaultTheme);
    expect(s).toContain('marker-end="url(#arrow-filled)"');
  });
  it('effect edge has arrows on both ends', () => {
    const s = edgeSvg(edge('effect'), defaultTheme);
    expect(s).toContain('marker-start="url(#arrow-filled)"');
    expect(s).toContain('marker-end="url(#arrow-filled)"');
  });
  it('agent edge ends with filled circle', () => {
    expect(edgeSvg(edge('agent'), defaultTheme)).toContain('marker-end="url(#circle-fill)"');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/render-notation.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/render/markers.ts`:
```ts
import type { Theme } from './theme.js';

export function markerDefs(theme: Theme): string {
  const lc = theme.lineColor;
  return `<defs>
  <marker id="arrow-filled" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 z" fill="${lc}"/></marker>
  <marker id="arrow-open" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,4 L0,8" fill="none" stroke="${lc}" stroke-width="1.5"/></marker>
  <marker id="tri-filled" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="${lc}" stroke="${lc}"/></marker>
  <marker id="tri-open" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#ffffff" stroke="${lc}" stroke-width="1.5"/></marker>
  <marker id="tri-dot" markerWidth="14" markerHeight="14" refX="11" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L11,6 L0,12 z" fill="#ffffff" stroke="${lc}" stroke-width="1.5"/><circle cx="5" cy="6" r="2.2" fill="${lc}"/></marker>
  <marker id="tri-tri" markerWidth="14" markerHeight="14" refX="11" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L11,6 L0,12 z" fill="#ffffff" stroke="${lc}" stroke-width="1.5"/><path d="M3.5,3.5 L8,6 L3.5,8.5 z" fill="${lc}"/></marker>
  <marker id="circle-fill" markerWidth="10" markerHeight="10" refX="4" refY="5" orient="auto" markerUnits="strokeWidth"><circle cx="5" cy="5" r="4" fill="${lc}"/></marker>
  <marker id="circle-open" markerWidth="10" markerHeight="10" refX="4" refY="5" orient="auto" markerUnits="strokeWidth"><circle cx="5" cy="5" r="3.5" fill="#ffffff" stroke="${lc}" stroke-width="1.5"/></marker>
</defs>`;
}
```

`src/render/notation.ts`:
```ts
import type { SceneEdge } from '../layout/types.js';
import type { Theme } from './theme.js';

export { markerDefs } from './markers.js';

function markers(kind: SceneEdge['kind']): { start?: string; end?: string } {
  switch (kind) {
    case 'consumption':
    case 'production':
    case 'input-output':
      return { end: 'arrow-filled' };
    case 'effect':
      return { start: 'arrow-filled', end: 'arrow-filled' };
    case 'agent':
      return { end: 'circle-fill' };
    case 'instrument':
      return { end: 'circle-open' };
    case 'condition':
      return { end: 'arrow-open' };
    case 'tagged':
      return { start: 'arrow-open', end: 'arrow-open' };
    default:
      // 结构链接（aggregation/generalization/exhibition/classification）
      // 的三角记号由 sceneToSvg 的 structuralMarker 在对应端点绘制
      return {};
  }
}

export function edgeSvg(edge: SceneEdge, theme: Theme): string {
  if (edge.points.length < 2) return '';
  const pts = edge.points.map((p) => `${p.x},${p.y}`).join(' ');
  const mk = markers(edge.kind);
  const attrs: string[] = [
    `points="${pts}"`, 'fill="none"', `stroke="${theme.lineColor}"`, 'stroke-width="1.5"',
  ];
  if (mk.start) attrs.push(`marker-start="url(#${mk.start})"`);
  if (mk.end) attrs.push(`marker-end="url(#${mk.end})"`);
  return `<polyline ${attrs.join(' ')}/><title>${edge.kind}</title>`;
}
```
（结构链接的 `*Entity` 记号在 Task 13 中于端点处绘制三角，见 `sceneToSvg`。）

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/render-notation.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/render/markers.ts src/render/notation.ts test/render-notation.spec.ts
git commit -m "feat: link markers and notation"
```

---

### Task 13: sceneToSvg 整合与黄金快照

**Files:**
- Create: `src/render/sceneToSvg.ts`
- Modify: `src/index.ts`
- Test: `test/render-snapshot.spec.ts`

**Interfaces:**
- Consumes: `Scene`, `nodeSvg`, `edgeSvg`, `markerDefs`, `Theme`。
- Produces:
  - `function sceneToSvg(scene: Scene, theme?: Theme): string`（含 `<svg viewBox>`、`markerDefs`、节点、边；结构链接在 source 端绘制三角记号；DOM-free）
  - `src/index.ts` 导出 `renderSvg(source: string, opts?: { theme?: Theme; strict?: boolean }): string` 与 `renderModel(source: string): OpmModel`

- [ ] **Step 1: 写失败的测试**

`test/render-snapshot.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderSvg } from '../src/index.js';

describe('sceneToSvg', () => {
  it('renders a full svg document', () => {
    // 含结构链接，以覆盖 structuralMarker 的端点与旋转
    const svg = renderSvg(
      'opm\nOrder is physical.\nHandling handles Order.\nHandling consumes Order.\nHandling yields Receipt.' +
      '\nWhole consists of Order.\nSpecial is a General.'
    );
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('Handling');
    expect(svg).toContain('<defs>');
    expect(svg).toContain('rotate('); // 结构三角已绘制
    expect(svg).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/render-snapshot.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/render/sceneToSvg.ts`:
```ts
import type { Scene, SceneEdge } from '../layout/types.js';
import { nodeSvg } from './shapes.js';
import { edgeSvg, markerDefs } from './notation.js';
import { defaultTheme, type Theme } from './theme.js';

const STRUCTURAL = new Set(['aggregation', 'generalization', 'exhibition', 'classification']);
// 三角记号指向的端点：泛化指向一般（target），分类指向类（target）；聚合指向整体（source），展示指向展示者（source）
const MARKER_AT_TARGET = new Set(['generalization', 'classification']);

// 三角尖端位于局部原点、主体向局部 -x 延伸；经 rotate 后 -x 指向连线内侧，
// 使三角位于节点之外，避免被后绘制的节点矩形遮挡。
function triangleInner(kind: string, theme: Theme): string {
  if (kind === 'exhibition') {
    return `<path d="M0,0 L-14,7 L0,14 z" fill="#ffffff" stroke="${theme.lineColor}" stroke-width="2"/><path d="M-4,4 L-10,7 L-4,10 z" fill="${theme.lineColor}"/>`;
  }
  if (kind === 'classification') {
    return `<path d="M0,0 L-14,7 L0,14 z" fill="#ffffff" stroke="${theme.lineColor}" stroke-width="2"/><circle cx="-6" cy="7" r="2.5" fill="${theme.lineColor}"/>`;
  }
  const fill = kind === 'aggregation' ? theme.lineColor : '#ffffff';
  return `<path d="M0,0 L-14,7 L0,14 z" fill="${fill}" stroke="${theme.lineColor}" stroke-width="2"/>`;
}

function structuralMarker(edge: SceneEdge, theme: Theme): string {
  if (!STRUCTURAL.has(edge.kind) || edge.points.length < 2) return '';
  const atTarget = MARKER_AT_TARGET.has(edge.kind);
  const node = atTarget ? edge.points[edge.points.length - 1] : edge.points[0];
  const neighbor = atTarget ? edge.points[edge.points.length - 2] : edge.points[1];
  // 让三角尖端（路径 +x 方向）朝向所连接的节点
  const angle = Math.atan2(node.y - neighbor.y, node.x - neighbor.x) * 180 / Math.PI;
  return `<g transform="translate(${node.x},${node.y}) rotate(${angle})">${triangleInner(edge.kind, theme)}</g>`;
}

export function sceneToSvg(scene: Scene, theme: Theme = defaultTheme): string {
  const body: string[] = [];
  body.push(markerDefs(theme));
  for (const edge of scene.edges) {
    body.push(edgeSvg(edge, theme));
    if (STRUCTURAL.has(edge.kind)) body.push(structuralMarker(edge, theme));
  }
  for (const node of scene.nodes) body.push(nodeSvg(node, theme));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(scene.width)} ${Math.ceil(scene.height)}" width="${Math.ceil(scene.width)}" height="${Math.ceil(scene.height)}" role="img">${body.join('')}</svg>`;
}
```

`src/index.ts`（替换为）：
```ts
import { parseOpl, type ParseOptions } from './core/opl/parse.js';
import { validate } from './core/model/validate.js';
import { layout } from './layout/index.js';
import { sceneToSvg } from './render/sceneToSvg.js';
import type { Theme } from './render/theme.js';
import type { OpmModel } from './core/model/types.js';

export const VERSION = '0.1.0';
export type { OpmModel } from './core/model/types.js';
export type { Scene } from './layout/types.js';
export type { Theme } from './render/theme.js';

export function renderModel(source: string, opts: ParseOptions = {}): OpmModel {
  const model = parseOpl(source, opts);
  validate(model);
  return model;
}

export function renderSvg(source: string, opts: { theme?: Theme; strict?: boolean } = {}): string {
  const model = renderModel(source, { strict: opts.strict });
  return sceneToSvg(layout(model), opts.theme);
}
```

- [ ] **Step 4: 运行测试并更新快照**

Run: `npx vitest run test/render-snapshot.spec.ts -u`
Expected: PASS（首次生成快照）。人工检查快照 SVG 结构合理。

- [ ] **Step 5: 提交**

```bash
git add src/render/sceneToSvg.ts src/index.ts test/render-snapshot.spec.ts test/__snapshots__
git commit -m "feat: scene to SVG rendering and public API"
```

---

### Task 14: Mermaid 外部图插件接线

**Files:**
- Create: `src/mermaid/detector.ts`
- Create: `src/mermaid/db.ts`
- Create: `src/mermaid/renderer.ts`
- Create: `src/mermaid/styles.ts`
- Create: `src/mermaid/diagram.ts`
- Create: `src/mermaid/index.ts`
- Delete: `src/mermaid/spikeDiagram.ts`（spike 完成使命）
- Test: `test/mermaid-integration.spec.ts`

**Interfaces:**
- Consumes: `renderModel`, `layout`, `sceneToSvg`。Task 2 确认的 draw 机制。
- Produces:
  - `const id = 'opm'`
  - `const detector`（`/^\s*opm(?:\s|$)/`）
  - `const loader`（动态 import `./diagram.js`）
  - `export const opm: ExternalDiagramDefinition`
  - `function registerOpm(): Promise<void>`（`mermaid.registerExternalDiagrams([opm], { lazyLoad: false })`）

- [ ] **Step 1: 写失败的测试**

`test/mermaid-integration.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import mermaid from 'mermaid';
import { registerOpm } from '../src/mermaid/index.js';

describe('opm mermaid plugin', () => {
  it('registers and renders an OPD', async () => {
    await registerOpm();
    const { svg } = await mermaid.render('opmtest', 'opm\nOrder is physical.\nHandling handles Order.\nHandling consumes Order.\nHandling yields Receipt.');
    expect(svg).toContain('Handling');
    expect(svg).toContain('Order');
    expect(svg).toContain('<ellipse');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/mermaid-integration.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/mermaid/detector.ts`:
```ts
import type { DiagramDetector } from 'mermaid';
export const opmDetector: DiagramDetector = (txt: string) => /^\s*opm(?:\s|$)/.test(txt);
```

`src/mermaid/db.ts`:
```ts
import { renderModel, type OpmModel } from '../index.js';

export class OpmDb {
  private model: OpmModel | null = null;
  setSource(source: string): void { this.model = renderModel(source); }
  getModel(): OpmModel | null { return this.model; }
  clear(): void { this.model = null; }
}
```

`src/mermaid/renderer.ts`:
```ts
import { renderModel, type OpmModel } from '../index.js';
import { layout } from '../layout/index.js';
import { sceneToSvg } from '../render/sceneToSvg.js';

export const opmRenderer = {
  draw: (text: string, id: string, _version: string, diagramObject: { db: { getModel(): OpmModel | null } }) => {
    const model = diagramObject.db.getModel() ?? renderModel(text);
    const svg = sceneToSvg(layout(model));
    const target = document.getElementById(id);
    if (!target) return;
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    target.setAttribute('viewBox', svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100');
    target.setAttribute('width', svg.match(/width="([^"]+)"/)?.[1] ?? '100');
    target.setAttribute('height', svg.match(/height="([^"]+)"/)?.[1] ?? '100');
    target.innerHTML = (svg.match(/<defs>[\s\S]*?<\/defs>/) ?? [''])[0] + inner;
  },
};
```

`src/mermaid/styles.ts`:
```ts
export default function getStyles(options: { lineColor?: string; primaryTextColor?: string } = {}): string {
  return `
    .opm-node rect, .opm-node ellipse { stroke-width: 1.5; }
    .opm-edge { stroke: ${options.lineColor ?? '#444'}; }
  `;
}
```

`src/mermaid/diagram.ts`:
```ts
import type { DiagramDefinition } from 'mermaid';
import { opmRenderer } from './renderer.js';
import getStyles from './styles.js';
import { OpmDb } from './db.js';

// 共享 db + clear() 是官方支持的形态（详见 spec §9 与官方 new-diagram 文档 Step 2）。
// Mermaid 在每次解析前调用 db.clear()，因此不会跨渲染泄漏。
const db = new OpmDb();

export const diagram: DiagramDefinition = {
  parser: { parse: (text: string) => { db.setSource(text); } },
  db,
  renderer: opmRenderer,
  styles: getStyles,
};
```

`src/mermaid/index.ts`:
```ts
import type { ExternalDiagramDefinition, DiagramLoader } from 'mermaid';
import { opmDetector } from './detector.js';

const id = 'opm';
const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};
export const opm: ExternalDiagramDefinition = { id, detector: opmDetector, loader };

export async function registerOpm(): Promise<void> {
  const mermaid = (await import('mermaid')).default;
  await mermaid.registerExternalDiagrams([opm], { lazyLoad: false });
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/mermaid-integration.spec.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/mermaid test/mermaid-integration.spec.ts
git rm --cached src/mermaid/spikeDiagram.ts 2>/dev/null; git add -A src/mermaid
git commit -m "feat: register mermaid external diagram for OPM"
```

---

### Task 15: CLI `opm2svg`

**Files:**
- Create: `src/cli/cli.ts`
- Test: `test/cli.spec.ts`

**Interfaces:**
- Consumes: `renderSvg`, `renderModel`。
- Produces: `function runCli(argv: string[]): Promise<number>`（`0` 无 error 诊断，`1` 有 error 或参数错误）；`bin` 入口读取文件、写 SVG、可选 `--json`。

- [ ] **Step 1: 写失败的测试**

`test/cli.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli/cli.js';

describe('cli', () => {
  it('converts opl to svg and json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    const inFile = join(dir, 'm.opl');
    const svgFile = join(dir, 'm.svg');
    const jsonFile = join(dir, 'm.json');
    writeFileSync(inFile, 'opm\nHandling consumes Order.\nHandling yields Receipt.', 'utf8');
    const code = await runCli([inFile, '-o', svgFile, '--json', jsonFile]);
    expect(code).toBe(0);
    expect(readFileSync(svgFile, 'utf8')).toContain('<svg');
    expect(JSON.parse(readFileSync(jsonFile, 'utf8')).links.length).toBe(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/cli.spec.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

`src/cli/cli.ts`:
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { renderSvg, renderModel } from '../index.js';

export async function runCli(argv: string[]): Promise<number> {
  const [input, ...rest] = argv;
  if (!input) { process.stderr.write('usage: opm2svg <input.opl> [-o out.svg] [--json out.json]\n'); return 1; }
  let out = input.replace(/\.opl$/i, '') + '.svg';
  let jsonOut: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-o') out = rest[++i];
    else if (rest[i] === '--json') jsonOut = rest[++i];
  }
  const source = readFileSync(input, 'utf8');
  const model = renderModel(source);
  writeFileSync(out, renderSvg(source), 'utf8');
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ things: [...model.things.values()], links: model.links, diagnostics: model.diagnostics }, null, 2), 'utf8');
  }
  const hasError = model.diagnostics.some((d) => d.severity === 'error');
  for (const d of model.diagnostics) process.stderr.write(`${d.severity}: ${d.code} @${d.line}:${d.column} ${d.message}\n`);
  return hasError ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).then((c) => process.exit(c));
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/cli.spec.ts && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/cli/cli.ts test/cli.spec.ts
git commit -m "feat: opm2svg CLI with --json export"
```

---

### Task 16: 文档、示例与 docs-spec 测试

**Files:**
- Create: `README.md`
- Create: `demo/index.html`
- Create: `demo/samples/onstar.opl`
- Create: `test/docs.spec.ts`

**Interfaces:**
- Consumes: `renderSvg`。
- Produces: README 含用法、支持/不支持范围、已知限制；docs spec 从 README 提取 ```opm 代码块并断言可渲染。

- [ ] **Step 1: 写失败的测试**

`test/docs.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderSvg } from '../src/index.js';

describe('docs examples', () => {
  it('every ```opm block in README renders', () => {
    const md = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
    const blocks = [...md.matchAll(/```opm\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(renderSvg(b)).toContain('<svg');
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run test/docs.spec.ts`
Expected: FAIL（README 不存在）

- [ ] **Step 3: 写文档与示例**

`demo/samples/onstar.opl`:
```
opm
Driver is physical and environmental.
Driver is initial.
Order is physical.
Handling handles Order.
Handling requires System.
Clerk handles Handling.
Handling consumes Order.
Handling yields Receipt.
Receipt is an instance of Document.
```

`README.md`（要点，含至少一个 ```opm 块）：
```markdown
# mermaid-opm

Render ISO 19450 OPM/OPL into Object-Process Diagrams (OPD) as a Mermaid external diagram plugin, plus a CLI.

## Mermaid plugin

```js
import mermaid from 'mermaid';
import { registerOpm } from 'mermaid-opm';
await registerOpm();
const { svg } = await mermaid.render('d', source);
```

```opm
Order is physical.
Handling handles Order.
Handling consumes Order.
Handling yields Receipt.
```

## CLI

```bash
opm2svg model.opl -o model.svg [--json model.json]
```

## Supported

- Entities: object, process, states (initial/final)
- Structural: aggregation, exhibition, generalization, classification, tagged
- Procedural: consumption, production, effect, input-output, agent, instrument, condition

## Not supported (v1)

- multiple OPDs / in-zoom / unfold
- event/result/invocation links
- graphical editing or layout persistence

## Known limitations

- External Mermaid diagrams require the host page to load this plugin; fixed renderers such as GitHub Markdown will not load it. Use the CLI to produce SVG.
```

`demo/index.html`:
```html
<!doctype html>
<html><head><meta charset="utf-8"><title>mermaid-opm demo</title></head>
<body>
<pre id="src">opm
Order is physical.
Handling handles Order.
Handling consumes Order.
Handling yields Receipt.</pre>
<div class="mermaid"></div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs';
  import { registerOpm } from '../dist/mermaid-opm.mjs';
  await registerOpm();
  document.querySelector('.mermaid').textContent = document.getElementById('src').textContent;
  mermaid.initialize({ startOnLoad: false });
  await mermaid.run();
</script>
</body></html>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run test/docs.spec.ts && npm run typecheck && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add README.md demo test/docs.spec.ts
git commit -m "docs: README, demo, and executable docs example test"
```

---

## Self-Review

**Spec coverage（spec § → 任务）**
- §5.1 词法 → Task 4；§5.2 实体/状态/初终态 → Task 5；§5.3 结构 → Task 6；§5.3 过程 → Task 7；§5.3 标签 → Task 8；§5.4 歧义（`is a` 优先）→ Task 6 正则顺序 + Task 8 主循环顺序。
- §6 模型/校验 → Task 3、9（`unknown-reference`/`process-no-io`/`reserved-name`；`unknown-kind` 在 Task 8 发出）。
- §7 布局 → Task 10。§8 渲染记法 → Task 11、12、13。§9 Mermaid 集成 → Task 2、14。§10 CLI → Task 15。§11 测试 → 各任务 + Task 16 docs spec。§12 打包 → Task 1、16。
- §3.2/§3.3 边界与限制 → Task 16 README。

**Placeholder scan**：计划中无 TBD/TODO；结构链接端点的三角绘制在 Task 13 的 `structuralMarker` 给出完整实现；parser/db 采用官方支持的"共享 db + `clear()`"形态（Task 14，附官方依据）。

**Type consistency**：`LinkKind`/`Endpoint`/`OpmModel`（Task 3）在 Task 5-10 一致；`Scene`/`SceneNode`/`SceneEdge`（Task 10）在 Task 11-14 一致；`Theme`（Task 11）在 Task 12-14 一致；`renderModel`/`renderSvg`（Task 13）在 Task 14/15 一致。
