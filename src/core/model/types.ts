import type { Diagnostic } from '../opl/diagnostics.js';

export type ThingKind = 'object' | 'process' | 'unknown';
export type Essence = 'physical' | 'informatical';
export type Affiliation = 'systemic' | 'environmental';

export interface Position { line: number; column: number }

export interface State { name: string; initial?: boolean; final?: boolean; position?: Position }

export interface Thing {
  id: string; name: string; kind: ThingKind;
  essence: Essence; affiliation: Affiliation; states: State[];
  position?: Position;
}

export type LinkKind =
  | 'aggregation' | 'exhibition' | 'generalization' | 'classification' | 'tagged'
  | 'consumption' | 'production' | 'effect' | 'input-output'
  | 'agent' | 'instrument' | 'condition';

export interface Endpoint { thingId: string; stateName?: string }

export interface Link {
  id: string; kind: LinkKind; source: Endpoint; target: Endpoint; tag?: string;
  position?: Position;
}

export interface OpmModel {
  things: Map<string, Thing>;
  links: Link[];
  diagnostics: Diagnostic[];
}

export function thingId(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function emptyModel(): OpmModel {
  return { things: new Map(), links: [], diagnostics: [] };
}
