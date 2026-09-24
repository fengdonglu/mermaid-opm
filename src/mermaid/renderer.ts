import type { ExternalDiagramDefinition } from 'mermaid';
import { renderModel, type OpmModel } from '../index.js';
import { layout } from '../layout/index.js';
import { sceneToSvg } from '../render/sceneToSvg.js';
import { defaultTheme, type Theme } from '../render/theme.js';

type DiagramDefinition = Awaited<ReturnType<ExternalDiagramDefinition['loader']>>['diagram'];
type DiagramObject = Parameters<DiagramDefinition['renderer']['draw']>[3];

export const opmRenderer = {
  draw: (text: string, id: string, _version: string, diagramObject: DiagramObject) => {
    const db = diagramObject.db as unknown as { getModel(): OpmModel | null; getTheme?(): Theme };
    const model = db.getModel() ?? renderModel(text);
    const theme = db.getTheme?.() ?? defaultTheme;
    const svg = sceneToSvg(layout(model), theme);
    const target = document.getElementById(id);
    if (!target) return;
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    target.setAttribute('viewBox', svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100');
    target.setAttribute('width', svg.match(/width="([^"]+)"/)?.[1] ?? '100');
    target.setAttribute('height', svg.match(/height="([^"]+)"/)?.[1] ?? '100');
    target.innerHTML = inner;
  },
};
