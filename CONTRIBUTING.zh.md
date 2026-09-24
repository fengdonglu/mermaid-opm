# 为 mermaid-opm 贡献代码

[English](CONTRIBUTING.md) | 中文

感谢你有兴趣改进 `mermaid-opm`。本项目把 ISO 19450 OPM/OPL 渲染为对象-过程图
（OPD），既作为 Mermaid 外部图表插件，也提供 `opm2svg` 命令行工具。

请先阅读 [`AGENTS.md`](AGENTS.md)：它是本仓库布局、编码约定以及人与智能体如何协作
的权威指南。

## 开发环境

要求：Node.js 20 或更高版本。

```bash
npm ci        # 安装锁定版本的依赖
npm run dev   # 在本地提供 demo/index.html
```

用 `npm run build` 构建可分发的产物；演示页加载 `dist/mermaid-opm.mjs`，所以打开
`demo/index.html` 之前请先构建。

## 测试先行（TDD）

本项目采用测试先行的开发方式。先写一个描述期望行为的失败测试，确认它因为预期的原因
失败，再写最少的代码让它通过。没有失败测试，就不要新增生产代码。

```bash
npm test          # 完整的 vitest 测试套件
npm run typecheck # tsc --noEmit
npm run build     # 类型检查 + 打包
```

提交拉取请求前请把这三条都跑一遍。解析器不得抛出异常：问题应通过携带行列信息的
diagnostics 上报。

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 缺陷修复
- `docs:` 仅文档
- `test:` 仅测试
- `refactor:` 既不修复缺陷也不新增功能的代码改动
- `chore:` 构建或工具链改动

每次提交保持聚焦，主题使用祈使语气。

## 文档

英文为权威版本。中文翻译以 `*.zh.md` 形式与英文文件并列存放。所有代码注释与文档都用
英文书写；只有 `*.zh.md` 文件可以包含中文。若两者冲突，以英文为准。

## 拉取请求检查清单

- [ ] 改动有测试覆盖，且新测试在修复前是失败的。
- [ ] 本地 `npm run typecheck`、`npm test`、`npm run build` 全部通过。
- [ ] 注释与文档使用英文，相关处提供 `*.zh.md` 副本。
- [ ] 提交信息遵循 Conventional Commits。
- [ ] 面向用户的改动已同步反映到 `README.md` 与 `docs/` 目录。
