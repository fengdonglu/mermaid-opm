# Getting started

English | [中文](getting-started.zh.md)

`mermaid-opm` turns a small English-like OPL dialect into Object-Process Diagrams
(OPD). You can use it in two ways:

- as a **Mermaid external diagram plugin** in the browser, or
- as the **`opm2svg` CLI** for batch conversion and CI.

## Install (not published yet)

`mermaid-opm` is **not published to npm yet**. Build it from the repository:

```bash
git clone https://github.com/fengdonglu/mermaid-opm
cd mermaid-opm
npm install
npm run build
```

`mermaid` (>= 11) is an optional peer dependency: you only need it for the
plugin. The CLI and the library work without it.

## Minimal plugin example

Register the external diagram before rendering, and disable Mermaid's auto-run
*before* the first `await` (see [Mermaid plugin](mermaid-plugin.md)):

```js
import mermaid from 'mermaid';
import { registerOpm } from './dist/mermaid-opm.mjs'; // the built browser bundle

mermaid.initialize({ startOnLoad: false });
await registerOpm();

const { svg } = await mermaid.render('d', `
opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
`);
document.querySelector('#diagram').innerHTML = svg;
```

The first line, `opm`, selects the external diagram; the lines after it are OPL:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

See [OPL syntax](opl-syntax.md) for every sentence the parser understands.

## Minimal CLI example

```bash
node dist/cli/cli.js model.opl -o model.svg
```

Given this `model.opl`:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

the command writes `model.svg`. See [CLI](cli.md) for all options, exit codes,
and diagnostics.

## Run the demo

The static gallery in [`demo/index.html`](../../demo/index.html) lists ten
examples in a table of contents and shows the selected example's source next to
its rendered OPD:

```bash
npm run build
npm run dev
```

Then open the served page. The demo loads `dist/mermaid-opm.mjs`, so build first.

## Next steps

- [OPL syntax](opl-syntax.md) — the supported v1 subset, sentence by sentence.
- [CLI](cli.md) — options, exit codes, and examples.
- [Mermaid plugin](mermaid-plugin.md) — host requirements and limitations.
- [Editor integration](editor-integration.md) — the LSP and VS Code extension,
  plus CLI/library alternatives.
