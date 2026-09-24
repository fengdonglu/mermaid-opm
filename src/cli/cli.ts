#!/usr/bin/env node
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { renderSvg, renderModel } from '../index.js';

const USAGE = 'usage: opm2svg <input.opl> [-o out.svg] [--json out.json]\n';

export async function runCli(argv: string[]): Promise<number> {
  const [input, ...rest] = argv;
  if (!input) { process.stderr.write(USAGE); return 1; }
  let out = input.replace(/\.opl$/i, '') + '.svg';
  let jsonOut: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-o' || rest[i] === '--json') {
      const value = rest[i + 1];
      if (value === undefined || value.startsWith('-')) { process.stderr.write(USAGE); return 1; }
      if (rest[i] === '-o') out = value;
      else jsonOut = value;
      i++;
    } else {
      process.stderr.write(`error: unknown argument: ${rest[i]}\n`);
      process.stderr.write(USAGE);
      return 1;
    }
  }
  let source: string;
  try {
    source = readFileSync(input, 'utf8');
  } catch (err) {
    process.stderr.write(`error: cannot read ${input}: ${(err as Error).message}\n`);
    return 1;
  }
  const model = renderModel(source);
  writeFileSync(out, renderSvg(source), 'utf8');
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ things: [...model.things.values()], links: model.links, diagnostics: model.diagnostics }, null, 2), 'utf8');
  }
  const hasError = model.diagnostics.some((d) => d.severity === 'error');
  for (const d of model.diagnostics) process.stderr.write(`${d.severity}: ${d.code} @${d.line}:${d.column} ${d.message}\n`);
  return hasError ? 1 : 0;
}

if (process.argv[1]) {
  let invoked = process.argv[1];
  try { invoked = realpathSync(process.argv[1]); } catch {}
  if (import.meta.url === pathToFileURL(invoked).href) {
    runCli(process.argv.slice(2)).then((c) => process.exit(c));
  }
}
