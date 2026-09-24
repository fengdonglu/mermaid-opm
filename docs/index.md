# mermaid-opm documentation

English | [中文](index.zh.md)

`mermaid-opm` renders ISO 19450 OPM/OPL into Object-Process Diagrams (OPD) as a
Mermaid external diagram plugin, plus an `opm2svg` CLI. This page is the entry
point to the documentation; the [README](../README.md) has the project overview
and a 30-second quick start.

## Usage

How to install, write OPL, and render diagrams.

- [Getting started](usage/getting-started.md) — install, first plugin render,
  first CLI run.
- [OPL syntax](usage/opl-syntax.md) — the supported v1 subset, sentence by
  sentence.
- [CLI: opm2svg](usage/cli.md) — options, exit codes, and diagnostics.
- [Mermaid plugin](usage/mermaid-plugin.md) — host requirements and limitations.
- [Editor integration](usage/editor-integration.md) — the LSP, and CLI/library
  alternatives.
- [VS Code extension](usage/vscode.md) — install, features, and commands.

## Development

For people building on or extending `mermaid-opm`.

- [Architecture](development/architecture.md) — layers and data flow.
- [Build and test](development/build-and-test.md) — commands and build outputs.
- [Integration](development/integration.md) — bundlers, Node/SSR, and the CDN.
- [Extending](development/extending.md) — add a link kind, theme token, or
  sample.
- [Roadmap](development/roadmap.md) — planned work after v1.

## About

Background, standards, and common questions.

- [What is OPM/OPL?](about/what-is-opm-opl.md) — OPM, OPL, OPD, and ISO 19450.
- [References](about/references.md) — standards, OPCAT, and local reference
  material.
- [FAQ](about/faq.md) — design questions and rendering on GitHub.

## Project

- [README](../README.md) — overview and quick start.
- [AGENTS.md](../AGENTS.md) — conventions for contributors and AI agents.
