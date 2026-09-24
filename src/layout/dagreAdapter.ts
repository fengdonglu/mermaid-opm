import dagre from '@dagrejs/dagre';
import type { OpmModel } from '../core/model/types.js';
import type { Scene, SceneEdge, SceneNode } from './types.js';

const NODE_W = 140;
const ROW_H = 22;
const PAD = 20;

export function dagreLayout(model: OpmModel): Scene {
  // multigraph: one pair of nodes may have multiple links (e.g. requires and affects are both Process->Object)
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80, marginx: PAD, marginy: PAD });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: SceneNode[] = [];
  for (const thing of model.things.values()) {
    if (thing.kind === 'unknown') continue;
    const stateRows = thing.kind === 'object' ? Math.max(thing.states.length, 1) : 1;
    const height = Math.max(40, stateRows * ROW_H + 18);
    const node: SceneNode = {
      id: thing.id, thingId: thing.id, kind: thing.kind,
      label: thing.name, states: thing.states.map((s) => s.name),
      x: 0, y: 0, width: NODE_W, height,
    };
    nodes.push(node);
    g.setNode(thing.id, { width: node.width, height: node.height });
  }

  const edges: SceneEdge[] = [];
  for (const link of model.links) {
    if (!g.hasNode(link.source.thingId) || !g.hasNode(link.target.thingId)) continue;
    const e: SceneEdge = {
      id: link.id, kind: link.kind,
      source: link.source.thingId, target: link.target.thingId,
      points: [], sourceState: link.source.stateName, targetState: link.target.stateName,
      tag: link.tag,
    };
    edges.push(e);
    g.setEdge(link.source.thingId, link.target.thingId, { id: link.id }, link.id);
  }

  dagre.layout(g);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const id of g.nodes()) {
    const n = byId.get(id); const gn = g.node(id);
    if (!n || !gn) continue;
    n.x = gn.x - gn.width / 2;
    n.y = gn.y - gn.height / 2;
    n.width = gn.width; n.height = gn.height;
  }
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  for (const ge of g.edges()) {
    const e = edgeById.get(g.edge(ge).id);
    if (e) e.points = g.edge(ge).points ?? [];
  }
  const graph = g.graph();
  const w = Number.isFinite(graph.width) ? (graph.width as number) : 0;
  const h = Number.isFinite(graph.height) ? (graph.height as number) : 0;
  return { nodes, edges, width: w + PAD * 2, height: h + PAD * 2 };
}
