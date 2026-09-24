# OPM/OPL → Mermaid 外部图插件 设计文档

- 日期：2026-09-23
- 状态：待评审
- 工作名：`mermaid-opm`
- 关联资料：`Backgroud/GBT 39470-2020.pdf`（ISO 19450 等同标准，扫描件）、OPCAT 手册、`Backgroud/*.opx` 模型

## 1. 背景与目标

OPM（Object-Process Methodology，对象-过程方法论）是 ISO 19450 标准化的系统建模范式，其图形表示为 OPD（Object-Process Diagram），文本表示为 OPL（Object-Process Language）。OPL 是受控英语，每个 OPD 构造都有一条语义等价的 OPL 语句；OPL 与 OPD 是同一语义模型的双模态表示。

**目标**：实现一个 Mermaid 外部图插件，使用户在 Mermaid 环境中写 OPL 文本即可渲染出 OPD；同时提供传统 CLI 转换器，把 `.opl` 文本转成 `.svg`。

**为何以 Mermaid 插件形式**：Mermaid 生态广（Markdown/编辑器/网页），外部插件机制允许注册自定义图类型（`registerExternalDiagrams`），可把"文本 DSL → 解析 → 图模型 → 布局 → SVG"的管线直接复用，只接管"文本理解"与"OPM 记法绘制"。

**长期价值**：本项目的 `parser → model → layout → render` 分层是为后续开发 SysML v2 可视化渲染器的复用底座。

## 2. 术语

- **Thing（事物）**：Object（对象）或 Process（过程）。
- **Object**：存在的事物。
- **Process**：变换事物的事物（生成、消耗、改变对象状态）。
- **State（状态）**：对象的境况，位于对象内部。
- **OPD**：对象-过程图，OPM 的图形表示。
- **OPL**：对象-过程语言，OPM 的文本表示，OPD 的语义等价物。
- **Structural link（结构链接）**：与时间无关的静态关系。
- **Procedural link（过程链接）**：与时间相关的动态关系，连接过程与对象/状态。

## 3. 范围

### 3.1 第一版包含（In Scope）

- **实体**：对象、过程、状态（含初始/终止态标注）。
- **结构关系**：聚合-参与、展示-特征、泛化-特化、分类-实例化、带标签结构链接。
- **过程链接（变换）**：消耗、产生（yield）、影响（effect）、输入-输出对（状态变化）。
- **过程链接（使能）**：代理（agent）、工具（instrument）、条件（condition）。
- **单张 OPD**，全自动布局，无持久化坐标。
- **两种消费方式**：Mermaid 外部图插件（浏览器/实时）、CLI（`.opl → .svg`，可选 `--json` 模型导出）。
- 解析诊断带行列号。

### 3.2 第一版不含（Out of Scope，明确不做）

- 多 OPD、in-zoom/out-zoom、展开/折叠、状态表达/抑制。
- 事件链（`triggers`）、调用链（`invokes`）、结果链（`results in`）→ 列为 P1。
- 图形拖拽编辑、布局坐标持久化、双真相源。
- 完整自然语言 OPL 解析（仅模板子集）。
- PNG 光栅化。
- Systems Modeling API 之类的服务端接口。

### 3.3 已知限制（需写进 README）

- Mermaid 外部图插件需宿主页面显式加载该插件；**GitHub Markdown 等固定渲染环境不会加载外部插件**，因此无法直接在 GitHub README 的 ```mermaid 块中渲染（需宿主集成或使用 CLI 出 SVG）。
- OPL 是受控英语而非严格无歧义语法，某些句式存在歧义（见 §5.4），第一版以"已声明名字表 + 关键字优先"消解。

## 4. 总体架构

### 4.1 数据流

```
OPL 文本 (SSOT)
  │
  ▼  core/opl      词法 → 句子切分 → 模板匹配 → 诊断(行列号)
OPM 模型 (core/model，与渲染无关的单一真相源)
  │
  ▼  layout        model → scene（节点/边/端口/记号；dagre 适配器，可换 ELK）
Scene（布局后的场景图）
  │
  ▼  render        scene → SVG 字符串（原生 OPM 记法 + 主题变量）
SVG
  ├─ 入口 A：Mermaid 外部图插件（detector/parser/db/renderer/styles）
  └─ 入口 B：CLI `opm2svg`（无浏览器；可选 --json 导出模型）
```

### 4.2 设计原则

1. **文本即唯一真相源**：不持久化布局，不存视图 JSON；SVG 是即时投影。
2. **渲染核心 DOM-free**：`sceneToSvg(scene): string` 是纯函数，Mermaid 插件与 CLI 共用。
3. **分层解耦**：`opl`（语法）与 `model`（语义）与 `layout`（几何）与 `render`（记法）互不依赖上层；未来 SysML 仅替换 `opl` 与 `render/notation`。
4. **错误不崩溃**：解析失败输出带位置的诊断；未解析引用降级渲染并告警，不抛栈。

### 4.3 目录结构

```
mermaid-opm/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts                      # 公共 API：parse(), renderSvg(), renderModel()
    core/
      opl/
        tokenize.ts               # 句子切分、注释剥离、词元
        reserved.ts               # 保留字（is, and, consists, of, ...）
        parse.ts                  # 两趟解析：声明 → 链接
        diagnostics.ts            # Diagnostic 类型与行列号
      model/
        types.ts                  # OPM 模型类型
        build.ts                  # AST/句子 → 模型
        validate.ts               # 引用完整性、类型与结构校验
    layout/
      types.ts                    # LayoutEngine 接口、Scene 类型
      dagreAdapter.ts             # 默认 dagre 实现
      index.ts                    # 选择引擎、model → scene
    render/
      sceneToSvg.ts               # scene → SVG 字符串
      shapes.ts                   # 矩形/椭圆/状态分段/专用形状
      markers.ts                  # 箭头、实心三角、空心三角、菱形、圆点
      notation.ts                 # 各 LinkKind → 记号与端点
      theme.ts                    # 主题变量映射（Mermaid theme / 默认）
    mermaid/
      detector.ts                 # /^\s*opm(?:\s|$)/
      loader.ts                   # 动态 import diagram
      diagram.ts                  # { parser, get db, renderer, styles }
      db.ts                       # 模型容器（getter 隔离，无模块级状态）
      renderer.ts                 # 桥接 sceneToSvg 到目标 <svg>
      styles.ts                   # getStyles(options) → CSS
    cli/
      cli.ts                      # opm2svg 入口
  test/
    fixtures/*.opl
    parser.spec.ts
    model.spec.ts
    layout.spec.ts
    render.spec.ts
    __snapshots__/
  demo/
    index.html
    samples/*.opl
  docs/
    superpowers/specs/2026-09-23-opm-opl-mermaid-design.md
```

单包分层。若未来 SysML 体量增大，可平滑拆为 monorepo（`@opm/core` 等）。

## 5. OPL 子集（语法规范）

语法来源：OPCAT Getting Started 手册（`Backgroud/Manual/OPCAT-3-Manual-Getting-Started-March-2009/`）中的 OPM 元素 ↔ OPL 对照表（图 13/14/15），其实现即 ISO 19450。

### 5.1 词法与通用规则

- 一行一条语句，以句号 `.` 结束；允许跨行折行（以句号切分，不按行）。
- 注释：`//` 到行尾；空行忽略。
- 名字：可含空格（如 `Driver Rescuing`、`OnStar Console`）。名字不做引号要求；解析时结合"已声明名字表"做最长匹配。
- 关键字大小写敏感（小写）：`is, and, physical, informatical, systemic, environmental, consists, of, exhibits, instance, can, be, or, consumes, yields, affects, requires, occurs, if, exists, changes, from, to, handles`。
- 保留字不能作为名字。

### 5.2 实体语句

| 构造 | OPL 模板 | 说明 |
|---|---|---|
| 对象/过程本质+归属 | `A is physical.` / `A is informatical.` / `A is physical and environmental.` / `A is informatical and systemic.` | 本质 ∈ {physical, informatical}，归属 ∈ {systemic, environmental}；默认 `informatical and systemic` |
| 状态声明 | `A is s1.` | RHS 非保留字且非已声明事物 → 视为状态 |
| 状态列表 | `A can be s1 or s2.` / `A can be s1, s2, or s3.` | |
| 初始/终止态 | `A is initial s1.` / `A is final s1.` | v1 要求带状态名（裸写的 `A is initial.` 暂不支持）；OPCAT 中经由 UI 标记，实现时与其实际输出核对 |

**事物类型（object/process）推断**：OPL 不显式区分对象与过程，按角色推断：
- 作为 `consumes/yields/affects/requires/occurs if/handles/changes` 的主语 → process。
- 作为上述宾语或 `consists of/exhibits/is an instance of` 的主语/宾语 → object。
- 仅声明、无任何链接 → 默认 object，并给 `unknown-kind` 告警。

### 5.3 链接语句

**结构链接**

| 关系 | OPL 模板 | 连接 |
|---|---|---|
| 聚合-参与 | `Whole consists of Part.`（支持逗号列表：`Whole consists of A, B, and C.`） | 对象-对象 / 过程-过程 |
| 展示-特征 | `A exhibits B.` | 对象-对象 |
| 泛化-特化 | `Special is a General.`（带冠词，对象；v1 唯一支持形式） | 对象-对象 |
| 分类-实例化 | `Instance is an instance of Class.` | 对象-对象 |
| 带标签 | `<A> <tag> <B>.`（未匹配已知模板且含两个已声明名字的句子 → 标签链，tag 为中间未知词；方向 A→B） | 对象-对象 / 过程-过程 |

**过程链接**

| 关系 | OPL 模板 | 连接 | 说明 |
|---|---|---|---|
| 消耗 | `Process consumes Object.` / `Object is consumed by Process.` | 对象→过程 | 输入链 |
| 产生 | `Process yields Object.` / `Object is yielded by Process.` | 过程→对象 | 输出链 |
| 影响 | `Process affects Object.` | 过程↔对象 | 双箭头 |
| 输入-输出对 | `Process changes Object from s1 to s2.` | 状态→过程、过程→状态 | |
| 代理 | `Agent handles Process.` | 对象→过程 | 使能，实心圆端点 |
| 工具 | `Process requires Instrument.` | 对象→过程 | 使能，空心圆端点 |
| 条件 | `Process occurs if Object exists.` / `Process occurs if Object is s1.` | 对象/状态→过程 | 使能，开放箭头端点 |

**P1（暂缓，parser 预留但不在第一版渲染）**：`Process results in Object.`、`Process invokes Process.`、`Object triggers Process.`、`Object triggers Process, which, if occurs, consumes Object.`、状态限定的消耗/产生（`consumes s1 Object`）。

### 5.4 歧义与消解

- `A is B.`：优先判定 `B` 是否保留字/已声明事物；否则视为状态。
- 泛化的无冠词过程形式 `Special is General.` 与状态声明 `A is s1.` 完全同形，无法可靠区分；**v1 不支持该形式**（会按状态解析），过程泛化请改用带冠词形式。列为 P1。
- 名字与关键字冲突：以已声明名字表做最长匹配，必要时可用行内反引号转义（如 `` `A is B` ``）。
- 以上歧义规则会写入 README；`--strict` 模式对歧义给出错误而非静默选择。

## 6. OPM 模型（单一真相源）

```ts
type ThingKind = 'object' | 'process' | 'unknown';
type Essence = 'physical' | 'informatical';
type Affiliation = 'systemic' | 'environmental';

interface State { name: string; initial?: boolean; final?: boolean; }

interface Thing {
  id: string;            // 稳定 id（由名字规范化生成）
  name: string;
  kind: ThingKind;
  essence?: Essence;
  affiliation?: Affiliation;
  states: State[];
}

type LinkKind =
  | 'aggregation' | 'exhibition' | 'generalization' | 'classification' | 'tagged'
  | 'consumption' | 'production' | 'effect' | 'input-output'
  | 'agent' | 'instrument' | 'condition';

interface Endpoint { thingId: string; stateName?: string; }

interface Link {
  id: string;
  kind: LinkKind;
  source: Endpoint;
  target: Endpoint;
  tag?: string;          // 仅 tagged
}

type Severity = 'error' | 'warning';
interface Diagnostic { severity: Severity; code: string; message: string; line: number; column: number; }

interface OpmModel {
  things: Map<string, Thing>;
  links: Link[];
  diagnostics: Diagnostic[];
}
```

**校验规则（validate）**：

| 代码 | 级别 | 条件 |
|---|---|---|
| `unknown-reference` | warning | 链接端点引用了未声明的名字（降级为占位节点） |
| `unknown-kind` | warning | 事物仅声明、未由上下文确定 object/process |
| `duplicate-declaration` | warning | 同名重复声明（合并状态） |
| `process-no-io` | warning | 过程既无输入也无输出 |
| `state-undeclared` | warning | `is s1` 引用了未在列表声明中的状态 |
| `ambiguous-sentence` | error/strict | §5.4 歧义在 strict 下报错 |
| `reserved-name` | error | 用保留字作为名字 |

## 7. 布局

- 接口：`interface LayoutEngine { layout(model: OpmModel, opts?): Scene; }`
- 默认实现：`@dagrejs/dagre` 有向分层布局（轻、稳定、适合 OPD 的对象↔过程二分结构）。
- Scene 类型：`{ nodes: SceneNode[]; edges: SceneEdge[]; bounds; }`；`SceneNode` 含几何（x/y/w/h）与语义引用（thingId/stateName）；`SceneEdge` 含路由点与 `LinkKind`。
- 引擎可替换：预留 `elkAdapter` 位置（IBD 端口式布局等），第一版不实现。
- 自动布局的**美观度**是主要风险：通过节点间距、层级方向（默认 LR/TB）、过程椭圆与对象矩形的分层交替来调优；不追求手工级美观。

## 8. 渲染记法（OPM）

依据 OPCAT 符号表截图（图 13 实体 `0017.png`、图 14 结构链接 `0018.png`、图 15 过程链接 `0019.png`/`0020.png`）确定：

- **实体**：对象 = 矩形；状态 = 圆角矩形（对象内有状态时按状态上下分段，每段显示状态名；独立状态引用时用圆角框）；过程 = 椭圆。
- **代理/工具**：对象本体同为矩形（语义由使能链的端点记号体现，不改形状）。
- **结构链接（图 14，六个图形）**：
  - 聚合-参与：**实心三角**，尖端指向整体。
  - 展示-特征：**空心三角内含实心三角**，尖端指向展示者。
  - 泛化-特化：**空心三角**，尖端指向一般（父）。
  - 分类-实例化：**空心三角内含实心圆点**，尖端指向类。
  - 标签（单向）：实线 + 开放箭头。
  - 标签（双向）：实线 + 双开放箭头。
- **过程链接（图 15）**：
  - 消耗（输入）：实线，实心三角箭头指向过程。
  - 产生/输出：实线，实心三角箭头指向对象。
  - 影响（effect）：实线，双端实心三角箭头。
  - 输入-输出对：两条实线（状态→过程、过程→状态）。
  - 代理（agent）：**实线**，过程端为**实心圆**（lollipop）。
  - 工具（instrument）：**实线**，过程端为**空心圆**（lollipop）。
  - 条件（condition）：实线，过程端为**空心三角箭头**。
  - 事件链（P1）：虚线（第一版不实现）。
- **记号实现**：集中在 `render/markers.ts` 与 `render/notation.ts`；使能链为实线这一点已据符号表确认（此前草案误写为虚线，已修正）。
- **主题**：颜色全部取自主题变量，禁止硬编码 hex（便于暗色模式与 Mermaid 主题联动）。

## 9. Mermaid 集成

依据官方 `new-diagram` 文档与本地 mermaid@12 类型定义：

```ts
const id = 'opm';
const detector = (txt: string) => /^\s*opm(?:\s|$)/.test(txt);
const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};
export const opm: ExternalDiagramDefinition = { id, detector, loader };
// diagram: { parser, get db, renderer, styles }
```

- 用户用法：
  ```mermaid
  opm
  Order is physical and environmental.
  Order is initial new.
  Handling handles Order.
  Handling consumes Order.
  Handling yields Handled Order.
  Handling requires Clerk.
  ```
- `parser.parse(text)`：调用 `core/opl`，把 `OpmModel` 写入 `db`。
- `db`：用 getter 形态（每次读取新实例）以满足 Mermaid 的隔离要求，无模块级可变状态。
- `renderer.draw(text, id, version, diagramObject)`：从 `db` 取模型 → 布局 → `sceneToSvg` → 注入 `#id` 对应 `<svg>`，设置 `viewBox`/尺寸。
- `styles`：`getStyles(options)` 返回 CSS，颜色取 `options` 主题变量。
- 注册：`await mermaid.registerExternalDiagrams([opm], { lazyLoad: false })`（CLI/SSR 用 false；网页默认懒加载）。

**风险点**：`renderer.draw` 获取目标 `<svg>` 的确切机制需以最小 spike 验证（见 §13）。

## 10. CLI

```
opm2svg <input.opl> [-o out.svg] [--json out.json]
```

- 输入 `.opl`，输出 `.svg`（默认与输入同名或 `-o` 指定）。
- `--json`：导出 `OpmModel`（用于调试、未来 SysML 复用、CI 断言）。
- 纯 Node，无浏览器；复用 `parse → layout → sceneToSvg`。
- 退出码：`0` 成功；有 error 诊断时非 0；warning 不阻断。
- 未知参数（包括尚未实现的 `--theme`/`--strict`）报用法错误并返回非 0；这两个选项为未来/未支持。

## 11. 测试策略

1. **parser 单测**：覆盖 §5 每条模板，正例 + 非法输入，断言模型与行列号诊断。
2. **model/validate 单测**：引用完整性、类型推断、§6 校验规则。
3. **layout 单测**：无重叠、包含关系、端点存在。
4. **render 黄金快照**：小型 OPL → SVG 快照（`vitest` snapshot），覆盖每种 LinkKind。
5. **docs spec**：从 README/示例提取 ```opm 块并 `parse`，确保文档不漂移（借鉴官方做法）。
6. **端到端 smoke**：在 jsdom 中注册插件，`mermaid.render('opm', text)` 成功产出 SVG。
7. **样例对齐**：用 OPCAT 手册 OnStar 例子（或本仓库 `.opx` 导出的 OPL）作为夹具。

## 12. 打包与发布

- 语言/工具：TypeScript + `esbuild`（打包 ESM，产出浏览器可用 bundle）+ `vitest`（测试）。
- `package.json`：`"type": "module"`、`exports` 提供 `import` 与浏览器 bundle、`bin: { opm2svg }`。
- 依赖：`mermaid`（peer/可选）、`@dagrejs/dagre`；**不**引入重依赖。
- 许可：MIT。
- 发布路径：先发布到用户自己的 GitHub 仓库（npm 包名 `mermaid-opm`，仓库名同名），再评估是否按 Mermaid 官方 `new-diagram` 规范（Chevrotain 语法、主题变量、e2e 快照、changeset、docs/sidebar 等）提交进官方核心。

## 13. 实施里程碑

- **M0（去风险 spike）**：最小外部图插件，验证 `renderer.draw` 能取得并绘制 `#id` 的 `<svg>`；跑通 `registerExternalDiagrams`。
- **M1（核心链路）**：parser（§5 子集）+ model + validate + 诊断。
- **M2（渲染）**：dagre 布局 + sceneToSvg（全部 in-scope 记法）+ 主题。
- **M3（集成）**：Mermaid 插件接线 + CLI + `--json`。
- **M4（质量）**：单测 + 黄金快照 + docs spec + 示例 + README（含限制说明）。
- **P1（后续）**：事件/结果/调用链、状态限定使能、ELK 布局、LS P/编辑器补全、SysML v2 复用。

## 14. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| `renderer.draw` 取 `<svg>` 机制不明 | 阻断集成 | M0 spike 先验证 |
| 自动布局美观度差 | 可用性 | 优先调间距/层级；接受"结构清楚即可"；预留 ELK |
| OPL 受控英语歧义 | 误解析 | 已声明名字表 + 关键字优先 + strict 模式 + 文档 |
| OPM 记号形状不准确 | 专业性 | 对照 OPCAT 符号图核对；集中实现便于迭代 |
| 外部插件在 GitHub/固定环境不可用 | 预期落差 | README 明确限制；提供 CLI 出 SVG 作为替代 |
| 初始/终态 OPL 写法未定 | 小 | 隔离在 parser；核对后一处修正 |

## 15. 待决问题

1. 包名/仓库名：定为 `mermaid-opm`（无 scope，npm 已确认可用）；如需改为 scoped 再说。
2. 初始/终态的精确 OPL 写法（实现时与 OPCAT 输出核对）。
3. 是否在 M0 后立即初始化 git 仓库并提交（用户批准过"初始化 git"）。

## 16. 验收标准

- 给定 §9 示例 OPL，Mermaid 环境可渲染出正确 OPD SVG。
- `opm2svg model.opl -o model.svg` 产出相同语义的 SVG；`--json` 产出模型 JSON。
- §5 每条 in-scope 模板至少一个正例与一个非法例测试通过。
- 诊断含行列号；未定义引用降级并告警，不崩溃。
- README 明确列出支持范围、不支持范围与已知限制。
