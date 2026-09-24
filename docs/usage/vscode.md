# VS Code extension

English | [中文](vscode.zh.md)

`mermaid-opm-vscode` adds OPL support to VS Code: syntax highlighting for
`.opl` files, live diagnostics, completion, hover, and a document outline, plus
two commands that render the current model. It bundles the
[`mermaid-opm-lsp`](#the-language-server) language server and talks to it over
stdio.

## Install

The extension is **not published to the Marketplace yet**. Until it is, install
it from a VSIX:

1. Get the `mermaid-opm-vscode-*.vsix` file — download it from the project's
   GitHub **Releases** (the release workflow attaches it to each `v*` tag), or
   build it locally with `npm run build` then
   `npm run package:vsix -w mermaid-opm-vscode`.
2. In VS Code, open the Command Palette, run **Extensions: Install from
   VSIX…**, and pick the file.
3. Reload when prompted.

Once the extension is published, the same dialog's **Install from VSIX…** step
is replaced by searching for `mermaid-opm-vscode` in the Extensions view; that
Marketplace path is a placeholder for a future release.

VS Code **1.94** or newer is required.

## What it provides

Open any `.opl` file; the extension activates on the `opm` language and
provides:

- **Syntax highlighting** — a TextMate grammar for the `opm` header, reserved
  words, essence/affiliation keywords, link words, and `//` comments.
- **Diagnostics** — the same diagnostics as `renderModel().diagnostics`,
  squiggled live as you type.
- **Completion** — reserved words plus the objects, processes, and states
  already declared in the open file.
- **Hover** — the kind, essence, affiliation, and states of the name under the
  cursor.
- **Outline** — the document symbols view lists every thing and its states.

Diagnostics are on by default; set `opm.diagnostics.enable` to `false` to
silence them.

## Commands

Open the Command Palette with an `.opl` file focused:

- **OPM: Open Preview** (`opm.preview`) — renders the current file as an OPD in
  a webview beside the editor and refreshes on every edit.
- **OPM: Export SVG** (`opm.exportSvg`) — renders the current file and writes
  the SVG to a path you choose.

Both use `renderSvg` from the core library, so the preview and the exported SVG
match the CLI and the Mermaid plugin.

## The language server

The extension launches the `mermaid-opm-lsp` server as a bundled file over
stdio; you do not install it separately for VS Code. The server is
editor-agnostic and ships as the workspace package `mermaid-opm-lsp` (not yet
published) exposing an `opm-lsp` binary, so other LSP clients can reuse it.

## Not included yet

Go-to-definition and formatting are not part of this release; see the
[roadmap](../development/roadmap.md).

## See also

- [Editor integration](editor-integration.md) — CLI-on-save and library-API
  alternatives.
- [CLI: opm2svg](cli.md) — batch conversion outside the editor.
- [Diagnostics reference](editor-integration.md#diagnostics-reference) — the
  `error` and `warning` codes the editor shows.
