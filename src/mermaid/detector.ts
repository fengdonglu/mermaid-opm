import type { ExternalDiagramDefinition } from 'mermaid';

type DiagramDetector = ExternalDiagramDefinition['detector'];

export const opmDetector: DiagramDetector = (txt: string) => /^\s*opm(?:\s|$)/.test(txt);
