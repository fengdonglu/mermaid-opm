# CLI：opm2svg

[English](cli.md) | 中文

`opm2svg` 把 `.opl` 文件转换为 SVG 对象-过程图，并把解析模型的诊断打印到 stderr。

> **尚未发布。** `mermaid-opm` 未上 npm，因此没有全局安装的 `opm2svg` 命令。请从仓库构建后用 `node dist/cli/cli.js <input.opl> ...` 运行；执行 `npm link` 后可直接使用 `opm2svg`。下文示例均用 `node dist/cli/cli.js`。

## 用法

```
opm2svg <input.opl> [-o out.svg] [--json out.json]
```

## 选项

| 选项 | 含义 |
| --- | --- |
| `-o <file>` | 将 SVG 写入 `<file>`。默认：输入路径把扩展名替换为 `.svg`（`.opl` 被替换）。 |
| `--json <file>` | 额外把 `{ things, links, diagnostics }` 以美化 JSON 写出。 |

选项可在输入文件之后以任意顺序出现。`-o` 与 `--json` 都需要取值；缺少取值属于用法错误。

## 退出码

- `0` —— 成功。警告**不**影响退出码。
- `1` —— 失败：存在任何 `error` 诊断、输入文件不可读或不存在，或用法错误（缺少输入、未知选项、缺少选项取值）。

未知选项会先打印一行 `error:`，再打印用法行；缺少输入参数或缺少选项取值时只打印用法行。输入文件不可读或不存在时则打印 `error: cannot read <file>: <原因>`，且不打印用法行。这些都写入 stderr：

```
error: unknown argument: --theme
usage: opm2svg <input.opl> [-o out.svg] [--json out.json]
```

## 诊断

诊断逐行写入 stderr，格式为：

```
<severity>: <code> @<line>:<column> <message>
```

解析器从不抛异常。当前会发出的 code：

- `error` —— `reserved-name`（事物以保留字命名）。
- `warning` —— `unrecognized-sentence`、`unknown-kind`、`unknown-reference`、`process-no-io`。

即使存在诊断，SVG 仍会写出，便于查看部分渲染结果；退出码仍反映是否存在 `error`。

## 示例

给定 `model.opl`：

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

转换为 `model.svg`（默认输出路径）：

```bash
node dist/cli/cli.js model.opl
```

指定输出路径并同时导出模型：

```bash
node dist/cli/cli.js model.opl -o out/diagram.svg --json out/diagram.json
```

在脚本中使用，出错即失败：

```bash
node dist/cli/cli.js model.opl -o model.svg || exit 1
```

## 另见

- [快速开始](getting-started.zh.md) —— 安装与首次渲染。
- [OPL 语法](opl-syntax.zh.md) —— 支持的子集。
- [编辑器集成](editor-integration.zh.md) —— 用 CLI 做保存时诊断。
