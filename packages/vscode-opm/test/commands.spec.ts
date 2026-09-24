import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('extension entry', () => {
  it('registers commands and launches the language client, and bundles a server', () => {
    const src = readFileSync(join(here, '..', 'src', 'extension.ts'), 'utf8');
    expect(src).toContain('opm.preview');
    expect(src).toContain('opm.exportSvg');
    expect(src).toContain('LanguageClient');
    expect(src).toContain('server.js');
    expect(readFileSync(join(here, '..', 'package.json'), 'utf8')).toContain('dist/extension.js');
  });
});
