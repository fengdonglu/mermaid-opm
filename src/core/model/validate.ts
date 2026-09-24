import { RESERVED } from '../opl/reserved.js';
import type { OpmModel } from './types.js';

export function validate(model: OpmModel): void {
  for (const thing of model.things.values()) {
    if (RESERVED.has(thing.name.toLowerCase())) {
      const position = thing.position ?? { line: 1, column: 1 };
      model.diagnostics.push({ severity: 'error', code: 'reserved-name', message: `"${thing.name}" is a reserved word`, line: position.line, column: position.column });
    }
  }
  for (const link of model.links) {
    for (const ep of [link.source, link.target]) {
      if (!model.things.has(ep.thingId)) {
        const position = link.position ?? { line: 1, column: 1 };
        model.diagnostics.push({ severity: 'warning', code: 'unknown-reference', message: `Unknown reference "${ep.thingId}"`, line: position.line, column: position.column });
      }
    }
  }
  for (const thing of model.things.values()) {
    if (thing.kind !== 'process') continue;
    const hasIO = model.links.some(
      (l) => (l.kind === 'consumption' && l.target.thingId === thing.id) ||
             (l.kind === 'production' && l.source.thingId === thing.id)
    );
    if (!hasIO) {
      const position = thing.position ?? { line: 1, column: 1 };
      model.diagnostics.push({ severity: 'warning', code: 'process-no-io', message: `Process "${thing.name}" has no input or output`, line: position.line, column: position.column });
    }
  }
}
