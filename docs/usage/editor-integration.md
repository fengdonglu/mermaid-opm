# Editor integration

English | [中文](editor-integration.zh.md)

## LSP and VS Code extension

An OPL language server (`mermaid-opm-lsp`) and a VS Code extension
(`mermaid-opm-vscode`) are now available. The server provides live diagnostics,
completion, hover, and a document outline; the extension adds `.opl` syntax
highlighting, the language client, and the preview/export commands. See the
[VS Code extension](vscode.md) page for install and usage. Go-to-definition and
formatting are not included yet; see the [roadmap](../development/roadmap.md).

If you use another editor, or prefer not to install the extension, the two
paths below still work: shell out to the CLI, or call the library directly from
an extension.

## Option A: run the CLI on save

The [`opm2svg` CLI](cli.md) prints diagnostics to stderr as
`<severity>: <code> @<line>:<column> <message>` and exits non-zero on any
`error`. Hook it to your editor's save event and surface the output.

A minimal VS Code task:

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

Bind the task to `Run on Save` (or a `code --wait` script) to check on every
write. Any editor that can run a shell command can do the same.

## Option B: call `renderModel` from an extension

For a live experience, depend on the library and read diagnostics directly. The
parser never throws, so this is safe to call on every keystroke (debounced):

```ts
import { renderModel } from './dist/index.js'; // after building the repository

const model = renderModel(source);
for (const d of model.diagnostics) {
  // d.severity: 'error' | 'warning'
  // d.code:     e.g. 'unrecognized-sentence'
  // d.message:  human-readable text (English)
  // d.line, d.column: 1-based position
}
```

Map each diagnostic to a marker:

- **Monaco** — `monaco.editor.setModelMarkers(model, 'opm', markers)` with
  `startLineNumber`/`startColumn`/`endLineNumber`/`endColumn`/`severity`
  (`MarkerSeverity.Error` / `.Warning`) and `message`.
- **CodeMirror 6** — a `@codemirror/lint` source returning
  `{ from, to, severity, message }`; convert line/column to an offset with the
  editor's `state.doc.line(...)`.

Because a diagnostic carries only line/column (not a length), highlight the rest
of the line or a single token.

## Diagnostics reference

- `error` — `reserved-name`: a thing is named after a reserved word.
- `warning` — `unrecognized-sentence`: the sentence is outside the supported
  subset. `unknown-kind`: object/process could not be inferred. `unknown-reference`:
  a link points at a missing thing. `process-no-io`: a process has no input or
  output.

See [OPL syntax](opl-syntax.md) for what the parser accepts.

## See also

- [VS Code extension](vscode.md) — the language client, its commands, and the
  bundled `mermaid-opm-lsp` server.
- [CLI: opm2svg](cli.md) — options, exit codes, and diagnostics.
- [Roadmap](../development/roadmap.md) — go-to-definition and formatting.
