import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSvg, renderModel } from '../src/index.js';
import type { LinkKind } from '../src/core/model/types.js';

const samplesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo', 'samples');
const files = readdirSync(samplesDir).filter((f) => f.endsWith('.opl'));

const expectedKinds: Record<string, LinkKind> = {
  '01': 'consumption',
  '07': 'aggregation',
  '08': 'exhibition',
  '09': 'generalization',
  '10': 'tagged',
};

describe('demo samples', () => {
  it('has at least 10 sample files', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });
  for (const file of files) {
    it(`${file} renders with no unrecognized/unknown-kind diagnostics`, () => {
      const src = readFileSync(join(samplesDir, file), 'utf8');
      expect(renderSvg(src)).toContain('<svg');
      const model = renderModel(src);
      const codes = model.diagnostics.map((d) => d.code);
      expect(codes).not.toContain('unrecognized-sentence');
      expect(codes).not.toContain('unknown-kind');
      const expected = expectedKinds[file.slice(0, 2)];
      if (expected) {
        expect(
          model.links.some((l) => l.kind === expected),
          `${file} should contain a ${expected} link`,
        ).toBe(true);
      }
    });
  }
});
