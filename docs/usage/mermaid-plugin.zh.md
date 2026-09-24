# Mermaid 插件

[English](mermaid-plugin.md) | 中文

`mermaid-opm` 向 Mermaid 注册一个**外部图**。注册后，凡是以 `opm` 为首行的源（通常是 ```opm 围栏代码块，或 `mermaid.render` 的字符串）都会被渲染为 OPD。

## 注册该图

```js
import mermaid from 'mermaid';
import { registerOpm } from './dist/mermaid-opm.mjs'; // 构建出的浏览器 bundle

mermaid.initialize({ startOnLoad: false });
await registerOpm();
```

`registerOpm()` 是对以下调用的薄封装：

```js
mermaid.registerExternalDiagrams([opm], { lazyLoad: false });
```

`opm` 定义（`{ id, detector, loader }`）也被导出，便于自行传给 `registerExternalDiagrams`。

注册后照常渲染：

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

## `opm` 关键字

检测器匹配 `/^\s*opm(?:\s|$)/`：源必须以单独一行的 `opm` **开头**（允许前置空白）。`opm` 这一行本身不是 OPL：Mermaid 会把完整源码（含 `opm` 行）交给插件，由插件的解析器剥掉该首行后再读取其下的句子。

## `startOnLoad` 陷阱

必须在**任何 `await` 之前**调用 `mermaid.initialize({ startOnLoad: false })`。否则 Mermaid 可能在 `DOMContentLoaded` 时、`registerOpm()` 完成之前自动运行，导致每个 `opm` 块都报 *"No diagram type detected"*。正确模式：

```js
mermaid.initialize({ startOnLoad: false }); // 先
await registerOpm();                        // 后
```

## 浏览器包与 import map

发布的浏览器包（`dist/mermaid-opm.mjs`，即 `./browser` 导出）在 `registerOpm()` 内保留了对 `import('mermaid')` 的**裸导入**。打包器会自动解析该 specifier，但浏览器直接加载该文件时无法解析。你必须提供 import map（或打包器别名），把 `mermaid` 映射到某个 ESM 构建；否则 `await registerOpm()` 会抛出 `Failed to resolve module specifier "mermaid"`。

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

同样的 import map 要求也适用于[演示页](../../demo/index.html)。

## 宿主要求

- 必须存在 Mermaid **>= 11**（它是可选的 peer 依赖）。
- 宿主必须在渲染 `opm` 源之前加载 `mermaid-opm` 并调用 `registerOpm()`。
- 在浏览器中，`mermaid` 必须能作为 ESM specifier 被解析（import map 或打包器）；插件自身的包是 `dist/mermaid-opm.mjs`（`./browser`）。

## 固定渲染器的限制

外部图要求宿主页面执行第三方 JavaScript。像 **GitHub Markdown 这样的固定渲染器不会加载插件**，因此 `opm` 块在那里无法渲染。请改用 [`opm2svg` CLI](cli.zh.md) 生成 SVG 再提交或附带。
