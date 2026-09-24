# 什么是 OPM/OPL？

[English](what-is-opm-opl.md) | 中文

**对象-过程方法（OPM）** 是一种系统建模范式，已被标准化为 ISO 19450（见[《参考资料》](references.zh.md)）。它只用两类基本构件来描述系统：

- **对象**——存在之物，可能处于若干状态之一；
- **过程**——改变对象之物，即创建、消耗或改变对象。

这套极小的词汇足以描述许多领域的系统，因为任何系统都可被视为一组被过程改变的对象。复杂性通过**精化（refinement）**来管理：同一事物可以在更深的层次上再次描述。

## 双模态：一个模型，两种视图

OPM 是**双模态**的——每个模型同时以两种形式表达：

- **对象-过程图（OPD）**，图形视图；
- **对象-过程语言（OPL）**，文本视图。

二者并非彼此独立的产物，而是同一模型的两个投影，并保持一致：OPD 中的每一个方框、链接、状态与标签，都在 OPL 中有直接对应。

`mermaid-opm` 以文本一侧为输入：解析 OPL、布局模型，并绘制出等价的 OPD：

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

此处 `Handling`（过程）消耗对象 `Order`，并产生对象 `Handled Order`：这是一条变换链。

## 本项目实现了什么

`mermaid-opm` 实现了一门小型、类英语的 OPL 子集。每个模型渲染为单张扁平的 OPD；精化（下钻、展开与多张 OPD）[暂不支持](../development/roadmap.zh.md)。

- [OPL 语法](../usage/opl-syntax.zh.md) —— 解析器接受的每一种句式。
- [快速开始](../usage/getting-started.zh.md) —— 安装与首次渲染。
- [参考资料](references.zh.md) —— 记号背后的标准与工具。
