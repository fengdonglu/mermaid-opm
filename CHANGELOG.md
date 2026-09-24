# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- OPL language server (`mermaid-opm-lsp`) with diagnostics, completion, hover,
  and document symbols over stdio.
- VS Code extension (`mermaid-opm-vscode`) with `.opl` syntax highlighting, the
  language client, and the `OPM: Open Preview` / `OPM: Export SVG` commands.
- Editor tooling documentation (`docs/usage/vscode.md` and its Chinese copy).
- Playground page (`demo/playground.html`) and a demo gallery hero image.
- Release workflow that packages the VS Code extension as a VSIX and attaches it
  to GitHub Releases; `npm run package:vsix` packages it locally.

## [0.1.0] - 2026-09-24

### Added

- Initial v1 release of `mermaid-opm`.
- OPL parser and model layer for the supported ISO 19450 subset: entities,
  states, structural links, and procedural links.
- Dagre-based layout that turns an `OpmModel` into a `Scene`.
- DOM-free SVG rendering driven entirely by a `Theme`.
- Mermaid external diagram integration (`registerOpm`) plus the `opm2svg`
  command-line tool.
- Browser bundle (`dist/mermaid-opm.mjs`) exposed through the `./browser`
  export.
- Static demo gallery (`demo/index.html`) with ten OPL examples.
- Bilingual documentation set (`docs/`) with English canonical files and
  `*.zh.md` copies.
- `AGENTS.md` contributor/agent conventions.
- GitHub infrastructure: MIT `LICENSE`, contributing guides, CI workflow, Pages
  deployment, and issue/pull request templates.

[0.1.0]: https://github.com/fengdonglu/mermaid-opm/releases/tag/v0.1.0
