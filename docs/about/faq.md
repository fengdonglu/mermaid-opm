# FAQ

English | [中文](faq.zh.md)

## Why Mermaid?

Most OPM models live next to the prose that explains them, and Mermaid is the
de-facto diagram language of Markdown and docs sites. Its **external diagram**
API lets a project add a new diagram type without forking Mermaid, so
`mermaid-opm` registers the `opm` keyword and an `opm` fenced block renders
wherever the plugin is loaded. An OPM model is a directed graph of typed nodes
and edges, which maps cleanly onto a layout engine.

## Why is there no GUI editing?

v1 is a **renderer**, not an editor. Editing needs a canvas, hit-testing,
selection, and undo/redo — essentially a different product. Keeping the source
of truth as **OPL text** makes models diffable, reviewable, and mergeable in
git, and keeps the parser and renderer DOM-free and testable. The
[demo](../../demo/index.html) only views and switches between examples.

## Why is layout not persisted?

Layout is derived, not stored, so the same model always produces the same
diagram. There is no separate layout file to keep in sync, and no format,
versioning, or invalidation rules to invent when a model changes. Position is a
pure function of the model (via [dagre](https://github.com/dagrejs/dagre)); an
alternative engine is on the [roadmap](../development/roadmap.md).

## Is there an LSP?

Yes. `mermaid-opm-lsp` is a language server built on
`renderModel().diagnostics`, and `mermaid-opm-vscode` is a VS Code extension
that bundles it. Together they provide live diagnostics, completion, hover, and
a document outline for `.opl` files; see
[VS Code extension](../usage/vscode.md). The server is editor-agnostic, so other
LSP clients can reuse it. Go-to-definition and formatting are still planned, per
the [roadmap](../development/roadmap.md).

## How do I render an OPD on GitHub?

GitHub's Markdown renderer does not load third-party Mermaid plugins, so a
fenced `opm` block appears as source code, not a diagram. Two options:

- **Pre-render to SVG.** Run the [`opm2svg` CLI](../usage/cli.md) on the source,
  commit the result, and embed it:

  ```bash
  npx opm2svg model.opl -o model.svg
  ```

  Then reference `model.svg` as an image in your Markdown.

- **Render in a host you control** — any page that loads the plugin, such as the
  [demo](../../demo/index.html).

For example, this source:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

renders as an OPD only in the second case; on GitHub, commit its pre-rendered
SVG instead. See the
[fixed-renderer limitation](../usage/mermaid-plugin.md) for more.

## Do I need Mermaid to use the library?

No. `mermaid` is an optional peer dependency, required only by the Mermaid
plugin (`registerOpm()`). The `renderSvg` and `renderModel` functions and the
`opm2svg` CLI work without it.
