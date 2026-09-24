import { build } from 'esbuild';
await build({
  entryPoints: ['src/index.ts'],
  bundle: true, format: 'esm', platform: 'browser',
  external: ['mermaid'], outfile: 'dist/mermaid-opm.mjs',
});
