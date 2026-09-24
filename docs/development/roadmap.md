# Roadmap

English | [中文](roadmap.zh.md)

This page tracks planned work after v1. Nothing here is implemented yet; the
current supported subset is documented in [OPL syntax](../usage/opl-syntax.md).

## P1

- **Event, result, and invocation links.** Add the remaining OPM procedural
  links and their notation, following the steps in [Extending](extending.md).
- **Article-less process generalization.** `Special is General.` is currently
  parsed as a state; support the article-less form for processes without
  breaking the article form `Special is a General.`
- **`--theme` and `--strict` CLI options.** `--theme` selects the palette;
  `--strict` turns ambiguities into errors instead of warnings.
- **ELK layout.** Offer an alternative to dagre behind the `LayoutEngine`
  interface, for graphs dagre lays out poorly.

## Future

- **Editor features beyond diagnostics.** The [VS Code extension](../usage/vscode.md)
  and its bundled `mermaid-opm-lsp` server ship diagnostics, completion, hover,
  and an outline; go-to-definition, rename, code actions, and formatting remain
  future work.
- **Other editor setups.** The server is editor-agnostic; a documented Neovim
  configuration is future work.

## Not planned

- Fixed-renderer support (GitHub Markdown cannot load plugins) — use the
  [`opm2svg` CLI](../usage/cli.md) instead.
- Multiple OPDs / in-zoom / unfold, and graphical editing.
