# 编辑器集成

[English](editor-integration.md) | 中文

## LSP 与 VS Code 扩展

现在已有 OPL 语言服务器（`mermaid-opm-lsp`）和 VS Code 扩展（`mermaid-opm-vscode`）。服务器提供实时诊断、补全、悬停与文档大纲；扩展则增加 `.opl` 语法高亮、语言客户端以及预览/导出命令。安装与用法见 [《VS Code 扩展》](vscode.zh.md)。跳转定义与格式化尚未包含；见[路线图](../development/roadmap.zh.md)。

如果你使用其它编辑器，或不想安装该扩展，下面两条路径依然可用：调用 CLI，或从扩展中直接调用库。

## 方案 A：保存时运行 CLI

[`opm2svg` CLI](cli.zh.md) 会把诊断以 `<severity>: <code> @<line>:<column> <message>` 打印到 stderr，并在存在任何 `error` 时以非零码退出。把它挂到编辑器的保存事件上并展示输出即可。

一个最小的 VS Code 任务：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "OPM check",
      "type": "shell",
      "command": "node dist/cli/cli.js \"${file}\" -o \"${file}.svg\"",
      "problemMatcher": {
        "owner": "opm",
        "fileLocation": ["relative", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(error|warning): (\\w[\\w-]*) @(\\d+):(\\d+) (.*)$",
          "severity": 1,
          "code": 2,
          "line": 3,
          "column": 4,
          "message": 5
        }
      }
    }
  ]
}
```

把该任务绑定到 `Run on Save`（或一个 `code --wait` 脚本）即可在每次写入时检查。任何能执行 shell 命令的编辑器都能照此处理。

## 方案 B：从扩展调用 `renderModel`

想要实时体验，就依赖本库并直接读取诊断。解析器从不抛异常，因此可以（防抖后）在每次按键时安全调用：

```ts
import { renderModel } from './dist/index.js'; // 构建仓库之后

const model = renderModel(source);
for (const d of model.diagnostics) {
  // d.severity: 'error' | 'warning'
  // d.code:     例如 'unrecognized-sentence'
  // d.message:  英文可读文本
  // d.line, d.column: 从 1 开始的位置
}
```

把每条诊断映射为标记：

- **Monaco** —— `monaco.editor.setModelMarkers(model, 'opm', markers)`，使用 `startLineNumber`/`startColumn`/`endLineNumber`/`endColumn`/`severity`（`MarkerSeverity.Error` / `.Warning`）与 `message`。
- **CodeMirror 6** —— 一个 `@codemirror/lint` 源，返回 `{ from, to, severity, message }`；用编辑器的 `state.doc.line(...)` 把行列转换为偏移量。

由于诊断只携带行列（不带长度），可高亮该行剩余部分或单个 token。

## 诊断参考

- `error` —— `reserved-name`：事物以保留字命名。
- `warning` —— `unrecognized-sentence`：句子超出支持的子集。`unknown-kind`：无法推断对象/过程。`unknown-reference`：链接指向不存在的事物。`process-no-io`：过程没有输入或输出。

解析器接受的内容见[《OPL 语法》](opl-syntax.zh.md)。

## 另见

- [VS Code 扩展](vscode.zh.md) —— 语言客户端、其命令与内置的 `mermaid-opm-lsp` 服务器。
- [CLI：opm2svg](cli.zh.md) —— 选项、退出码与诊断。
- [路线图](../development/roadmap.zh.md) —— 跳转定义与格式化。
