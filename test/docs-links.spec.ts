import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walkZh(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkZh(p, out);
    else if (name.endsWith('.zh.md')) out.push(p);
  }
  return out;
}

const zhFiles = [join(root, 'README.zh.md'), join(root, 'CONTRIBUTING.zh.md'), ...walkZh(join(root, 'docs'))].filter(
  existsSync
);

describe('Chinese docs links', () => {
  it('relative links resolve, and cross-references prefer the .zh.md copy', () => {
    const problems: string[] = [];
    for (const file of zhFiles) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
        const label = match[1].trim();
        const target = match[2];
        if (/^(https?:)?\/\//.test(target) || target.startsWith('#') || target.startsWith('mailto:')) continue;
        const path = target.split('#')[0];
        if (!path.endsWith('.md')) continue;

        const abs = resolve(dirname(file), path);
        if (!existsSync(abs)) {
          problems.push(`${relative(root, file)} -> missing target ${target}`);
          continue;
        }
        // Language switches and links whose visible text names a file stay on the English original.
        if (label.toLowerCase() === 'english' || label.endsWith('.md')) continue;
        if (!path.endsWith('.zh.md')) {
          const zh = `${abs.slice(0, -3)}.zh.md`;
          if (existsSync(zh)) {
            problems.push(`${relative(root, file)} -> ${target} (should link to its .zh.md copy)`);
          }
        }
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
