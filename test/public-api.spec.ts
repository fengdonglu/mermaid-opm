import { describe, it, expect } from 'vitest';
import { registerOpm, opm } from '../src/index.js';

describe('public API', () => {
  it('exports registerOpm and opm from the package entrypoint', () => {
    expect(typeof registerOpm).toBe('function');
    expect(opm.id).toBe('opm');
  });
});
