import { renderModel, type OpmModel } from '../index.js';
import { defaultTheme, type Theme } from '../render/theme.js';

export class OpmDb {
  private model: OpmModel | null = null;
  private theme: Theme = defaultTheme;

  setSource(source: string): void {
    this.model = renderModel(source);
  }

  getModel(): OpmModel | null {
    return this.model;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  getTheme(): Theme {
    return this.theme;
  }

  clear(): void {
    this.model = null;
    this.theme = defaultTheme;
  }
}
