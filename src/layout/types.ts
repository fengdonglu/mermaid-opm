import type { LinkKind, OpmModel } from '../core/model/types.js';

export interface SceneNode {
  id: string; thingId: string; kind: 'object' | 'process';
  label: string; states: string[];
  x: number; y: number; width: number; height: number;
}
export interface SceneEdge {
  id: string; kind: LinkKind; source: string; target: string;
  points: { x: number; y: number }[];
  sourceState?: string; targetState?: string;
  tag?: string;
}
export interface Scene { nodes: SceneNode[]; edges: SceneEdge[]; width: number; height: number }
export interface LayoutEngine { layout(model: OpmModel): Scene }
