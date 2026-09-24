# 文档与演示体系 设计文档（子项目 docs-and-demo）

- 日期：2026-09-24
- 状态：待评审
- 关联：`docs/superpowers/specs/2026-09-23-opm-opl-mermaid-design.md`（v1 实现 spec）
- GitHub：`fengdonglu`（LICENSE/仓库 URL/徽章使用）

## 1. 背景与目标

v1（OPM/OPL → Mermaid 插件 + CLI）已实现并通过测试。当前 `README.md` 极简，`demo/index.html` 只有一个例子，缺少文档体系、工程规约与 GitHub 基建。

**目标**：把项目提升到可发布、可维护、可协作的状态——精致的演示画廊、成体系的双语文档、明确的工程规约、以及 GitHub 基建（CI、模板、LICENSE）。

## 2. 范围

### 2.1 包含
- A. 演示画廊（精致 UI、左右对照、10 个由浅入深的例子）。
- B. 文档体系（使用 / 开发 / 项目说明 三类）。
- C. 双语文档（英文为准 + 同名 `.zh.md` 中文副本）。
- D. 工程规约（`AGENTS.md`；现有中文注释英文化；更新用户全局 CLAUDE.md）。
- E. GitHub 基建（LICENSE、CONTRIBUTING、CI、Pages、issue/PR 模板）。

### 2.2 不包含（另立子项目）
- LSP / VS Code 扩展（本次仅**如实**文档化：无 LSP；给出基于 CLI/库 API 的编辑器诊断路径，并在 roadmap 中列为后续）。
- 站点生成器 / 自建文档站（用纯 Markdown，GitHub 直接渲染）。
- PNG 光栅化、软件层 i18n（插件/CLI 的输出字符串与诊断一律英文；仅**文档**做中英双份，软件不引入 i18n 框架）。

### 2.3 硬性约束
- 所有示例与文档中的 `opm` 代码块**只能使用 v1 已实现的语法子集**，不得臆造语法；由测试校验（零 `unrecognized-sentence`、零 `unknown-kind`）。
- 文档英文为准，中文为副本；代码注释一律英文。

## 3. A. 演示画廊

### 3.1 形态
- 单页静态应用 `demo/index.html`（零构建，直接由 `npm run dev` 或 GitHub Pages 托管）。
- 顶栏：项目名、一句简介、GitHub 链接、（可选）浅色/深色切换。
- 主体左右两栏：
  - **左栏**：当前示例标题、该例讲解（**英文**；演示页整体英文、不做 i18n，中文读者见 `docs/**/*.zh.md`）、OPL 源码（等宽、可复制）。
  - **右栏**：实时渲染的 OPD（用真实插件：`registerOpm` + `mermaid.render`）。
- 侧边或顶部：10 个示例的列表导航（点击切换，当前项高亮）。
- 交互：切换到某例 → 渲染其 OPD；左侧展示其 OPL 与讲解。

### 3.2 示例清单（由浅入深，均为已实现语法）
示例源文件放 `demo/samples/NN-slug.opl`，页面从同源 `fetch` 加载；同时内嵌讲解文案（`demo/examples.mjs` 或同目录 JS）。

1. **对象、过程与变换链**
```
opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```
2. **本质与归属**（physical/informatical/systemic/environmental）
```
opm
Customer is physical and environmental.
Order is informatical.
Processing is informatical.
Processing consumes Order.
Processing affects Customer.
```
3. **对象状态**
```
opm
Order is physical.
Order can be new, open, or closed.
Order is initial new.
Order is final closed.
Handling is physical.
Handling consumes Order.
Handling affects Order.
```
4. **输入-输出对（状态变化）**
```
opm
Order is physical.
Order can be new or closed.
Handling is physical.
Handling changes Order from new to closed.
```
5. **使能链：代理与工具**
```
opm
Clerk is physical and environmental.
System is physical.
Order is physical.
Handling is physical.
Handling consumes Order.
Clerk handles Handling.
Handling requires System.
```
6. **条件链**
```
opm
Order is physical.
Order can be paid or unpaid.
Handling is physical.
Handling consumes Order.
Handling occurs if Order is paid.
```
7. **聚合-参与（整体/部分）**
```
opm
OnStar System is physical.
OnStar System consists of Console, VCIM, Cellular Network, and GPS.
Console is physical.
VCIM is physical.
Cellular Network is physical.
GPS is physical.
```
8. **展示-特征（属性）**
```
opm
Order is physical.
Order exhibits Price.
Order exhibits Priority.
Price is informatical.
Priority is informatical.
```
9. **泛化与分类**
```
opm
Document is informatical.
Order is informatical.
Order is a Document.
Special Order is informatical.
Special Order is an instance of Order.
```
10. **带标签链接**
```
opm
Driver is physical and environmental.
OnStar Console is physical.
Driver communicates via OnStar Console.
```

> 上述示例在实现阶段以测试校验：`renderSvg` 产出 `<svg>`，且诊断中无 `unrecognized-sentence` / `unknown-kind`。若出现 `process-no-io` 等其它 warning，可接受并在示例讲解中说明；尽量为零。

### 3.3 讲解维度
每个示例的讲解包含：本示例演示的 OPL 特性、对应 OPD 记号、以及一句“边界”（不支持什么），呼应主文档。

## 4. B/C. 文档体系与双语

### 4.1 目录结构
```
README.md                       # 项目总览（英文）
README.zh.md                    # 中文副本
AGENTS.md                       # 工程/贡献规约（英文）
CONTRIBUTING.md / .zh.md        # 贡献指南
CHANGELOG.md                    # 变更记录（Keep a Changelog）
LICENSE                         # MIT
docs/
  index.md / index.zh.md        # 文档导航
  usage/
    getting-started.md/.zh.md   # 安装 + 快速开始（插件与 CLI）
    opl-syntax.md/.zh.md        # 支持的 OPL 子集 + 示例（含歧义与限制）
    cli.md/.zh.md               # opm2svg 用法、选项、退出码、示例
    mermaid-plugin.md/.zh.md    # registerExternalDiagrams 用法、宿主集成、限制
    editor-integration.md/.zh.md# 无 LSP 的现状；用 CLI/库 API 在编辑器中获得诊断
  development/
    architecture.md/.zh.md      # 分层与数据流
    build-and-test.md/.zh.md    # 构建/测试/类型检查/发布
    integration.md/.zh.md       # Vite/webpack/纯 ESM、Node/SSR、CDN
    extending.md/.zh.md         # 新增链类型/记法/主题；如何扩展
    roadmap.md/.zh.md           # P1：事件/结果/调用链、ELK、LSP
  about/
    what-is-opm-opl.md/.zh.md   # OPM/OPL/ISO 19450 简介
    references.md/.zh.md        # ISO 19450、GB/T 39470-2020、OPCAT、相关文献
    faq.md/.zh.md               # 常见问题
```
- 每个英文文档顶部有一行语言切换：`English | [中文](xxx.zh.md)`，中文副本反向链接。
- 纯 Markdown；相对链接可在 GitHub 直接点击。

### 4.2 内容要点
- `README`：项目定位、特性、安装（npm/CDN）、30 秒上手（插件 + CLI 各一段）、支持/不支持、已知限制、指向 docs、Vibe Coding 说明、License。**结尾明确“本项目基于 Vibe Coding 开发”**。
- `getting-started`：`npm i`、`registerOpm` 示例、CLI 示例、最小可运行 demo。
- `opl-syntax`：逐条列出 §v1 子集（实体/状态/结构/过程），每条给 OPL 与说明；含歧义规则与不支持项。
- `cli`：`opm2svg <in.opl> [-o out.svg] [--json out.json]`，退出码，示例命令与输出。
- `mermaid-plugin`：`registerExternalDiagrams` 用法、`opm` 检测关键字、`startOnLoad` 注意事项（演示中踩到的坑）、宿主限制（固定渲染器如 GitHub Markdown 不加载外部插件）。
- `editor-integration`：**如实说明无 LSP**；给出用 CLI 在保存时输出诊断、或调用库 `renderModel().diagnostics` 自行接入 Monaco/CodeMirror 的路径。
- `development/*`：面向二次开发者。
- `about/*`：方法论与出处（引用本地资料：GB/T 39470-2020、OPCAT 手册、ISO 19450）。

## 5. D. 工程规约

### 5.1 `AGENTS.md`（英文）
包含：项目简介；目录结构；命令（`npm run build/test/typecheck/dev`）；编码规范（TypeScript ESM、`.js` 后缀、**注释与文档一律英文**、测试要求、颜色只走主题、不臆造 OPL 语法）；文档规范（英文为准 + `.zh.md` 副本）；提交规范（Conventional Commits）；TDD 期望；Vibe Coding 声明。

### 5.2 注释英文化
把 `src/`、`test/`、`scripts/`、`demo/` 中现有中文注释翻译为英文（行为不变）。以 `rg -n "[\u4e00-\u9fff]"` 扫出后逐一改写；测试保持全绿。

### 5.3 用户全局配置
更新 `C:\Users\fengd\.claude\CLAUDE.md`，新增：与用户对话使用中文；项目产出（文档、注释）使用英文。**（仓库外，已获用户授权）**

## 6. E. GitHub 基建

- `LICENSE`：MIT，著作权人 `fengdonglu`。
- `CONTRIBUTING.md`（+`.zh.md`）：开发环境、TDD 流程、提交/PR 规范。
- `.github/workflows/ci.yml`：Node LTS 矩阵；`npm ci` → `typecheck` → `test` → `build`。
- `.github/workflows/pages.yml`：构建后将 `demo/`（连同 `dist/`、`demo/samples`）发布到 GitHub Pages；演示页可从 `/demo/` 访问。
- `.github/ISSUE_TEMPLATE/bug_report.md`、`feature_request.md`；`.github/pull_request_template.md`。
- `CHANGELOG.md`（Keep a Changelog 格式，起始 v0.1.0）。

## 7. 测试与校验

- 新增 `test/samples.spec.ts`：读取 `demo/samples/*.opl`，断言 `renderSvg` 产出 `<svg>` 且诊断无 `unrecognized-sentence`、无 `unknown-kind`。
- 扩展 `test/docs.spec.ts`：扫描 `README.md` 与 `docs/**/*.md`（英文版）中所有 ```` ```opm ```` 代码块，断言同样条件（文档不漂移）。
- `npm run typecheck`、`npm run build` 保持绿。
- 中文副本不参与代码块强校验（可含相同代码块，但测试以英文版为准；中文副本的代码块也应合法——可一并纳入或抽样）。

## 8. 验收标准

- `npm run dev` 打开演示页：右侧渲染出 OPD，左右对照可用，10 个示例可切换。
- 10 个示例与全部英文文档的 `opm` 块零 `unrecognized-sentence`/`unknown-kind`。
- `README.md` / `README.zh.md` 成体系并互链；docs 三类齐备且每篇有中文副本。
- `AGENTS.md` 存在且代码注释全英文（`rg` 无中文注释残留）。
- `LICENSE`、`CONTRIBUTING(+zh)`、CI、Pages、issue/PR 模板就位；`ci.yml` 在本地可复现（typecheck+test+build 全绿）。
- README 结尾含 Vibe Coding 声明。

## 9. 风险

| 风险 | 对策 |
|---|---|
| 示例/文档代码块触发诊断，测试失败 | 只用已验证语法；测试自动拦截；逐步修正示例 |
| 中英双份文档维护成本 | 以英文为准，中文副本标注“如与英文冲突以英文为准” |
| Pages 部署依赖 `dist/` 未入库 | Pages 工作流先 `npm ci && npm run build`，再发布 `demo` + `dist` |
| 注释英文化引入行为变更 | 仅改注释，测试全绿作为门禁 |
| 演示页依赖 CDN mermaid | 已在 demo 修复竞态；Pages 亦用 CDN；README 说明需联网 |
