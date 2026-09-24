# Build and test

English | [中文](build-and-test.zh.md)

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and emits the package into `dist/`. |
| `npm test` | Runs the full Vitest suite once (`vitest run`). |
| `npm run typecheck` | `tsc --noEmit` — types only, no output. |
| `npm run dev` | Serves the `demo/` page via `scripts/serve.mjs`. |
| `npm run serve` | Alias for `npm run dev`. |

`npm run build` runs `tsc -p tsconfig.build.json && node build.mjs`:

1. `tsc` compiles every file under `src/` (excluding `*.spec.ts`) into `dist/`,
   emitting JavaScript and `.d.ts` declarations for both the package and the CLI.
2. `build.mjs` uses esbuild to bundle `src/index.ts` into a single browser ESM
   file, leaving `mermaid` external.

## Build outputs

| Path | What it is |
| --- | --- |
| `dist/index.js` | The package entry (`main`/`module` and the `.` export). |
| `dist/cli/cli.js` | The `opm2svg` executable (`bin`). |
| `dist/mermaid-opm.mjs` | The bundled browser build (the `./browser` export). |

The demo loads `dist/mermaid-opm.mjs`, so run `npm run build` before
`npm run dev`.

## Testing

Tests live in `test/` and run under [Vitest](https://vitest.dev). The full suite:

```bash
npm test
```

A single file:

```bash
npx vitest run test/docs.spec.ts
```

A single test by title (`-t` matches the test name):

```bash
npx vitest run -t "cross links"
```

Use `npx vitest` (watch mode) while iterating.

## Conventions

The project is test-driven: write a failing test first, then make it pass (see
`AGENTS.md`). Type-check with `npm run typecheck` before committing, and follow
Conventional Commits.
