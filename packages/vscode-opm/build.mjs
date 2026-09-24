import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const core = fileURLToPath(new URL('../../src/index.ts', import.meta.url));
const alias = { 'mermaid-opm': core };
const banner = { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' };
await build({
  entryPoints: ['src/extension.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: 'dist/extension.js',
  external: ['vscode'], alias, banner,
});
await build({
  entryPoints: ['../lsp/src/server.ts'],
  bundle: true, format: 'esm', platform: 'node', outfile: 'dist/server.js',
  external: ['vscode'], alias, banner,
});
