# 快速开始

[English](getting-started.md) | 中文

`mermaid-opm` 把一种小型英文风格的 OPL 方言转换为对象-过程图（OPD）。有两种用法：

- 作为浏览器中的 **Mermaid 外部图插件**；
- 作为 **`opm2svg` 命令行工具**，用于批量转换与 CI。

## 安装

```bash
npm i mermaid-opm mermaid
```

`mermaid`（>= 11）是可选的 peer 依赖：只有使用插件时才需要。CLI 与库本身无需安装它。

## 最小插件示例

在渲染前注册外部图，并在第一个 `await` 之前关闭 Mermaid 的自动运行（见[《Mermaid 插件》](mermaid-plugin.zh.md)）：

```js
import mermaid from 'mermaid';
import { registerOpm } from 'mermaid-opm';

mermaid.initialize({ startOnLoad: false });
await registerOpm();

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

首行 `opm` 用于选中该外部图；其后的各行才是 OPL：

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

解析器支持的全部句式见[《OPL 语法》](opl-syntax.zh.md)。

## 最小 CLI 示例

```bash
npx opm2svg model.opl -o model.svg
```

给定如下 `model.opl`：

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

命令会写出 `model.svg`。全部选项、退出码与诊断见[《CLI》](cli.zh.md)。

## 运行演示

[`demo/index.html`](../../demo/index.html) 中的静态画廊在目录中列出十个示例，并把所选示例的源码与其渲染出的 OPD 并排显示：

```bash
npm run build
npm run dev
```

然后打开所服务的页面。演示页加载 `dist/mermaid-opm.mjs`，请先构建。

## 下一步

- [OPL 语法](opl-syntax.zh.md) —— 逐句说明 v1 支持的子集。
- [CLI](cli.zh.md) —— 选项、退出码与示例。
- [Mermaid 插件](mermaid-plugin.zh.md) —— 宿主要求与限制。
- [编辑器集成](editor-integration.zh.md) —— LSP 与 VS Code 扩展，以及 CLI/库替代方案。
