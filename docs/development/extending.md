# Extending

English | [中文](extending.zh.md)

This page walks through the three most common extensions. Read `AGENTS.md`
first; it states the conventions every change must follow: English comments, ESM
`.js` import suffixes, a DOM-free render core, colors taken only from `Theme`,
and a parser that never throws.

## Add a new link kind

A link kind flows through the whole pipeline. Say you are adding a procedural
link `P triggers O.`:

1. **Parser** — `src/core/opl/parse.ts`. Add the sentence pattern to the right
   parser function (`parseProceduralSentence` for procedural links,
   `parseStructuralSentence` for structural ones) and emit the link with
   `addLink`/`addLinkEndpoints`. If the sentence introduces a reserved keyword,
   add that word to `RESERVED` in `src/core/opl/reserved.ts` and, if it must not
   be mistaken for an entity sentence, to the `NON_ENTITY` regular expression.
2. **Model** — `src/core/model/types.ts`. Add the new name to the `LinkKind`
   union.
3. **Layout** — `src/layout/dagreAdapter.ts`. Links are laid out generically, so
   unless the new kind needs special edges the existing loop already covers it;
   otherwise adjust direction or grouping there.
4. **Notation** — `src/render/notation.ts`. Map the kind to start/end markers in
   `markers()`, adding any new marker to `src/render/markers.ts`. Structural
   links with triangle markers are handled by `sceneToSvg`'s `structuralMarker`,
   so also update `STRUCTURAL`/`MARKER_AT_TARGET` in `src/render/sceneToSvg.ts`
   when applicable.
5. **Tests** — add parser and render specs under `test/`, plus a demo sample if
   the gallery should show it.

## Add a theme token

1. **Theme** — `src/render/theme.ts`. Add a field to the `Theme` interface, give
   it a value in `defaultTheme`, and (if Mermaid exposes a matching variable) map
   it in `themeFromMermaid`.
2. **Use it** — read the token from the `Theme` argument in `shapes.ts`,
   `notation.ts`, or `sceneToSvg.ts`. Never hard-code a color: `Theme` is the
   single source of palette truth.

## Add a demo sample

1. Add `demo/samples/NN-name.opl` with your OPL.
2. Add an entry to the `demo/examples.mjs` array:
   `{ id, title, sample, explanation }`.
3. The sample tests scan `demo/samples` and assert every sample renders with no
   `unrecognized-sentence`/`unknown-kind` diagnostics; run `npm test`.

## Where to look

- Parsing and diagnostics — `src/core/opl/`.
- Model and validation — `src/core/model/`.
- Layout — `src/layout/`.
- SVG generation — `src/render/`.
- Mermaid wiring — `src/mermaid/`.

See [Architecture](architecture.md) for how these fit together and
[Build and test](build-and-test.md) for the commands.
