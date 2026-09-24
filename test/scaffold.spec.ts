import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('scaffold', () => {
  it('exports a version string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });
});
