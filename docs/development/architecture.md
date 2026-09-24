# Architecture

English | [中文](architecture.zh.md)

## Overview

`mermaid-opm` is a pure-TypeScript pipeline that turns OPL text into an SVG
Object-Process Diagram. The pipeline is split into four layers plus two
entrypoints. Everything below the Mermaid integration is **DOM-free**, so it runs
unchanged in Node, in a bundler, or in the browser.

## Layers

Data flows strictly in one direction:

```text
OPL source
   │
   ▼
core/opl        tokenize → parse                (text → OpmModel, diagnoses)
   │
   ▼
core/model      types + validate                (OpmModel, adds diagnostics)
   │
   ▼
layout          dagre                           (OpmModel → Scene)
   │
   ▼
render          shapes + notation + sceneToSvg  (Scene + Theme → SVG string)
```

| Layer | Directory | Responsibility | Depends on |
| --- | --- | --- | --- |
| OPL | `src/core/opl/` | `tokenize.ts` splits sentences; `parse.ts` builds the model; `reserved.ts` holds keywords; `diagnostics.ts` defines the diagnostic shape. | — |
| Model | `src/core/model/` | `types.ts` declares `OpmModel`, `Thing`, `Link`, `LinkKind`; `validate.ts` adds `reserved-name`, `unknown-reference`, and `process-no-io` diagnostics. | core/opl |
| Layout | `src/layout/` | `dagreAdapter.ts` runs dagre (`rankdir: 'LR'`, multigraph) and produces a `Scene`; `types.ts` declares `Scene`/`SceneNode`/`SceneEdge`. | core/model, dagre |
| Render | `src/render/` | `shapes.ts` draws nodes; `notation.ts` + `markers.ts` draw links; `sceneToSvg.ts` assembles the final `<svg>` string; `theme.ts` supplies every color. | layout |

The parser never throws: every problem is reported as a diagnostic carrying
`severity`, `code`, `message`, `line`, and `column`.

## Two entrypoints

- **Library** — `src/index.ts` exports `renderModel(source, opts)` (a parsed and
  validated `OpmModel`), `renderSvg(source, opts)` (an SVG `string`), `opm`,
  `registerOpm()`, and `VERSION`.
- **CLI** — `src/cli/cli.ts` implements `opm2svg`; the compiled
  `dist/cli/cli.js` is the `bin` entry. It reads a file, calls
  `renderSvg`/`renderModel`, writes SVG (and optionally JSON), prints
  diagnostics, and sets the exit code.

## The Mermaid integration is the only DOM-aware part

`src/mermaid/` wraps the pipeline for Mermaid: `detector.ts` matches the `opm`
off-keyword, `db.ts` stores the parsed model and theme (`setSource` calls
`renderModel`), `diagram.ts` wires the parser, and `renderer.ts` writes the SVG
into the host `document`. It derives a `Theme`
from Mermaid's resolved theme variables via `themeFromMermaid()`. The core
(`core/`, `layout/`, `render/`) never touches `document` or `window`.

## Data flow

1. `renderModel` calls `parseOpl`, then `validate`, and returns the `OpmModel`.
2. `renderSvg` calls `renderModel`, then `layout(model)` to get a `Scene`, then
   `sceneToSvg(scene, theme)` to get the SVG string.
3. The Mermaid renderer takes the same path and injects the string's inner
   content into the element Mermaid provides.

See [Build and test](build-and-test.md) to compile and run this, and
[Extending](extending.md) to add new notation.
