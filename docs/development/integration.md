# Integration

English | [中文](integration.zh.md)

`mermaid-opm` ships as an ESM package with two entrypoints:

```json
"exports": {
  ".": { "import": "./dist/index.js" },
  "./browser": "./dist/mermaid-opm.mjs"
}
```

The root import is the library/plugin API only (the `opm2svg` CLI is a separate
`bin`); `./browser` is the bundled browser build used by the Mermaid plugin.
`mermaid` (>= 11) is an **optional** peer dependency — only `registerOpm()` needs
it at runtime.

## Bundlers (Vite, webpack)

Both resolve the bare `mermaid` specifier and the package `exports` map for you.

```js
// Vite or webpack
import { renderSvg, registerOpm } from 'mermaid-opm';
import mermaid from 'mermaid';

const svg = renderSvg('Order is physical.\nHandling is physical.\nHandling consumes Order.');

mermaid.initialize({ startOnLoad: false });
await registerOpm();
```

For the plugin path, register before rendering and disable auto-run first.

## Plain ESM in Node

```js
import { renderSvg, renderModel } from 'mermaid-opm';

const svg = renderSvg('Order is physical.\nHandling is physical.');
const model = renderModel('Order is physical.');
console.log(model.diagnostics);
```

Because `registerOpm()` is the only thing that imports `mermaid`, you can import
from `mermaid-opm` on the server without installing `mermaid`.

## Node / SSR

The render core is DOM-free, so both functions are safe on the server:

- `renderModel(source)` returns the parsed, validated `OpmModel` (a `Map` of
  things plus `links` and `diagnostics`). It never throws and never touches the
  DOM.
- `renderSvg(source, { theme, strict })` returns an SVG **string** you can embed
  in any server-rendered page.

```js
import { renderSvg } from 'mermaid-opm';

const svg = renderSvg(source); // string, no DOM required
```

## CDN in the browser

Load the browser bundle directly from a CDN. It keeps a bare `import('mermaid')`,
so provide an import map for `mermaid`:

```html
<script type="importmap">
{
  "imports": {
    "mermaid": "https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs"
  }
}
</script>
<script type="module">
  import mermaid from 'mermaid';
  import { registerOpm } from 'https://cdn.jsdelivr.net/npm/mermaid-opm@0.1.0/dist/mermaid-opm.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerOpm();
</script>
```

Without the import map, `registerOpm()` throws
`Failed to resolve module specifier "mermaid"`. See
[Mermaid plugin](../usage/mermaid-plugin.md) for details.

## The `mermaid` peer dependency

- Declared as an optional peer dependency (`>= 11`) in `package.json`.
- Required at runtime only by `registerOpm()`; the `opm` external-diagram
  definition type-imports `mermaid` only.
- `renderSvg`, `renderModel`, and the `opm2svg` CLI work without it.

## The CLI

For batch or CI use, install the CLI or run it with `npx`:

```bash
npx opm2svg model.opl -o model.svg
```

See [CLI](../usage/cli.md).
