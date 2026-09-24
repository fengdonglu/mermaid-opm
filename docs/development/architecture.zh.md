# 架构

[English](architecture.md) | 中文

## 概述

`mermaid-opm` 是一条纯 TypeScript 流水线，把 OPL 文本转换成 SVG 对象-过程图。
流水线分为四层和两个入口。Mermaid 集成以下的全部代码都是 **DOM 无关**的，
因此可以在 Node、打包器或浏览器中原样运行。

## 分层

数据严格单向流动：

```text
OPL 源文本
   │
   ▼
core/opl        分词 → 解析                     （文本 → OpmModel，产生诊断）
   │
   ▼
core/model      类型 + 校验                     （OpmModel，追加诊断）
   │
   ▼
layout          dagre                           （OpmModel → Scene）
   │
   ▼
render          shapes + notation + sceneToSvg  （Scene + Theme → SVG 字符串）
```

| 层 | 目录 | 职责 | 依赖 |
| --- | --- | --- | --- |
| OPL | `src/core/opl/` | `tokenize.ts` 切分句子；`parse.ts` 构建模型；`reserved.ts` 保存关键字；`diagnostics.ts` 定义诊断结构。 | — |
| Model | `src/core/model/` | `types.ts` 声明 `OpmModel`、`Thing`、`Link`、`LinkKind`；`validate.ts` 追加 `reserved-name`、`unknown-reference`、`process-no-io` 诊断。 | core/opl |
| Layout | `src/layout/` | `dagreAdapter.ts` 运行 dagre（`rankdir: 'LR'`，多重图）并产出 `Scene`；`types.ts` 声明 `Scene`/`SceneNode`/`SceneEdge`。 | core/model、dagre |
| Render | `src/render/` | `shapes.ts` 绘制节点；`notation.ts` + `markers.ts` 绘制连线；`sceneToSvg.ts` 组装最终 `<svg>` 字符串；`theme.ts` 提供全部颜色。 | layout |

解析器从不抛异常：所有问题都以诊断形式报告，携带
`severity`、`code`、`message`、`line`、`column`。

## 两个入口

- **库** —— `src/index.ts` 导出 `renderModel(source, opts)`（解析并校验后的
  `OpmModel`）、`renderSvg(source, opts)`（SVG `string`）、`opm`、
  `registerOpm()` 以及 `VERSION`。
- **CLI** —— `src/cli/cli.ts` 实现 `opm2svg`；编译产物 `dist/cli/cli.js` 是
  `bin` 入口。它读取文件、调用 `renderSvg`/`renderModel`、写出 SVG（可选
  JSON）、打印诊断并设置退出码。

## Mermaid 集成是唯一感知 DOM 的部分

`src/mermaid/` 为 Mermaid 包装整条流水线：`detector.ts` 匹配 `opm` 前置关键
字，`db.ts` 保存解析后的模型与主题（`setSource` 会调用 `renderModel`），
`diagram.ts` 装配解析器，`renderer.ts` 把 SVG 写
入宿主 `document`。它通过 `themeFromMermaid()` 从 Mermaid 解析后的主题变量推导
出 `Theme`。核心部分（`core/`、`layout/`、`render/`）从不触碰 `document` 或
`window`。

## 数据流

1. `renderModel` 调用 `parseOpl`，再调用 `validate`，返回 `OpmModel`。
2. `renderSvg` 调用 `renderModel`，然后用 `layout(model)` 得到 `Scene`，再用
   `sceneToSvg(scene, theme)` 得到 SVG 字符串。
3. Mermaid 渲染器走同一条路径，并把字符串的内部内容注入 Mermaid 提供的元素。

编译与运行见[构建与测试](build-and-test.zh.md)，添加新记号见[扩展](extending.zh.md)。
