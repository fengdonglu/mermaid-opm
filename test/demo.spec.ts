import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('demo page', () => {
  it('resolves the bare mermaid specifier with an import map before the module script', () => {
    const html = readFileSync(join(here, '..', 'demo', 'index.html'), 'utf8');
    const mapIdx = html.indexOf('type="importmap"');
    const modIdx = html.indexOf('type="module"');
    expect(mapIdx).toBeGreaterThan(-1);
    expect(mapIdx).toBeLessThan(modIdx);
    expect(html).toContain('"mermaid"');
    expect(html).toContain('mermaid.esm.min.mjs');
  });

  it('playground page exists and uses the library API', () => {
    const html = readFileSync(join(here, '..', 'demo', 'playground.html'), 'utf8');
    expect(html).toContain('renderSvg');
    expect(html).toContain('renderModel');
    expect(html).toContain('examples.mjs');
    expect(html).toContain('Diagnostics');
  });

  it('demo page wires the plugin and lists 10 examples with existing samples', async () => {
    const root = join(here, '..');
    const html = readFileSync(join(root, 'demo', 'index.html'), 'utf8');
    expect(html).toContain('importmap');
    expect(html).toContain('registerOpm');
    const mod = await import('../demo/examples.mjs');
    const examples = mod.default as Array<{ id: string; title: string; sample: string; explanation: string }>;
    expect(examples.length).toBe(10);
    for (const ex of examples) {
      expect(ex.title.length).toBeGreaterThan(0);
      expect(ex.explanation.length).toBeGreaterThan(0);
      expect(existsSync(join(root, 'demo', 'samples', ex.sample))).toBe(true);
    }
  });
});
