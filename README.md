# mermaid-opm

Render ISO 19450 OPM/OPL into Object-Process Diagrams (OPD) as a Mermaid external diagram plugin, plus a CLI.

![OPL source beside its rendered OPD — the demo gallery](assets/gallery.png)

[![CI](https://github.com/fengdonglu/mermaid-opm/actions/workflows/ci.yml/badge.svg)](https://github.com/fengdonglu/mermaid-opm/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mermaid-opm.svg)](https://www.npmjs.com/package/mermaid-opm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

English | [中文](README.zh.md)

## What it is

Object-Process Methodology (OPM) is an ISO 19450 systems-modeling paradigm that
describes a system with just two building blocks — **objects** (things that
exist) and **processes** (things that transform objects). Object-Process
Language (OPL) is its textual form; Object-Process Diagrams (OPD) are its
graphical form. The two are bimodal views of a single model.

`mermaid-opm` parses a small English-like OPL dialect into a model, lays it out
with [dagre](https://github.com/dagrejs/dagre), and emits SVG. It ships as:

- a **Mermaid external diagram plugin** — write `opm` blocks and let Mermaid
  render them in the browser; and
- a **CLI**, `opm2svg`, for batch conversion and CI.

## Install

```bash
npm i mermaid-opm mermaid
```

`mermaid` (>= 11) is an optional peer dependency: install it only when you use
the Mermaid plugin. Browser users can skip npm and load both from a CDN. The
plugin's browser bundle keeps a bare `import('mermaid')`, so the page must map
`mermaid` to an ESM URL with an import map:

```html
<script type="importmap">
{
  "imports": {
    "mermaid": "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"
  }
}
</script>
<script type="module">
  import mermaid from 'mermaid';
  import { registerOpm } from 'https://cdn.jsdelivr.net/npm/mermaid-opm@0.1.0/dist/mermaid-opm.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerOpm();
</script>
```

The plugin's browser bundle is the `./browser` export (`dist/mermaid-opm.mjs`);
it must be served or hosted rather than imported from the package root.

## Quick start — Mermaid plugin

Register the external diagram before rendering:

```js
import mermaid from 'mermaid';
import { registerOpm } from 'mermaid-opm';

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

The source inside `mermaid.render` is the OPL dialect:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

## Quick start — CLI

```bash
npx opm2svg model.opl -o model.svg
npx opm2svg model.opl -o model.svg --json model.json
```

The input file is converted to SVG (default output name is the input with an
`.svg` extension). `--json` additionally writes the parsed model and its
diagnostics. Any `error` diagnostic exits non-zero; unknown flags are rejected
with a usage error.

## Editor (VS Code)

The `mermaid-opm-vscode` extension adds `.opl` syntax highlighting, live
diagnostics, completion, hover, and an outline, plus the **OPM: Open Preview**
and **OPM: Export SVG** commands. It bundles the `mermaid-opm-lsp` language
server. See [VS Code extension](docs/usage/vscode.md) to install and use it.

## Demo

`demo/index.html` is a two-column static gallery that renders ten OPL examples
side by side with their OPD:

- Gallery: [`demo/index.html`](demo/index.html) — ten numbered examples, source next to its OPD.
- Playground: [`demo/playground.html`](demo/playground.html) — edit OPL and watch the OPD and diagnostics update live.
- Hosted: https://fengdonglu.github.io/mermaid-opm/demo/ — for this to deploy,
  set the Pages source to **GitHub Actions** in the repository settings.
- Locally: run `npm run build` (the page loads `dist/mermaid-opm.mjs`) then
  `npm run dev`, and open the served page.

## Supported

The v1 subset covers:

- **Entities** — objects and processes, inferred from their roles, with essence
  (`physical` / `informatical`) and affiliation (`systemic` / `environmental`):
  `A is physical and environmental.`
- **States** — `A can be s1, s2, or s3.`, named initial/final states
  (`A is initial s1.` / `A is final s1.`).
- **Structural links** — aggregation (`Whole consists of A, B, and C.`),
  exhibition (`A exhibits B.`), generalization (`Special is a General.`),
  classification (`Instance is an instance of Class.`), and user-defined tagged
  links.
- **Procedural links** — consumption (`Process consumes Object.`), production
  (`Process yields Object.`), effect (`Process affects Object.`), input-output
  pairs (`Process changes Object from s1 to s2.`), agent
  (`Agent handles Process.`), instrument (`Process requires Instrument.`), and
  condition (`Process occurs if Object is s1.`).

## Not supported (v1)

- Multiple OPDs / in-zoom / unfold.
- `event`, `result`, and `invocation` links.
- Graphical editing or layout persistence.
- Bare `A is initial.` / `A is final.` — initial and final states must be named,
  e.g. `A is initial s1.`
- Article-less process generalization `Special is General.` — it is parsed as a
  state; use the article form `Special is a General.` instead.
- Go-to-definition and formatting in the editor (see [Roadmap](#roadmap)).

## Known limitations

- External Mermaid diagrams require the host page to load this plugin. Fixed
  renderers such as GitHub Markdown do not load third-party plugins, so `opm`
  blocks will not render there — use the CLI to produce SVG instead.
- The demo loads `../dist/mermaid-opm.mjs`, so run `npm run build` before
  opening `demo/index.html`.
- Theme colors are derived from Mermaid's resolved theme variables (background,
  line/text, and the primary/secondary palette). Mermaid exposes only that
  palette, not OPM-specific semantics; pass an explicit `Theme` to `renderSvg`
  for the full OPM palette.

## Documentation

The full documentation lives in [`docs/`](docs/index.md):

- **Usage** — [Getting started](docs/usage/getting-started.md),
  [OPL syntax](docs/usage/opl-syntax.md), [CLI](docs/usage/cli.md),
  [Mermaid plugin](docs/usage/mermaid-plugin.md),
  [Editor integration](docs/usage/editor-integration.md),
  [VS Code extension](docs/usage/vscode.md).
- **Development** — [Architecture](docs/development/architecture.md),
  [Build and test](docs/development/build-and-test.md),
  [Integration](docs/development/integration.md),
  [Extending](docs/development/extending.md),
  [Roadmap](docs/development/roadmap.md).
- **About** — [What is OPM/OPL](docs/about/what-is-opm-opl.md),
  [References](docs/about/references.md), [FAQ](docs/about/faq.md).

## Roadmap

Planned for a later release:

- `event` / `result` / `invocation` links and state-qualified consumption and
  production.
- Article-less generalization for processes.
- `--theme` and `--strict` CLI options (strict turns ambiguities into errors).
- Alternative layout engines (ELK).
- Go-to-definition and formatting in the [VS Code extension](docs/usage/vscode.md).

## Development note

This project was developed through AI-assisted **Vibe Coding**, with agents and
humans collaborating iteratively.

## License

[MIT](LICENSE) © fengdonglu
