# LSP + VS Code 扩展 设计文档（子项目 lsp-vscode）

- 日期：2026-09-24
- 状态：待评审
- 关联：`docs/superpowers/specs/2026-09-23-opm-opl-mermaid-design.md`（v1 核心）、`2026-09-24-docs-and-demo-design.md`
- GitHub：`fengdonglu`

## 1. 背景与目标

`mermaid-opm` 已提供核心库（OPL 解析 + 诊断 + 渲染）、Mermaid 插件、CLI、演示与文档。编辑体验方面目前**没有 LSP**（已如实文档化）。

**目标**：新增一个可复用的 **Language Server**（`mermaid-opm-lsp`）与一个轻量 **VS Code 扩展**（`mermaid-opm-vscode`），为 `.opl` 提供语法高亮、实时诊断、补全、悬浮与大纲。

## 2. 范围

### 2.1 包含
- 仓库改为 **npm workspaces**（根=核心库；`packages/lsp`；`packages/vscode-opm`）。
- 核心增强：为事物/状态/链接的声明记录**源码位置**；诊断尽量定位到相关行列；公开导出 `parseOpl` 与相关类型。
- LSP 服务器（stdio）：诊断、补全、悬浮、文档符号（大纲）。
- VS Code 扩展：语言贡献（`.opl`）、TextMate 语法高亮、语言客户端、预览命令、导出 SVG 命令。
- 双语文档（`docs/usage/vscode.md` + `.zh.md`；更新 `editor-integration.md`）与 CI。

### 2.2 不包含
- **格式化**：v1 的 OPL 子集是扁平的（无嵌套、无缩进层级），没有可计算的"正确缩进"；保守式（仅空白规范化）价值有限。列为后续。
- 跳转定义 / 重命名 / 代码操作 / 语义高亮细分（`semanticTokens`）。
- Neovim 等其它编辑器的专用插件（LSP 服务器本身可被它们复用）。
- 更深层的语义校验（端口/量纲等，本就超出 v1 OPL 子集）。

### 2.3 硬约束
- 新增代码、注释、英文文档一律英文；中文仅 `.zh.md`。
- 根核心库的现有测试必须保持全绿；核心改动**向后兼容**（新增位置字段，不改既有字段语义）。
- 不得臆造 OPL 语法或 LSP 能力。

## 3. 仓库结构（npm workspaces）

```
package.json                 # 根 = 核心库 mermaid-opm；"workspaces": ["packages/*"]
src/ test/ dist/ ...         # 核心库（不动）
packages/
  lsp/                       # mermaid-opm-lsp
    package.json  tsconfig.json  build.mjs
    src/server.ts  src/features/*.ts  bin/opm-lsp
    test/*.spec.ts
  vscode-opm/                # mermaid-opm-vscode
    package.json              # contributes: languages/grammars/commands/configuration
    src/extension.ts          # 语言客户端 + 命令
    syntaxes/opl.tmLanguage.json
    test/*.spec.ts
```
- 根 `package.json` 增加 `"workspaces": ["packages/*"]`；根 `test`/`build` 行为不变。
- LSP 依赖核心：`"mermaid-opm": "file:../.."`（workspace 内解析）。构建/测试前需先构建根（CI 顺序：build root → build/test workspaces）。
- 版本：`mermaid-opm-lsp@0.1.0`、`mermaid-opm-vscode@0.1.0`。

## 4. 核心增强（`src/core`，向后兼容）

- 类型（`src/core/model/types.ts`）新增（可选字段，避免破坏既有构造）：
  - `interface Position { line: number; column: number }`（1-based）
  - `Thing.position?: Position`
  - `State.position?: Position`
  - `Link.position?: Position`
- 解析器（`src/core/opl/parse.ts`）：在创建 `Thing`/`State`/`Link` 时记录其**声明句子的起始行列**（`splitSentences` 已提供 `line`/`column`）。
- 校验（`src/core/model/validate.ts`）：`reserved-name`、`unknown-kind` 使用事物的 `position`；`process-no-io` 使用过程 `position`；`unknown-reference` 使用链接 `position`。无位置时回退 1:1。
- 入口（`src/index.ts`）新增导出：`parseOpl`、`type ParseOptions`、`type Diagnostic`、`type Severity`（保持既有导出不变）。
- 测试：新增位置断言（事物/状态/链接位置；诊断位置指向正确行列）；既有测试全绿。

## 5. LSP 服务器（`packages/lsp`）

- 依赖：`vscode-languageserver`、`vscode-languageserver-textdocument`、`mermaid-opm`。
- 传输：stdio；bin `opm-lsp`。
- 能力与实现：
  - **诊断** `textDocument/publishDiagnostics`（`onDidOpen`/`onDidChange`）：`renderModel(text)` → `Diagnostic[]` 映射为 LSP `Diagnostic`（severity：error→Error，warning→Warning；range 由 1-based line/column 转为 0-based）。
  - **补全** `textDocument/completion`：保留字/关键字（`is/physical/...`）+ 当前文档已声明的对象/过程/状态名。
  - **悬浮** `textDocument/hover`：光标处名字 → 显示 kind、essence、affiliation、states。
  - **文档符号** `textDocument/documentSymbol`：所有事物（含状态），范围为声明位置（无结束位置时以名字长度为跨度）。
- 结构：`src/features/{diagnostics,completion,hover,symbols}.ts` 各导出纯函数 `(doc, params) => result`，`src/server.ts` 接线 `connection`；纯函数便于单测。
- 测试：用 `TextDocument.create` 构造内存文档，直接调用各 feature 函数断言结果（不启动真实连接）。

## 6. VS Code 扩展（`packages/vscode-opm`）

- `package.json` contributions：
  - `languages`: id `opm`，extensions `.opl`，aliases `OPL`。
  - `grammars`: `syntaxes/opl.tmLanguage.json`（scopeName `source.opl`），在 `deactivate` 之外无需运行时。
  - `commands`: `opm.preview`（Open Preview）、`opm.exportSvg`（Export SVG）。
  - `configuration`: 例如 `opm.diagnostics.enable`（默认 true）。
  - `activationEvents`: `onLanguage:opm`。
- `src/extension.ts`：用 `vscode-languageclient/node` 的 `LanguageClient` 启动 LSP（server 以打包单文件形式随扩展分发）；注册两个命令。
- **Open Preview**：Webview 面板，读取当前 `.opl`，调用核心 `renderSvg`，显示 OPD；文档变更时刷新（`onDidChangeTextDocument`）。
- **Export SVG**：`renderSvg` 结果写入用户选择路径的 `.svg`。
- 语法高亮：TextMate 语法覆盖 `opm` 头、保留字、对象名（默认色）、状态与注释（`//`）；纯正则，不追求完美着色。
- 构建：esbuild 将 `src/extension.ts` 与 LSP server 分别打包到 `dist/`（server 内联 `mermaid-opm`）。
- 测试：`package.json` contributions 结构断言、`opl.tmLanguage.json` 可解析、命令注册存在；预览渲染逻辑由核心测试覆盖（Webview 交互不单测）。

## 7. 文档与规范

- 新增 `docs/usage/vscode.md`(+`.zh.md`)：安装扩展、支持的命令与能力、与 CLI 的关系。
- 更新 `docs/usage/editor-integration.md`(+`.zh.md`)：从"无 LSP"改为"提供 LSP 与 VS Code 扩展"，并说明"跳转定义/格式化"为后续。
- `README`(+zh) 增加"Editor (VS Code)"一节，链接到 `docs/usage/vscode.md`。
- `AGENTS.md`：说明 workspaces 结构与 `packages/*` 的英文规约。
- CI（`.github/workflows/ci.yml`）：先 `npm ci && npm run build`，再构建/测试各 workspace；新增 workspace 测试步骤。
- `conventions.spec.ts` 扫描范围加入 `packages/`（英文约束）。
- `CHANGELOG.md` 增加未发布条目。

## 8. 测试与验收

- 根：`npm test`、`npm run typecheck`、`npm run build` 全绿（含新增位置单测）。
- `packages/lsp`：四类能力的纯函数单测通过；`npm run build -w mermaid-opm-lsp` 产出 `dist`。
- `packages/vscode-opm`：contributions/语法/命令断言通过；`npm run build -w mermaid-opm-vscode` 产出扩展 `dist`。
- 文档：`docs/usage/vscode.md` 等中英齐备；`docs.spec.ts` 代码块零诊断校验仍通过。
- 手工（可选）：在 VS Code 中打开 `.opl`，看到高亮与诊断，运行 Open Preview 出图。

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| workspaces 改动影响根构建/测试 | 根脚本保持不变；CI 分步构建；先本地验证 `npm ci` 与根 `npm test` |
| LSP 依赖未构建的核心 | 约定构建顺序（根先）；CI 明确；LSP 的 devDependency/依赖用 `file:../..` |
| 位置信息不精确（多词名字）| 以"句子起点"为声明位置，足够大纲/诊断；跳转定义留待后续做"引用→声明"映射 |
| VS Code 扩展无法在 CI 中真机验证 | 只做静态校验（contributions/语法 JSON/构建产物存在）；交互留手工 |
| 语法高亮正则过度/不足 | 保守着色；以 `.opl` 样例回归（可加语法 JSON 的结构断言）|

## 10. 后续（不在本轮）
- 跳转到定义 / 重命名 / 代码操作 / 语义高亮。
- 格式化（需先让分词器保留注释并做规范化重排）。
- Neovim 专用配置示例。
