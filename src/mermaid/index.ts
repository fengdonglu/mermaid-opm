import type { ExternalDiagramDefinition } from 'mermaid';
import { opmDetector } from './detector.js';

type DiagramLoader = ExternalDiagramDefinition['loader'];

const id = 'opm';

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id, diagram };
};

export const opm: ExternalDiagramDefinition = { id, detector: opmDetector, loader };

export async function registerOpm(): Promise<void> {
  const mermaid = (await import('mermaid')).default;
  await mermaid.registerExternalDiagrams([opm], { lazyLoad: false });
}
