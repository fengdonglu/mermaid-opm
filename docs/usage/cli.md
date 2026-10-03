# CLI: opm2svg

English | [中文](cli.zh.md)

`opm2svg` converts an `.opl` file into an SVG Object-Process Diagram and prints
the parsed model's diagnostics to stderr.

## Synopsis

```
opm2svg <input.opl> [-o out.svg] [--json out.json]
```

## Options

| Option | Meaning |
| --- | --- |
| `-o <file>` | Write the SVG to `<file>`. Default: the input path with a `.svg` extension (`.opl` is replaced). |
| `--json <file>` | Additionally write `{ things, links, diagnostics }` as pretty-printed JSON. |

Options may appear in any order after the input file. A value is required for
both `-o` and `--json`; a missing value is a usage error.

## Exit codes

- `0` — success. Warnings do **not** affect the exit code.
- `1` — failure: any `error` diagnostic, an unreadable or missing input file, or
  a usage error (missing input, unknown flag, or a missing option value).

An unknown flag prints an `error:` line followed by the usage line; a missing
input argument or a missing option value prints only the usage line. An
unreadable or nonexistent input file prints `error: cannot read <file>:
<reason>` with no usage line. All are written to stderr:

```
error: unknown argument: --theme
usage: opm2svg <input.opl> [-o out.svg] [--json out.json]
```

## Diagnostics

Diagnostics are written to stderr, one per line, as:

```
<severity>: <code> @<line>:<column> <message>
```

The parser never throws. Codes currently emitted:

- `error` — `reserved-name` (a thing is named after a reserved word).
- `warning` — `unrecognized-sentence`, `unknown-kind`, `unknown-reference`,
  `process-no-io`.

The SVG is written even when diagnostics are present, so you can inspect the
partial render; the exit code still reflects any `error`.

## Examples

Given `model.opl`:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

Convert it to `model.svg` (the default output path):

```bash
npx opm2svg model.opl
```

Choose an explicit output path and also dump the model:

```bash
npx opm2svg model.opl -o out/diagram.svg --json out/diagram.json
```

Wrap it in a script and fail the build on errors:

```bash
npx opm2svg model.opl -o model.svg || exit 1
```

## See also

- [Getting started](getting-started.md) — install and first render.
- [OPL syntax](opl-syntax.md) — the supported subset.
- [Editor integration](editor-integration.md) — using the CLI for on-save
  diagnostics.
