import { splitSentences } from './tokenize.js';
import { RESERVED, ESSENCE, AFFILIATION } from './reserved.js';
import { emptyModel, thingId, type OpmModel, type Thing, type Link, type Endpoint, type Position } from '../model/types.js';

export interface ParseOptions { strict?: boolean }

// Sentences containing these keywords are structural/procedural; later parsers handle them, the entity parser does not touch them.
const NON_ENTITY = /\b(consumes|yields|affects|requires|occurs|changes|handles|consists|exhibits|instance)\b/;

function ensureThing(model: OpmModel, rawName: string, position?: Position): Thing {
  const name = thingId(rawName);
  let t = model.things.get(name);
  if (!t) {
    t = { id: name, name, kind: 'unknown', essence: 'informatical', affiliation: 'systemic', states: [] };
    if (position) t.position = position;
    model.things.set(name, t);
  }
  return t;
}

function parseEntitySentence(model: OpmModel, text: string, position: Position): boolean {
  const body = text.replace(/\.$/, '').trim();
  if (NON_ENTITY.test(body)) return false;

  // A can be s1, s2, or s3.
  const canM = /^(.+?)\s+can\s+be\s+(.+)$/i.exec(body);
  if (canM) {
    const thing = ensureThing(model, canM[1], position);
    const stateNames = canM[2].replace(/\s+or\s+/gi, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const sn of stateNames) {
      if (!thing.states.some((s) => s.name === sn)) thing.states.push({ name: sn, position });
    }
    return true;
  }

  const isM = /^(.+?)\s+is\s+(.+)$/i.exec(body);
  if (!isM) return false;
  const name = isM[1].trim();
  const rhs = isM[2].trim();
  const rhsWords = rhs.split(/\s+/);
  const lower = rhsWords.map((w) => w.toLowerCase());

  // A is physical [and environmental]. / A is informatical [and systemic].
  if (lower.every((w) => w === 'and' || ESSENCE.has(w) || AFFILIATION.has(w))) {
    const thing = ensureThing(model, name, position);
    for (const w of lower) {
      if (ESSENCE.has(w)) thing.essence = w as Thing['essence'];
      if (AFFILIATION.has(w)) thing.affiliation = w as Thing['affiliation'];
    }
    return true;
  }

  // A is initial s1. / A is final s1.
  if ((lower[0] === 'initial' || lower[0] === 'final') && rhsWords.length >= 2) {
    const thing = ensureThing(model, name, position);
    const sn = rhsWords.slice(1).join(' ');
    let st = thing.states.find((s) => s.name === sn);
    if (!st) { st = { name: sn, position }; thing.states.push(st); }
    if (lower[0] === 'initial') st.initial = true; else st.final = true;
    return true;
  }

  // A is s1. (single token, non-reserved, not an already-declared thing -> state; otherwise treat as generalization and hand off to later parsers)
  if (rhsWords.length === 1 && !RESERVED.has(lower[0]) && !model.things.has(thingId(rhs))) {
    const thing = ensureThing(model, name, position);
    if (!thing.states.some((s) => s.name === rhs)) thing.states.push({ name: rhs, position });
    return true;
  }

  return false;
}

let linkSeq = 0;
function addLink(model: OpmModel, kind: Link['kind'], src: string, tgt: string, position: Position, tag?: string): void {
  model.links.push({ id: `l${++linkSeq}`, kind, source: { thingId: thingId(src) }, target: { thingId: thingId(tgt) }, tag, position });
}

function parseStructuralSentence(model: OpmModel, text: string, position: Position): boolean {
  const body = text.replace(/\.$/, '').trim();

  let m = /^(.+?)\s+consists\s+of\s+(.+)$/i.exec(body);
  if (m) {
    const whole = ensureThing(model, m[1], position);
    whole.kind = whole.kind === 'unknown' ? 'object' : whole.kind;
    const parts = m[2].replace(/\s+and\s+/gi, ',').split(',').map((s) => s.trim()).filter(Boolean);
    for (const part of parts) { ensureThing(model, part, position).kind = 'object'; addLink(model, 'aggregation', m[1], part, position); }
    return true;
  }

  m = /^(.+?)\s+exhibits\s+(.+)$/i.exec(body);
  if (m) {
    ensureThing(model, m[1], position).kind = 'object';
    ensureThing(model, m[2], position).kind = 'object';
    addLink(model, 'exhibition', m[1], m[2], position);
    return true;
  }

  m = /^(.+?)\s+is\s+an?\s+(.+)$/i.exec(body);
  if (m) {
    if (/^instance\s+of\s+/i.test(m[2])) {
      const cls = m[2].replace(/^instance\s+of\s+/i, '');
      ensureThing(model, m[1], position).kind = 'object';
      ensureThing(model, cls, position).kind = 'object';
      addLink(model, 'classification', m[1], cls, position);
    } else {
      // A is a B -> generalization (object); A is B is handled by the entity parser's "state" branch
      ensureThing(model, m[1], position).kind = 'object';
      ensureThing(model, m[2], position).kind = 'object';
      addLink(model, 'generalization', m[1], m[2], position);
    }
    return true;
  }

  return false;
}

function addLinkEndpoints(model: OpmModel, kind: Link['kind'], src: Endpoint, tgt: Endpoint, position: Position): void {
  model.links.push({ id: `l${++linkSeq}`, kind, source: src, target: tgt, position });
}

function parseProceduralSentence(model: OpmModel, text: string, position: Position): boolean {
  const body = text.replace(/\.$/, '').trim();

  // P changes O from s1 to s2.
  let m = /^(.+?)\s+changes\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+)$/i.exec(body);
  if (m) {
    const process = ensureThing(model, m[1], position); process.kind = 'process';
    const obj = ensureThing(model, m[2], position); obj.kind = 'object';
    const s1 = m[3].trim(), s2 = m[4].trim();
    for (const sn of [s1, s2]) if (!obj.states.some((s) => s.name === sn)) obj.states.push({ name: sn, position });
    addLinkEndpoints(model, 'consumption', { thingId: obj.id, stateName: s1 }, { thingId: process.id }, position);
    addLinkEndpoints(model, 'production', { thingId: process.id }, { thingId: obj.id, stateName: s2 }, position);
    return true;
  }

  // O is consumed/yielded by P.
  m = /^(.+?)\s+is\s+(consumed|yielded)\s+by\s+(.+)$/i.exec(body);
  if (m) {
    const obj = ensureThing(model, m[1], position); obj.kind = 'object';
    const process = ensureThing(model, m[3], position); process.kind = 'process';
    const consumed = m[2].toLowerCase() === 'consumed';
    if (consumed) addLinkEndpoints(model, 'consumption', { thingId: obj.id }, { thingId: process.id }, position);
    else addLinkEndpoints(model, 'production', { thingId: process.id }, { thingId: obj.id }, position);
    return true;
  }

  // P occurs if O exists. / P occurs if O is s.
  m = /^(.+?)\s+occurs\s+if\s+(.+?)\s+(exists|is\s+(.+))$/i.exec(body);
  if (m) {
    const process = ensureThing(model, m[1], position); process.kind = 'process';
    const obj = ensureThing(model, m[2], position); obj.kind = 'object';
    const src: Endpoint = m[3].toLowerCase() === 'exists' ? { thingId: obj.id } : { thingId: obj.id, stateName: m[4].trim() };
    addLinkEndpoints(model, 'condition', src, { thingId: process.id }, position);
    return true;
  }

  // A handles P.
  m = /^(.+?)\s+handles\s+(.+)$/i.exec(body);
  if (m) {
    const agent = ensureThing(model, m[1], position); agent.kind = 'object';
    const process = ensureThing(model, m[2], position); process.kind = 'process';
    addLinkEndpoints(model, 'agent', { thingId: agent.id }, { thingId: process.id }, position);
    return true;
  }

  // P verb O.  (consumes/yields/affects/requires)
  m = /^(.+?)\s+(consumes|yields|affects|requires)\s+(.+)$/i.exec(body);
  if (m) {
    const verb = m[2].toLowerCase();
    const kind = { consumes: 'consumption', yields: 'production', affects: 'effect', requires: 'instrument' }[verb] as Link['kind'];
    const process = ensureThing(model, m[1], position); process.kind = 'process';
    const obj = ensureThing(model, m[3], position); obj.kind = 'object';
    if (verb === 'consumes' || verb === 'requires') addLinkEndpoints(model, kind, { thingId: obj.id }, { thingId: process.id }, position);
    else addLinkEndpoints(model, kind, { thingId: process.id }, { thingId: obj.id }, position);
    return true;
  }

  return false;
}

function parseTaggedSentence(model: OpmModel, text: string, position: Position): boolean {
  const body = text.replace(/\.$/, '').trim();
  const names = [...model.things.keys()].sort((a, b) => b.length - a.length);
  for (const a of names) {
    if (!body.startsWith(a + ' ')) continue;
    const afterA = body.slice(a.length + 1);
    for (const b of names) {
      if (a === b) continue;
      if (afterA.endsWith(' ' + b)) {
        const tag = afterA.slice(0, afterA.length - b.length - 1).trim();
        if (tag && !RESERVED.has(tag.toLowerCase())) {
          addLink(model, 'tagged', a, b, position, tag);
          return true;
        }
      }
    }
  }
  return false;
}

export function parseOpl(source: string, _opts: ParseOptions = {}): OpmModel {
  const model = emptyModel();
  for (const sentence of splitSentences(source)) {
    const t = sentence.text;
    const position: Position = { line: sentence.line, column: sentence.column };
    if (parseEntitySentence(model, t, position)) continue;
    if (parseStructuralSentence(model, t, position)) continue;
    if (parseProceduralSentence(model, t, position)) continue;
    if (parseTaggedSentence(model, t, position)) continue;
    model.diagnostics.push({ severity: 'warning', code: 'unrecognized-sentence', message: `Unrecognized OPL sentence: ${t}`, line: sentence.line, column: sentence.column });
  }
  for (const thing of model.things.values()) {
    if (thing.kind === 'unknown') {
      const position = thing.position ?? { line: 1, column: 1 };
      model.diagnostics.push({ severity: 'warning', code: 'unknown-kind', message: `Cannot infer object/process for "${thing.name}"`, line: position.line, column: position.column });
    }
  }
  return model;
}
