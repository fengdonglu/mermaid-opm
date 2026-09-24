import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p: string) => JSON.parse(readFileSync(join(here, '..', p), 'utf8'));

describe('extension contributions', () => {
  it('registers the opm language for .opl', () => {
    const c = readJson('package.json').contributes;
    expect(c.languages[0].id).toBe('opm');
    expect(c.languages[0].extensions).toContain('.opl');
    expect(c.commands.map((x: any) => x.command)).toEqual(['opm.preview', 'opm.exportSvg']);
  });
  it('ships a parseable TextMate grammar', () => {
    const g = readJson('syntaxes/opl.tmLanguage.json');
    expect(g.scopeName).toBe('source.opl');
    expect(Array.isArray(g.patterns)).toBe(true);
    expect(g.patterns.length).toBeGreaterThan(0);
  });
});
