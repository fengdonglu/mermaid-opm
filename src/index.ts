import { parseOpl, type ParseOptions } from './core/opl/parse.js';
import { validate } from './core/model/validate.js';
import { layout } from './layout/index.js';
import { sceneToSvg } from './render/sceneToSvg.js';
import type { Theme } from './render/theme.js';
import type { OpmModel } from './core/model/types.js';

export const VERSION = '0.1.0';
export { parseOpl } from './core/opl/parse.js';
export { opm, registerOpm } from './mermaid/index.js';
export type { ParseOptions } from './core/opl/parse.js';
export type { Diagnostic, Severity } from './core/opl/diagnostics.js';
export type { OpmModel, Position } from './core/model/types.js';
export type { Scene } from './layout/types.js';
export type { Theme } from './render/theme.js';

export function renderModel(source: string, opts: ParseOptions = {}): OpmModel {
  const model = parseOpl(source, opts);
  validate(model);
  return model;
}

export function renderSvg(source: string, opts: { theme?: Theme; strict?: boolean } = {}): string {
  const model = renderModel(source, { strict: opts.strict });
  return sceneToSvg(layout(model), opts.theme);
}
