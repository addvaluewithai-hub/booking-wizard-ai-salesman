import { describe, expect, it } from 'vitest';
import { YACHTS } from './data';

describe('fictional yacht fleet', () => {
  it('keeps deterministic capacity, price and slot data', () => {
    expect(YACHTS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(YACHTS.map((yacht) => yacht.id)).size).toBe(YACHTS.length);
    for (const yacht of YACHTS) {
      expect(yacht.capacity).toBeGreaterThan(1);
      expect(yacht.hourlyPriceUsd).toBeGreaterThan(0);
      expect(yacht.minimumHours).toBeGreaterThan(0);
      expect(yacht.demoSlots.length).toBeGreaterThan(0);
    }
  });

  it('does not encode fake scarcity or hold state', () => {
    for (const yacht of YACHTS) {
      expect(Object.prototype.hasOwnProperty.call(yacht, 'remaining')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(yacht, 'scarcity')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(yacht, 'holdTimer')).toBe(false);
    }
  });
});
