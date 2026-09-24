# 常见问题

[English](faq.md) | 中文

## 为什么选择 Mermaid？

大多数 OPM 模型都与其说明文字放在一起，而 Mermaid 已是 Markdown 与文档站点的实际图表语言。它的**外部图表（external diagram）** API 让项目无需分叉 Mermaid 即可新增图表类型，因此 `mermaid-opm` 注册了 `opm` 关键字：只要加载了插件，`opm` 围栏代码块就会渲染出来。OPM 模型是由带类型的节点与边构成的有向图，能干净地映射到布局引擎上。

## 为什么没有图形化编辑？

v1 是**渲染器**，不是编辑器。编辑需要画布、命中测试、选择与撤销/重做——那基本上是另一款产品。把**OPL 文本**作为唯一事实来源，模型便可在 git 中 diff、评审与合并，同时让解析器与渲染器保持无 DOM 依赖、可测试。[演示页](../../demo/index.html)只用于查看与切换示例。

## 为什么不做布局持久化？

布局是推导出来的，而非存储的，因此同一模型总是产生同一张图。没有需要同步的独立布局文件，也无需在模型变化时发明格式、版本与失效规则。位置是模型的纯函数（经由 [dagre](https://github.com/dagrejs/dagre)）；替代引擎列在[路线图](../development/roadmap.zh.md)中。

## 现在有 LSP 了吗？

有。`mermaid-opm-lsp` 是基于 `renderModel().diagnostics` 的语言服务器，`mermaid-opm-vscode` 是内置它的 VS Code 扩展。二者为 `.opl` 文件提供实时诊断、补全、悬停与文档大纲；见 [《VS Code 扩展》](../usage/vscode.zh.md)。该服务器与编辑器无关，其它 LSP 客户端也可复用。跳转定义与格式化仍按[路线图](../development/roadmap.zh.md)计划中。

## 如何在 GitHub 上渲染 OPD？

GitHub 的 Markdown 渲染器不会加载第三方 Mermaid 插件，因此 `opm` 围栏代码块会显示为源码而非图。有两种办法：

- **预渲染为 SVG。** 用 [`opm2svg` CLI](../usage/cli.zh.md) 处理源码，提交结果并嵌入：

  ```bash
  npx opm2svg model.opl -o model.svg
  ```

  然后在 Markdown 中以图片引用 `model.svg`。

- **在你能掌控的宿主中渲染**——任何加载了插件的页面，例如[演示页](../../demo/index.html)。

例如，下列源码：

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

只在第二种情况下会渲染为 OPD；在 GitHub 上，请改提交其预渲染的 SVG。详见[固定渲染器的限制](../usage/mermaid-plugin.zh.md)。

## 使用这个库需要 Mermaid 吗？

不需要。`mermaid` 是可选的 peer 依赖，仅 Mermaid 插件（`registerOpm()`）需要它。`renderSvg`、`renderModel` 以及 `opm2svg` CLI 都无需它即可工作。
