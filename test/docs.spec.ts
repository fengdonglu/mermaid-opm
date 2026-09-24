import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSvg, renderModel } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));

function mdFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) mdFiles(p, out);
    else if (name.endsWith('.md') && !name.endsWith('.zh.md')) out.push(p);
  }
  return out;
}

const USAGE = ['getting-started', 'opl-syntax', 'cli', 'mermaid-plugin', 'editor-integration', 'vscode'];
const ZH = '\u4e2d\u6587';

describe('docs examples', () => {
  it('every ```opm block in the English docs renders with no diagnostics', () => {
    const files = [join(here, '..', 'README.md'), join(here, '..', 'docs', 'index.md')].filter(existsSync);
    for (const sub of ['usage', 'development', 'about']) {
      files.push(...mdFiles(join(here, '..', 'docs', sub)));
    }
    let blocks = 0;
    for (const file of files) {
      const md = readFileSync(file, 'utf8');
      for (const m of md.matchAll(/```opm\r?\n([\s\S]*?)```/g)) {
        blocks++;
        const body = m[1];
        expect(renderSvg(body), file).toContain('<svg');
        const codes = renderModel(body).diagnostics.map((d) => d.code);
        expect(codes, file).not.toContain('unrecognized-sentence');
        expect(codes, file).not.toContain('unknown-kind');
      }
    }
    expect(blocks).toBeGreaterThan(0);
  });

  it('usage docs exist in English and Chinese with cross links', () => {
    for (const name of USAGE) {
      const en = join(here, '..', 'docs', 'usage', `${name}.md`);
      const zh = join(here, '..', 'docs', 'usage', `${name}.zh.md`);
      expect(existsSync(en), en).toBe(true);
      expect(existsSync(zh), zh).toBe(true);
      expect(readFileSync(en, 'utf8'), en).toContain(`English | [${ZH}](${name}.zh.md)`);
      expect(readFileSync(zh, 'utf8'), zh).toContain(`[English](${name}.md) | ${ZH}`);
    }
  });

  it('README and README.zh.md exist and link to each other', () => {
    const en = readFileSync(join(here, '..', 'README.md'), 'utf8');
    const zh = readFileSync(join(here, '..', 'README.zh.md'), 'utf8');
    expect(en).toContain('README.zh.md');
    expect(zh).toContain('README.md');
  });
});
