# 路线图

[English](roadmap.md) | 中文

本页记录 v1 之后计划开展的工作。这里的内容尚未实现；当前支持的子集记录在
[OPL 语法](../usage/opl-syntax.zh.md)。

## P1

- **事件、结果与调用连线。** 补齐剩余的 OPM 过程连线及其记号，步骤见
  [扩展](extending.zh.md)。
- **无冠词的过程泛化。** `Special is General.` 目前会被解析成状态；在不破坏冠词
  形式 `Special is a General.` 的前提下，为过程支持无冠词形式。
- **`--theme` 与 `--strict` CLI 选项。** `--theme` 选择调色板；`--strict` 把歧义
  从警告升级为错误。
- **ELK 布局。** 在 `LayoutEngine` 接口背后提供 dagre 之外的替代方案，用于 dagre
  布局效果不佳的图。

## 未来

- **诊断之外的编辑器能力。** [VS Code 扩展](../usage/vscode.zh.md)及其内置的 `mermaid-opm-lsp` 服务器已提供诊断、补全、悬停与大纲；跳转定义、重命名、代码操作与格式化仍属未来工作。
- **其它编辑器接入。** 该服务器与编辑器无关；编写 Neovim 配置示例属未来工作。

## 不计划

- 固定渲染器支持（GitHub Markdown 无法加载插件）—— 请改用
  [`opm2svg` CLI](../usage/cli.zh.md)。
- 多个 OPD / 缩放进入 / 展开，以及图形化编辑。
