# 构建与测试

[English](build-and-test.md) | 中文

## 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run build` | 类型检查并把包产物输出到 `dist/`。 |
| `npm test` | 运行一次完整的 Vitest 测试套件（`vitest run`）。 |
| `npm run typecheck` | `tsc --noEmit` —— 仅类型检查，不产出文件。 |
| `npm run dev` | 通过 `scripts/serve.mjs` 提供 `demo/` 页面。 |
| `npm run serve` | `npm run dev` 的别名。 |

`npm run build` 执行 `tsc -p tsconfig.build.json && node build.mjs`：

1. `tsc` 把 `src/` 下的每个文件（不含 `*.spec.ts`）编译到 `dist/`，同时为包和
   CLI 产出 JavaScript 与 `.d.ts` 声明。
2. `build.mjs` 使用 esbuild 把 `src/index.ts` 打包成单个浏览器 ESM 文件，
   并把 `mermaid` 保持为外部依赖。

## 构建产物

| 路径 | 内容 |
| --- | --- |
| `dist/index.js` | 包入口（`main`/`module` 以及 `.` 导出）。 |
| `dist/cli/cli.js` | `opm2svg` 可执行文件（`bin`）。 |
| `dist/mermaid-opm.mjs` | 打包后的浏览器构建（`./browser` 导出）。 |

demo 会加载 `dist/mermaid-opm.mjs`，所以请先运行 `npm run build`，再运行
`npm run dev`。

## 测试

测试位于 `test/`，基于 [Vitest](https://vitest.dev) 运行。完整套件：

```bash
npm test
```

单个文件：

```bash
npx vitest run test/docs.spec.ts
```

按名称运行单个测试（`-t` 匹配测试标题）：

```bash
npx vitest run -t "cross links"
```

迭代时可用 `npx vitest`（监听模式）。

## 约定

本项目采用测试驱动：先写会失败的测试，再让它通过（见 `AGENTS.md`）。提交前用
`npm run typecheck` 做类型检查，并遵循 Conventional Commits。
