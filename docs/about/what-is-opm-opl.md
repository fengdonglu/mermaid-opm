# What is OPM/OPL?

English | [中文](what-is-opm-opl.zh.md)

**Object-Process Methodology (OPM)** is a systems-modeling paradigm standardized
as ISO 19450 (see [References](references.md)). It describes a system with just
two kinds of building blocks:

- **Objects** — things that exist, possibly in one of several states; and
- **Processes** — things that transform objects by creating, consuming, or
  changing them.

That tiny vocabulary is enough for systems in many domains, because any system
can be seen as a set of objects being transformed by processes. Complexity is
managed by **refinement**: the same thing can be described again at a deeper
level of detail.

## Bimodal: one model, two views

OPM is **bimodal** — every model is expressed at the same time as

- an **Object-Process Diagram (OPD)**, the graphical view; and
- a paragraph of **Object-Process Language (OPL)**, the textual view.

These are not two separate artifacts. They are two projections of a single
model, and they stay consistent: every box, link, state, and label in an OPD has
a direct counterpart in OPL.

`mermaid-opm` takes the textual side as input. It parses OPL, lays the model
out, and draws the equivalent OPD:

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
Handled Order is physical.
```

Here `Handling` (a process) consumes the object `Order` and produces the object
`Handled Order`: a transformation chain.

## What this project implements

`mermaid-opm` implements a small, English-like subset of OPL. It renders a
single, flat OPD per model; refinement (in-zoom, unfold, and multiple OPDs) is
[not supported](../development/roadmap.md).

- [OPL syntax](../usage/opl-syntax.md) — every sentence the parser accepts.
- [Getting started](../usage/getting-started.md) — install and first render.
- [References](references.md) — the standards and tools behind the notation.
