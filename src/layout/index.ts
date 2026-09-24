import type { OpmModel } from '../core/model/types.js';
import { dagreLayout } from './dagreAdapter.js';
import type { Scene } from './types.js';

export type { Scene, SceneEdge, SceneNode, LayoutEngine } from './types.js';

export function layout(model: OpmModel): Scene {
  return dagreLayout(model);
}
