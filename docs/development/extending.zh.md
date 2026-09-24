# 扩展

[English](extending.md) | 中文

本页介绍三种最常见的扩展方式。请先阅读 `AGENTS.md`；它规定了每次改动都必须遵
循的约定：注释用英文、ESM 相对导入带 `.js` 后缀、渲染核心与 DOM 无关、只从
`Theme` 取色、解析器从不抛异常。

## 添加一种连线类型

一种连线类型会流经整条流水线。假设你要添加过程连线 `P triggers O.`：

1. **解析器** —— `src/core/opl/parse.ts`。把句子模式加入对应的解析函数（过程连
   线用 `parseProceduralSentence`，结构连线用 `parseStructuralSentence`），并用
   `addLink`/`addLinkEndpoints` 产出连线。若该句子引入了保留关键字，把该词加入
   `src/core/opl/reserved.ts` 的 `RESERVED`；若不能被当作实体句，还要加入
   `NON_ENTITY` 正则。
2. **模型** —— `src/core/model/types.ts`。把新名称加入 `LinkKind` 联合类型。
3. **布局** —— `src/layout/dagreAdapter.ts`。连线是通用布局的，除非新类型需要特
   殊边，现有循环已经覆盖；否则在此调整方向或分组。
4. **记号** —— `src/render/notation.ts`。在 `markers()` 中把该类型映射到起止标记，
   并把任何新标记加入 `src/render/markers.ts`。带三角标记的结构连线由
   `sceneToSvg` 的 `structuralMarker` 处理，因此适用时还要更新
   `src/render/sceneToSvg.ts` 中的 `STRUCTURAL`/`MARKER_AT_TARGET`。
5. **测试** —— 在 `test/` 下添加解析与渲染用例；若画廊需要展示，再添加一个
   demo 样例。

## 添加一个主题变量

1. **主题** —— `src/render/theme.ts`。在 `Theme` 接口中新增字段，在
   `defaultTheme` 中给出取值，并在 `themeFromMermaid` 中映射它（若 Mermaid 暴露
   了对应变量）。
2. **使用** —— 在 `shapes.ts`、`notation.ts` 或 `sceneToSvg.ts` 中从 `Theme` 参数
   读取该变量。切勿硬编码颜色：`Theme` 是调色板的唯一来源。

## 添加一个 demo 样例

1. 用你的 OPL 新建 `demo/samples/NN-name.opl`。
2. 在 `demo/examples.mjs` 数组中添加条目：
   `{ id, title, sample, explanation }`。
3. 样例测试会扫描 `demo/samples`，断言每个样例都能渲染且不含
   `unrecognized-sentence`/`unknown-kind` 诊断；运行 `npm test`。

## 到哪里找

- 解析与诊断 —— `src/core/opl/`。
- 模型与校验 —— `src/core/model/`。
- 布局 —— `src/layout/`。
- SVG 生成 —— `src/render/`。
- Mermaid 接线 —— `src/mermaid/`。

各部分的协作方式见[架构](architecture.zh.md)，命令见[构建与测试](build-and-test.zh.md)。
