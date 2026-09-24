import { describe, it, expect } from 'vitest';
import { thingId } from '../src/core/model/types.js';

describe('thingId', () => {
  it('normalizes whitespace', () => {
    expect(thingId('Driver   Rescuing')).toBe(thingId('Driver Rescuing'));
  });
  it('trims', () => {
    expect(thingId('  Order ')).toBe('Order');
  });
});
