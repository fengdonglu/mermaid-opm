# OPL syntax

English | [中文](opl-syntax.zh.md)

This page enumerates exactly the OPL subset that `mermaid-opm` v1 understands.
Every sentence ends with a period (`.`); newlines are ordinary whitespace and
`;` is not a separator. `//` starts a comment that runs to the end of the line.
A leading `opm` line is **optional**: it is stripped if present, and it is only
required as the Mermaid diagram trigger (the first token of a fenced `mermaid`
block). Sentences are case-insensitive. Anything not listed here is [not supported](#not-supported-v1).

There is no `object` or `process` keyword: the kind of a thing is inferred from
the sentence it appears in. A thing that is consumed, yielded, affected,
required, or exhibited is an **object**; a thing that consumes, yields, affects,
handles, changes, or occurs is a **process**.

## Objects and processes

A bare `X is physical.` only sets the essence; object/process is decided by the
link the thing participates in.

```opm
Order is physical.
Handling is physical.
Handling consumes Order.
Handling yields Handled Order.
```

## Essence and affiliation

- `X is physical.` / `X is informatical.` — **essence**.
- `X is systemic.` / `X is environmental.` — **affiliation**.
- Combine with `and`: `X is physical and environmental.`

```opm
Customer is physical and environmental.
Order is informatical and systemic.
Processing is informatical.
Processing consumes Order.
Processing affects Customer.
```

## States

- `X can be s1, s2, or s3.` (or `X can be s1 or s2.`) lists the states.
- `X is initial s1.` marks `s1` as the initial state.
- `X is final s1.` marks `s1` as the final state.

Initial and final states must be **named**.

```opm
Order is physical.
Order can be new, open, or closed.
Order is initial new.
Order is final closed.
Handling is physical.
Handling consumes Order.
Handling affects Order.
```

## Structural links

### Aggregation-participation

`Whole consists of A, B, and C.` — the whole is an object, and each part is an
object.

```opm
OnStar System is physical.
OnStar System consists of Console, VCIM, Cellular Network, and GPS.
```

### Exhibition-characterization

`A exhibits B.` — a feature (a property or operation) of an object.

```opm
Order is physical.
Order exhibits Price.
Order exhibits Priority.
```

### Generalization

`Special is a General.` — the special object specializes the general one. The
article `a`/`an` is **required** (see [ambiguity rules](#ambiguity-rules)).

```opm
Document is informatical.
Order is informatical.
Order is a Document.
```

### Classification

`Instance is an instance of Class.`

```opm
Order is informatical.
Special Order is informatical.
Special Order is an instance of Order.
```

### Tagged (user-defined) links

`A <tag> B.` where `<tag>` is any phrase that is not a reserved word and both
`A` and `B` have already been introduced.

```opm
Driver is physical and environmental.
OnStar Console is physical.
Handling is physical.
Driver handles Handling.
Handling requires OnStar Console.
Driver communicates via OnStar Console.
```

## Procedural links

### Consumption and production

`P consumes O.` and `P yields O.` are the transformation pair. The passive
forms `O is consumed by P.` and `O is yielded by P.` are also accepted.

```opm
Order is physical.
Handling is physical.
Order is consumed by Handling.
Handling yields Handled Order.
```

### Effect

`P affects O.` — the process changes the object without consuming or producing
it.

```opm
Customer is physical and environmental.
Processing is informatical.
Processing affects Customer.
```

### Input-output pair (state change)

`P changes O from s1 to s2.` expands into a consumption of `s1` and a production
of `s2`.

```opm
Order is physical.
Order can be new or closed.
Handling is physical.
Handling changes Order from new to closed.
```

### Agent

`A handles P.` — the agent (a human object) enables the process.

```opm
Clerk is physical and environmental.
Order is physical.
Handling is physical.
Handling consumes Order.
Clerk handles Handling.
```

### Instrument

`P requires I.` — the instrument (an object) enables the process.

```opm
System is physical.
Order is physical.
Handling is physical.
Handling consumes Order.
Handling requires System.
```

### Condition

`P occurs if O exists.` or `P occurs if O is s.` — the process runs only when the
condition holds.

```opm
Order is physical.
Order can be paid or unpaid.
Handling is physical.
Handling consumes Order.
Handling occurs if Order is paid.
```

## Ambiguity rules

- A bare `A is initial.` / `A is final.` is **not** supported: initial and final
  states must be named, e.g. `A is initial s1.`
- `A is B.` with a single, non-reserved `B` that is not an already-declared thing
  is parsed as a **state** on `A`, not as generalization. Use the article form
  `A is a B.` for generalization.
- Because of the previous rule, article-less **process** generalization such as
  `Special is General.` is not supported; use `Special is a General.`

## Not supported (v1)

- Multiple OPDs, in-zoom, and unfold.
- `event`, `result`, and `invocation` links.
- State-qualified consumption and production (`P consumes O in s.`).
- Graphical editing and layout persistence.
- `--theme` and `--strict` CLI options (planned).

Unknown sentences are reported as the `unrecognized-sentence` diagnostic, and
things whose kind cannot be inferred as `unknown-kind`. The parser never throws;
it returns diagnostics with line and column information. Run the [`opm2svg`
CLI](cli.md) or call `renderModel()` to see them.
