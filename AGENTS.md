# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project

`mermaid-opm` renders ISO 19450 OPM/OPL into Object-Process Diagrams (OPD) as a
Mermaid external diagram plugin, plus a CLI (`opm2svg`). It parses a small
English-like OPL dialect into a model, lays the model out with dagre, and emits
SVG.

## Repository layout

- `src/core/` — parsing and model layer: `opl/` (tokenizer, parser, reserved
  words, diagnostics) and `model/` (types, validation). Pure logic, no DOM.
- `src/layout/` — converts an `OpmModel` into a laid-out `Scene` (dagre).
- `src/render/` — DOM-free SVG string generation from a `Scene` plus `Theme`.
- `src/mermaid/` — Mermaid external diagram integration (detector, db, diagram,
  renderer, styles).
- `src/cli/` — `opm2svg` command-line entry point.
- `test/` — vitest specs and shared setup.
- `demo/` — browser demo page.
- `docs/` — user-facing documentation (`usage/`, `development/`, `about/`,
  `index.md`), plus `docs/superpowers/` for plans and specs.
- `scripts/` — developer utilities (e.g. local dev server).

## Commands

- `npm run build` — type-check and bundle (`dist/`).
- `npm test` — run the full vitest suite.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run dev` — start the local dev server for `demo/index.html`.

## Coding conventions

- TypeScript with ESM; use explicit `.js` import suffixes for relative imports.
- Write all code comments and documentation in **English**. Only `*.zh.md`
  files may contain Chinese.
- The render core must be DOM-free: it produces SVG strings and must not touch
  `document`/`window`. DOM access belongs to the Mermaid integration and demo.
- Take colors only from the `Theme`; never hard-code palette values.
- The parser must not throw: report problems through diagnostics carrying
  line/column information.
- TDD is expected: write a failing test first, then make it pass.
- Never invent OPL syntax. Support exactly the documented dialect; unknown OPL
  constructs are out of scope until specified.

## Docs conventions

- English is canonical. Chinese copies live beside the English file as
  `*.zh.md` siblings.
- If an English doc and its `*.zh.md` counterpart conflict, the English version
  wins.
- Native-language titles of referenced standards may appear in English docs as
  citations.

## Commits

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`,
`refactor:`, etc.

## Vibe Coding

This project is developed via AI-assisted "Vibe Coding", with agents and humans
collaborating iteratively.
