# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-10-03

### Added

- OPL parser and model layer for the supported ISO 19450 subset: entities,
  states, structural links, and procedural links.
- Dagre-based layout that turns an `OpmModel` into a `Scene`.
- DOM-free SVG rendering driven entirely by a `Theme`.
- Mermaid external diagram integration (`registerOpm`) plus the `opm2svg`
  command-line tool and the browser bundle (`dist/mermaid-opm.mjs`).
- Static demo gallery (`demo/index.html`) with ten numbered OPL examples and a
  live playground (`demo/playground.html`).
- OPL language server (`mermaid-opm-lsp`): diagnostics, completion, hover, and
  document symbols over stdio.
- VS Code extension (`mermaid-opm-vscode`): `.opl` syntax highlighting, the
  language client, an icon, and the `OPM: Open Preview` / `OPM: Export SVG`
  commands.
- Bilingual documentation (`docs/`, English with `*.zh.md` copies) and
  `AGENTS.md` contributor/agent conventions.
- GitHub infrastructure: MIT `LICENSE`, contributing guides, CI, GitHub Pages,
  and a release workflow that attaches the VS Code VSIX to each release.

### Changed

- Demo pages (gallery and playground) link back to the repository with a GitHub
  mark and the `owner/repo` text.

[0.1.2]: https://github.com/fengdonglu/mermaid-opm/releases/tag/v0.1.2
