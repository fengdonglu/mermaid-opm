# VS Code 扩展

[English](vscode.md) | 中文

`mermaid-opm-vscode` 为 VS Code 增加 OPL 支持：`.opl` 文件语法高亮、实时诊断、补全、悬停与文档大纲，外加两个渲染当前模型的命令。它内置 [`mermaid-opm-lsp`](#语言服务器) 语言服务器，并通过 stdio 与之通信。

## 安装

扩展尚未发布到任何扩展市场。请从 VSIX 安装：

1. 获取 `mermaid-opm-vscode-*.vsix` 文件——可从项目的 GitHub **Releases** 下载（Release 工作流会在每个 `v*` tag 上附带该文件），或在本地 `npm run build` 后执行 `npm run package:vsix -w mermaid-opm-vscode` 自行打包。
2. 在 VS Code 中打开命令面板，运行 **Extensions: Install from VSIX…**，选择该文件。
3. 按提示重新加载。

需要 VS Code **1.94** 或更高版本。

## 提供的能力

打开任意 `.opl` 文件，扩展会随 `opm` 语言激活并提供：

- **语法高亮**——覆盖 `opm` 头、保留字、本质/归属关键字、链接词及 `//` 注释的 TextMate 语法。
- **诊断**——与 `renderModel().diagnostics` 相同的诊断，随输入实时显示波浪线。
- **补全**——保留字，以及当前文件中已声明的对象、过程与状态。
- **悬停**——光标处名称的类别、本质、归属与状态。
- **大纲**——文档符号视图列出所有事物及其状态。

诊断默认开启；将 `opm.diagnostics.enable` 设为 `false` 可关闭。

## 命令

聚焦 `.opl` 文件时打开命令面板：

- **OPM: Open Preview**（`opm.preview`）——在编辑器旁的 webview 中把当前文件渲染为 OPD，并在每次编辑后刷新。
- **OPM: Export SVG**（`opm.exportSvg`）——渲染当前文件并将 SVG 写入你选择的路径。

两者都使用核心库的 `renderSvg`，因此预览与导出的 SVG 和 CLI、Mermaid 插件的结果一致。

## 语言服务器

扩展以打包文件形式、通过 stdio 启动 `mermaid-opm-lsp` 服务器；在 VS Code 中无需单独安装。该服务器与编辑器无关，作为 workspace 包 `mermaid-opm-lsp`（尚未发布）提供 `opm-lsp` 可执行文件，供其它 LSP 客户端复用。

## 尚未包含

本次发布不包含跳转定义与格式化；见[路线图](../development/roadmap.zh.md)。

## 另见

- [编辑器集成](editor-integration.zh.md) —— 保存时运行 CLI 与库 API 两种替代方案。
- [CLI：opm2svg](cli.zh.md) —— 编辑器之外的批量转换。
- [诊断参考](editor-integration.zh.md#诊断参考) —— 编辑器显示的 `error` 与 `warning` 代码。
