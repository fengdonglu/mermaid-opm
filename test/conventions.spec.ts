import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CJK = /[\p{Script=Han}\u3000-\u303f\uff00-\uffef]/u;
const CODE_EXT = new Set(['.ts', '.mjs', '.js', '.html', '.css', '.opl']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.superpowers', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (CODE_EXT.has(extname(p))) out.push(p);
  }
  return out;
}

describe('conventions', () => {
  it('code files contain no CJK characters (English only)', () => {
    const offenders: string[] = [];
    for (const d of ['src', 'test', 'scripts', 'demo', 'packages']) {
      for (const f of walk(join(root, d))) {
        if (CJK.test(readFileSync(f, 'utf8'))) offenders.push(f);
      }
    }
    expect(offenders, `CJK found in: ${offenders.join(', ')}`).toEqual([]);
  });
  it('AGENTS.md exists and states the English-only + Vibe Coding rules', () => {
    const md = readFileSync(join(root, 'AGENTS.md'), 'utf8');
    expect(md.toLowerCase()).toContain('english');
    expect(md.toLowerCase()).toContain('vibe coding');
  });
});
