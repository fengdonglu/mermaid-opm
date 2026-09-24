import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('packaging', () => {
  it('builds before publishing', () => {
    const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
    expect(pkg.scripts.prepublishOnly).toBe('npm run build');
  });

  it('ships an MIT LICENSE for fengdonglu and a CI workflow', () => {
    const license = readFileSync(join(here, '..', 'LICENSE'), 'utf8');
    expect(license).toMatch(/MIT License/);
    expect(license).toContain('fengdonglu');
    expect(existsSync(join(here, '..', '.github', 'workflows', 'ci.yml'))).toBe(true);
  });
});
