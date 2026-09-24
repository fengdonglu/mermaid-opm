# mermaid-opm 文档

[English](index.md) | 中文

`mermaid-opm` 将 ISO 19450 OPM/OPL 渲染为对象-过程图（OPD），形态为 Mermaid 外部图表插件，另附一个 `opm2svg` CLI。本页是文档入口；项目概览与 30 秒快速上手见 [README](../README.zh.md)。

## 使用

如何安装、编写 OPL 并渲染图表。

- [快速开始](usage/getting-started.zh.md) —— 安装、首次插件渲染、首次 CLI 运行。
- [OPL 语法](usage/opl-syntax.zh.md) —— 逐句说明 v1 支持的子集。
- [CLI：opm2svg](usage/cli.zh.md) —— 选项、退出码与诊断。
- [Mermaid 插件](usage/mermaid-plugin.zh.md) —— 宿主要求与限制。
- [编辑器集成](usage/editor-integration.zh.md) —— LSP，以及 CLI/库两种替代方案。
- [VS Code 扩展](usage/vscode.zh.md) —— 安装、能力与命令。

## 开发

面向构建或扩展 `mermaid-opm` 的读者。

- [架构](development/architecture.zh.md) —— 分层与数据流。
- [构建与测试](development/build-and-test.zh.md) —— 命令与构建产物。
- [集成](development/integration.zh.md) —— 打包器、Node/SSR 与浏览器 bundle。
- [扩展](development/extending.zh.md) —— 新增链类型、主题令牌或示例。
- [路线图](development/roadmap.zh.md) —— v1 之后的计划工作。

## 关于

背景、标准与常见问题。

- [什么是 OPM/OPL？](about/what-is-opm-opl.zh.md) —— OPM、OPL、OPD 与 ISO 19450。
- [参考资料](about/references.zh.md) —— 标准、OPCAT 与本地参考资料。
- [常见问题](about/faq.zh.md) —— 设计问题与在 GitHub 上的渲染。

## 项目

- [README](../README.zh.md) —— 概览与快速上手。
- [AGENTS.md](../AGENTS.md) —— 面向贡献者与 AI 智能体的规约。
