# mermaid-opm for VS Code

VS Code support for **OPL** (Object-Process Language, ISO 19450), backed by the
[`mermaid-opm-lsp`](../lsp) language server.

## Features

- **Syntax highlighting** for `.opl` files.
- **Diagnostics** — parse and model problems reported inline as you type.
- **Completion** — reserved words plus the objects, processes, and states declared in the file.
- **Hover** — kind, essence, affiliation, and states of a thing under the cursor.
- **Outline** — objects/processes and their states in the Outline view.

## Commands

- **OPM: Open Preview** — render the active `.opl` file as an OPD in a side panel.
- **OPM: Export SVG** — render the active `.opl` file to an `.svg` file.

## Requirements

- VS Code 1.94 or newer.

## Settings

- `opm.diagnostics.enable` (boolean, default `true`) — turn inline diagnostics on or off.

## Notes

- Go-to-definition, rename, and formatting are not included yet.
- The language server is bundled with the extension; no separate install is needed.

## More

- OPL syntax and supported subset: see the project documentation (`docs/usage/opl-syntax.md`).
- Project: `mermaid-opm` (Mermaid external diagram plugin + CLI + LSP).
