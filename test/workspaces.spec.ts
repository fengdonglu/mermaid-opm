import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

describe('workspaces', () => {
  it('root declares packages/* workspaces', () => {
    expect(read('package.json').workspaces).toContain('packages/*');
  });
  it('defines the lsp and vscode packages', () => {
    expect(read('packages/lsp/package.json').name).toBe('mermaid-opm-lsp');
    expect(read('packages/vscode-opm/package.json').name).toBe('mermaid-opm-vscode');
  });
});
