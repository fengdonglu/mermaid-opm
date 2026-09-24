# References

English | [中文](references.zh.md)

Sources behind the notation and the OPL dialect that `mermaid-opm` implements.

## Standards

- **ISO 19450** — *Automation systems and integration — Object-Process
  Methodology*. International Organization for Standardization (ISO). The
  international standard that defines OPM and OPL. Catalogue: https://www.iso.org.
- **GB/T 39470-2020** — *Automation systems and integration — Object-Process
  Methodology* (Chinese: 自动化系统与集成 对象过程方法). China's national
  standard for OPM, published through the Standardization Administration of
  China (SAC); it corresponds to ISO 19450. Standards portal:
  https://openstd.samr.gov.cn.

## OPCAT and its manuals

- **OPCAT** — an Object-Process CASE tool for drawing OPDs, developed by the
  Enterprise Systems Modeling Laboratory at Technion — Israel Institute of
  Technology. It is the reference implementation used to validate the notation
  modeled here.
- **OPCAT manuals** — the tool ships with user documentation, including the
  *OPCAT-3 Manual: Getting Started* and the *OPCAT 4.0 User Guide* (Volumes 1
  and 2).

## Local reference material

The repository keeps a local `Backgroud/` directory holding the documents used
while designing the dialect. It is **not committed**: `.gitignore` excludes it,
because it contains large binaries and licensed material, and it is not needed
to build or test the project. It contains:

- the GB/T 39470-2020 standard PDF;
- the OPCAT 4.2 installer and its bundled JRE;
- `Manual/` — additional OPCAT and enterprise-modeling guides (the OPCAT-3
  Getting Started manual, the OPCAT 4.0 User Guide Volumes 1–2, the INSIGHT
  Admin Guide, the OPCAT Server User Guide, the RPGRE User Guide, and a security
  user-settings guide);
- a Chinese book on model-based systems engineering with OPM and SysML.

To consult a cited work, use the official catalogue or standards portal above.
