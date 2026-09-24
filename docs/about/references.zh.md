# 参考资料

[English](references.md) | 中文

`mermaid-opm` 所用记号与 OPL 方言背后的来源。

## 标准

- **ISO 19450** —— *Automation systems and integration — Object-Process
  Methodology*，国际标准化组织（ISO）。定义 OPM 与 OPL 的国际标准。目录：https://www.iso.org。
- **GB/T 39470-2020** —— *Automation systems and integration — Object-Process
  Methodology*（中文：自动化系统与集成 对象过程方法）。中国的 OPM 国家标准，由国家标准化管理委员会（SAC）发布，对应 ISO 19450。标准门户：https://openstd.samr.gov.cn。

## OPCAT 及其手册

- **OPCAT** —— 一款用于绘制 OPD 的对象-过程 CASE 工具，由以色列理工学院（Technion）企业系统建模实验室开发。它是验证本项目所建模记号的参考实现。
- **OPCAT 手册** —— 该工具附带用户文档，包括 *OPCAT-3 Manual: Getting Started* 与 *OPCAT 4.0 User Guide*（第 1、2 卷）。

## 本地参考资料

仓库在本地保留了一个 `Backgroud/` 目录，存放设计本方言时所用的文档。它**未纳入版本控制**：`.gitignore` 将其排除，因为其中包含大体积二进制文件与授权资料，且构建或测试本项目并不需要它。其中包含：

- GB/T 39470-2020 标准 PDF；
- OPCAT 4.2 安装程序及其捆绑的 JRE；
- `Manual/` —— 其他 OPCAT 与企业建模指南（OPCAT-3 Getting Started 手册、OPCAT 4.0 User Guide 第 1、2 卷、INSIGHT Admin Guide、OPCAT Server User Guide、RPGRE User Guide，以及一份安全用户设置指南）；
- 一本关于 OPM 与 SysML 的基于模型的系统工程中文书籍。

如需查阅某条引用，请使用上方的官方目录或标准门户。
