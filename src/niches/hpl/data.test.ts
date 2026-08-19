import { describe, expect, it } from 'vitest';
import { HPL_PRODUCTS } from './data';

describe('HPL fictional catalog', () => {
  it('contains a production-sized unique demo catalog', () => {
    expect(HPL_PRODUCTS.length).toBeGreaterThanOrEqual(18);
    expect(HPL_PRODUCTS.length).toBeLessThanOrEqual(30);
    expect(new Set(HPL_PRODUCTS.map((product) => product.id)).size).toBe(HPL_PRODUCTS.length);
  });

  it('contains only explicit supported demo fields', () => {
    const forbidden = ['fireRating', 'fire_rating', 'moistureResistance', 'moisture_resistance', 'thickness', 'certification', 'warranty', 'availability', 'price'];
    for (const product of HPL_PRODUCTS) {
      expect(product.id).toMatch(/^AV-/);
      expect(product.applications.length).toBeGreaterThan(0);
      for (const key of forbidden) expect(Object.prototype.hasOwnProperty.call(product, key)).toBe(false);
    }
  });
});
