# Contributing to mermaid-opm

English | [中文](CONTRIBUTING.zh.md)

Thanks for your interest in improving `mermaid-opm`. This project renders ISO
19450 OPM/OPL into Object-Process Diagrams as a Mermaid external diagram plugin
and ships an `opm2svg` CLI.

Please read [`AGENTS.md`](AGENTS.md) first: it is the canonical guide for the
repository layout, coding conventions, and how agents and humans collaborate
here.

## Development setup

Requirements: Node.js 20 or newer.

```bash
npm ci        # install exact dependencies
npm run dev   # serve demo/index.html locally
```

Build the distributable bundle with `npm run build`; the demo page loads
`dist/mermaid-opm.mjs`, so build before opening `demo/index.html`.

## Tests before implementation (TDD)

This project is developed test-first. Write a failing test that describes the
behavior you want, watch it fail for the expected reason, then write the minimal
code to make it pass. Do not add production code without a failing test.

```bash
npm test          # full vitest suite
npm run typecheck # tsc --noEmit
npm run build     # type-check + bundle
```

Run all three before opening a pull request. The parser must not throw: report
problems through diagnostics carrying line/column information.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` a new feature
- `fix:` a bug fix
- `docs:` documentation only
- `test:` tests only
- `refactor:` code change that neither fixes a bug nor adds a feature
- `chore:` build or tooling changes

Keep each commit focused and its subject in the imperative mood.

## Documentation

English is canonical. Chinese translations live beside the English file as a
`*.zh.md` sibling. Write all code comments and documentation in English; only
`*.zh.md` files may contain Chinese. If the two conflict, the English version
wins.

## Pull request checklist

- [ ] The change is covered by tests, and the new tests failed before the fix.
- [ ] `npm run typecheck`, `npm test`, and `npm run build` all pass locally.
- [ ] Comments and docs are in English, with `*.zh.md` copies where relevant.
- [ ] Commit messages follow Conventional Commits.
- [ ] User-facing changes are reflected in `README.md` and the `docs/` tree.
