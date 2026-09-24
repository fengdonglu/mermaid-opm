# 集成

[English](integration.md) | 中文

`mermaid-opm` 以 ESM 包的形式发布，提供两个入口：

```json
"exports": {
  ".": { "import": "./dist/index.js" },
  "./browser": "./dist/mermaid-opm.mjs"
}
```

根导入仅为库/插件 API（`opm2svg` CLI 是独立的 `bin`）；`./browser` 是供 Mermaid
插件使用的浏览器打包产物。`mermaid`（>= 11）是**可选**的 peer 依赖 —— 运行时只有
`registerOpm()` 需要它。

## 打包器（Vite、webpack）

两者都会替你解析裸 `mermaid` 说明符以及包的 `exports` 映射。

```js
// Vite 或 webpack
import { renderSvg, registerOpm } from 'mermaid-opm';
import mermaid from 'mermaid';

const svg = renderSvg('Order is physical.\nHandling is physical.\nHandling consumes Order.');

mermaid.initialize({ startOnLoad: false });
await registerOpm();
```

插件路径要先注册再渲染，并且先禁用自动运行。

## Node 中的纯 ESM

```js
import { renderSvg, renderModel } from 'mermaid-opm';

const svg = renderSvg('Order is physical.\nHandling is physical.');
const model = renderModel('Order is physical.');
console.log(model.diagnostics);
```

由于只有 `registerOpm()` 会导入 `mermaid`，你可以在服务端从 `mermaid-opm`
导入而不安装 `mermaid`。

## Node / SSR

渲染核心与 DOM 无关，因此两个函数在服务端都安全：

- `renderModel(source)` 返回解析并校验后的 `OpmModel`（`things` 的 `Map`，加上
  `links` 与 `diagnostics`）。它从不抛异常，也从不触碰 DOM。
- `renderSvg(source, { theme, strict })` 返回 SVG **字符串**，可嵌入任何服务端
  渲染页面。

```js
import { renderSvg } from 'mermaid-opm';

const svg = renderSvg(source); // 字符串，无需 DOM
```

## 浏览器中的 CDN

直接从 CDN 加载浏览器打包产物。它内部保留裸 `import('mermaid')`，因此需要为
`mermaid` 提供 import map：

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

没有 import map 时，`registerOpm()` 会抛出
`Failed to resolve module specifier "mermaid"`。详见
[Mermaid 插件](../usage/mermaid-plugin.zh.md)。

## `mermaid` peer 依赖

- 在 `package.json` 中声明为可选 peer 依赖（`>= 11`）。
- 运行时仅 `registerOpm()` 需要它；`opm` 外部图定义只对 `mermaid` 做类型导入。
- `renderSvg`、`renderModel` 与 `opm2svg` CLI 都不需要它。

## CLI

批量或 CI 场景可安装 CLI，或用 `npx` 运行：

```bash
npx opm2svg model.opl -o model.svg
```

见 [CLI](../usage/cli.zh.md)。
