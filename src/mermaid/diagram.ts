import type { ExternalDiagramDefinition } from 'mermaid';
import { opmRenderer } from './renderer.js';
import getStyles from './styles.js';
import { OpmDb } from './db.js';
import { themeFromMermaid } from '../render/theme.js';

const db = new OpmDb();

type DiagramDefinition = Awaited<ReturnType<ExternalDiagramDefinition['loader']>>['diagram'];

export const diagram: DiagramDefinition = {
  parser: {
    parse: (text: string) => {
      db.setSource(text);
    },
  },
  db,
  init: (config) => {
    db.setTheme(themeFromMermaid(config.themeVariables));
  },
  renderer: opmRenderer,
  styles: getStyles,
};
