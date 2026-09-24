import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
await build({
  entryPoints: ['src/server.ts'],
  bundle: true, format: 'esm', platform: 'node',
  outfile: 'dist/server.js',
  alias: { 'mermaid-opm': fileURLToPath(new URL('../../src/index.ts', import.meta.url)) },
  banner: { js: '#!/usr/bin/env node\nimport { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
