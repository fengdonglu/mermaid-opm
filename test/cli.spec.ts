import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from '../src/cli/cli.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('cli', () => {
  it('converts opl to svg and json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    const inFile = join(dir, 'm.opl');
    const svgFile = join(dir, 'm.svg');
    const jsonFile = join(dir, 'm.json');
    writeFileSync(inFile, 'opm\nHandling consumes Order.\nHandling yields Receipt.', 'utf8');
    const code = await runCli([inFile, '-o', svgFile, '--json', jsonFile]);
    expect(code).toBe(0);
    expect(readFileSync(svgFile, 'utf8')).toContain('<svg');
    expect(JSON.parse(readFileSync(jsonFile, 'utf8')).links.length).toBe(2);
  });

  it('returns 1 for a valueless -o', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    const inFile = join(dir, 'm.opl');
    writeFileSync(inFile, 'opm\nHandling consumes Order.', 'utf8');
    await expect(runCli([inFile, '-o'])).resolves.toBe(1);
  });

  it('returns 1 for a valueless --json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    const inFile = join(dir, 'm.opl');
    writeFileSync(inFile, 'opm\nHandling consumes Order.', 'utf8');
    await expect(runCli([inFile, '--json'])).resolves.toBe(1);
  });

  it('returns 1 for a nonexistent input path', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    await expect(runCli([join(dir, 'missing.opl')])).resolves.toBe(1);
  });

  it('returns 1 for an unknown flag', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'opm-'));
    const inFile = join(dir, 'm.opl');
    writeFileSync(inFile, 'opm\nHandling consumes Order.', 'utf8');
    await expect(runCli([inFile, '--theme', 'dark'])).resolves.toBe(1);
    await expect(runCli([inFile, '--bogus'])).resolves.toBe(1);
  });

  it('declares a bin path produced by tsc', () => {
    const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
    expect(pkg.bin.opm2svg.endsWith('dist/cli/cli.js')).toBe(true);
  });

  it('starts with a node shebang', () => {
    const src = readFileSync(join(here, '..', 'src', 'cli', 'cli.ts'), 'utf8');
    expect(src.startsWith('#!/usr/bin/env node')).toBe(true);
  });
});
