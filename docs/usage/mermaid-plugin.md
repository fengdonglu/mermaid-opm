# Mermaid plugin

English | [中文](mermaid-plugin.zh.md)

`mermaid-opm` registers an **external diagram** with Mermaid. Once registered,
any source whose first line is `opm` (typically a fenced `opm` block or a
`mermaid.render` string) is rendered as an OPD.

## Register the diagram

```js
import mermaid from 'mermaid';
import { registerOpm } from 'mermaid-opm';

mermaid.initialize({ startOnLoad: false });
await registerOpm();
```

`registerOpm()` is a thin wrapper around

```js
mermaid.registerExternalDiagrams([opm], { lazyLoad: false });
```

The `opm` definition (`{ id, detector, loader }`) is also exported if you need
to pass it to `registerExternalDiagrams` yourself.

After registration, render as usual:

```js
const { svg } = await mermaid.render('d', `
opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
`);
document.querySelector('#diagram').innerHTML = svg;
```

## The `opm` off-keyword

The detector matches `/^\s*opm(?:\s|$)/`: the source must **start** with `opm`
on its own line (leading whitespace allowed). The `opm` line itself is not OPL:
Mermaid passes the full source (including the `opm` line) to the plugin, and the
plugin's parser strips that leading line before reading the sentences below.

## `startOnLoad` pitfall

Call `mermaid.initialize({ startOnLoad: false })` **before any `await`**.
Otherwise Mermaid may auto-run on `DOMContentLoaded` before `registerOpm()` has
finished, and every `opm` block fails with *"No diagram type detected"*. The
pattern is:

```js
mermaid.initialize({ startOnLoad: false }); // first
await registerOpm();                        // then register
```

## Browser bundle and import maps

The published browser bundle (`dist/mermaid-opm.mjs`, the `./browser` export)
keeps a **bare** `import('mermaid')` inside `registerOpm()`. Bundlers resolve
that specifier automatically, but a browser loading the file directly cannot.
You must provide an import map (or a bundler alias) that maps `mermaid` to an
ESM build; otherwise `await registerOpm()` throws
`Failed to resolve module specifier "mermaid"`.

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
  import { registerOpm } from './dist/mermaid-opm.mjs';

  mermaid.initialize({ startOnLoad: false });
  await registerOpm();
</script>
```

The same import-map requirement applies to the [`demo`](../../demo/index.html).

## Host requirements

- Mermaid **>= 11** must be present (it is an optional peer dependency).
- The host must load `mermaid-opm` and call `registerOpm()` before rendering
  `opm` sources.
- In the browser, `mermaid` must be resolvable as an ESM specifier (import map
  or bundler); the plugin's own bundle is `dist/mermaid-opm.mjs` (`./browser`).

## Fixed-renderer limitation

External diagrams require the host page to execute third-party JavaScript.
Fixed renderers such as **GitHub Markdown do not load plugins**, so an `opm`
block will not render there. Use the [`opm2svg` CLI](cli.md) to produce an SVG
and commit or attach the result instead.
