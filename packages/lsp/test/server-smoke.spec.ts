import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, execFileSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pkgRoot = fileURLToPath(new URL('..', import.meta.url));
const serverPath = path.join(pkgRoot, 'dist', 'server.js');

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('packaged server smoke test', () => {
  let child: ChildProcessWithoutNullStreams | undefined;

  beforeAll(() => {
    if (!existsSync(serverPath)) {
      execFileSync(process.execPath, ['build.mjs'], { cwd: pkgRoot, stdio: 'inherit' });
    }
  }, 60000);

  afterAll(() => {
    child?.kill();
  });

  it(
    'starts, answers initialize and does not crash on load',
    async () => {
      const proc = spawn(process.execPath, ['dist/server.js', '--stdio'], { cwd: pkgRoot });
      child = proc;

      let stderr = '';
      proc.stderr.setEncoding('utf8');
      proc.stderr.on('data', (chunk: string) => { stderr += chunk; });

      let stdout = '';
      const messages: Array<Record<string, unknown>> = [];
      proc.stdout.setEncoding('utf8');
      proc.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        while (true) {
          const headerEnd = stdout.indexOf('\r\n\r\n');
          if (headerEnd === -1) break;
          const header = stdout.slice(0, headerEnd);
          const match = /Content-Length:\s*(\d+)/i.exec(header);
          if (!match) break;
          const length = Number(match[1]);
          const bodyStart = headerEnd + 4;
          if (stdout.length - bodyStart < length) break;
          const body = stdout.slice(bodyStart, bodyStart + length);
          stdout = stdout.slice(bodyStart + length);
          try { messages.push(JSON.parse(body) as Record<string, unknown>); } catch { /* ignore */ }
        }
      });

      await delay(600);
      expect(proc.exitCode, `server exited early; stderr:\n${stderr}`).toBeNull();
      expect(stderr).not.toContain('Dynamic require');

      const params = { processId: process.pid, rootUri: null, capabilities: {} };
      const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params });
      proc.stdin.write(`Content-Length: ${Buffer.byteLength(request, 'utf8')}\r\n\r\n${request}`);

      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const response = messages.find((m) => m.id === 1 && m.result);
        if (response) {
          const result = response.result as { capabilities?: unknown };
          expect(result.capabilities).toBeTruthy();
          return;
        }
        if (proc.exitCode !== null) break;
        await delay(50);
      }

      expect.fail(`no framed initialize response within 2s; stderr:\n${stderr}`);
    },
    15000,
  );
});
