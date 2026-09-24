# OPL 语法

[English](opl-syntax.md) | 中文

本页逐条列出 `mermaid-opm` v1 能理解的全部 OPL 子集。每个句子以句点（`.`）结束；换行只是普通空白，`;` 并非分隔符。`//` 开始一段延伸到行末的注释。开头的 `opm` 行是**可选**的：存在时会被剥离，它只在作为 Mermaid 图表触发器时才是必需的（即围栏 `mermaid` 代码块的第一个词元）。句子不区分大小写。未列出的内容一律属于[不支持项](#v1-不支持项)。

没有 `object` / `process` 关键字：事物的种类由它所在的句子推断。被消费、产生、影响、需要或展示的事物是**对象**；执行消费、产生、影响、处理、改变或发生的事物是**过程**。

## 对象与过程

单独的 `X is physical.` 只设置本质；对象/过程由该事物参与的链接决定。

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

## 本质与归属

- `X is physical.` / `X is informatical.` —— **本质**。
- `X is systemic.` / `X is environmental.` —— **归属**。
- 用 `and` 组合：`X is physical and environmental.`

```opm
Customer is physical and environmental.
Order is informatical and systemic.
Processing is informatical.
Processing consumes Order.
Processing affects Customer.
```

## 状态

- `X can be s1, s2, or s3.`（或 `X can be s1 or s2.`）列出状态。
- `X is initial s1.` 把 `s1` 标为初始状态。
- `X is final s1.` 把 `s1` 标为最终状态。

初始与最终状态**必须具名**。

```opm
Order is physical.
Order can be new, open, or closed.
Order is initial new.
Order is final closed.
Handling is physical.
Handling consumes Order.
Handling affects Order.
```

## 结构链接

### 聚合-参与

`Whole consists of A, B, and C.` —— 整体是对象，各部分也是对象。

```opm
OnStar System is physical.
OnStar System consists of Console, VCIM, Cellular Network, and GPS.
```

### 展示-特征

`A exhibits B.` —— 某对象的特征（属性或操作）。

```opm
Order is physical.
Order exhibits Price.
Order exhibits Priority.
```

### 泛化

`Special is a General.` —— 特殊对象特化一般对象。冠词 `a`/`an` **必须存在**（见[歧义规则](#歧义规则)）。

```opm
Document is informatical.
Order is informatical.
Order is a Document.
```

### 分类

`Instance is an instance of Class.`

```opm
Order is informatical.
Special Order is informatical.
Special Order is an instance of Order.
```

### 带标签（用户自定义）链接

`A <tag> B.`，其中 `<tag>` 是任意非保留字的短语，且 `A`、`B` 都已引入。

```opm
Driver is physical and environmental.
OnStar Console is physical.
Handling is physical.
Driver handles Handling.
Handling requires OnStar Console.
Driver communicates via OnStar Console.
```

## 过程链接

### 消费与产生

`P consumes O.` 与 `P yields O.` 构成变换对。被动式 `O is consumed by P.` 与 `O is yielded by P.` 也被接受。

```opm
Order is physical.
Handling is physical.
Order is consumed by Handling.
Handling yields Handled Order.
```

### 影响

`P affects O.` —— 过程改变对象，但不消费也不产生它。

```opm
Customer is physical and environmental.
Processing is informatical.
Processing affects Customer.
```

### 输入-输出对（状态变化）

`P changes O from s1 to s2.` 展开为对 `s1` 的消费与对 `s2` 的产生。

```opm
Order is physical.
Order can be new or closed.
Handling is physical.
Handling changes Order from new to closed.
```

### 代理

`A handles P.` —— 代理（作为人的对象）使能该过程。

```opm
Clerk is physical and environmental.
Order is physical.
Handling is physical.
Handling consumes Order.
Clerk handles Handling.
```

### 工具

`P requires I.` —— 工具（对象）使能该过程。

```opm
System is physical.
Order is physical.
Handling is physical.
Handling consumes Order.
Handling requires System.
```

### 条件

`P occurs if O exists.` 或 `P occurs if O is s.` —— 仅当条件成立时过程才发生。

```opm
Order is physical.
Order can be paid or unpaid.
Handling is physical.
Handling consumes Order.
Handling occurs if Order is paid.
```

## 歧义规则

- 单独的 `A is initial.` / `A is final.` **不受支持**：初始与最终状态必须具名，例如 `A is initial s1.`
- 当 `B` 是单个、非保留字且不是已声明的事物时，`A is B.` 会被解析为 `A` 上的一个**状态**，而不是泛化。泛化请使用带冠词形式 `A is a B.`
- 由于上一条规则，无冠词的**过程**泛化（如 `Special is General.`）不受支持；请使用 `Special is a General.`

## v1 不支持项

- 多个 OPD、放大（in-zoom）与展开（unfold）。
- `event`、`result`、`invocation` 链接。
- 带状态限定的消费与产生（`P consumes O in s.`）。
- 图形化编辑与布局持久化。
- `--theme` 与 `--strict` CLI 选项（计划中）。

无法识别的句子会报告 `unrecognized-sentence` 诊断，无法推断种类的事物会报告 `unknown-kind`。解析器从不抛异常；它返回带行列信息的诊断。可运行 [`opm2svg` CLI](cli.zh.md) 或调用 `renderModel()` 查看。
