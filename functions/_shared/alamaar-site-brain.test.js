import { describe, expect, it } from 'vitest';
import { ALAMAAR_SITE_BRAIN, compactAlamaarSiteBrain } from './alamaar-site-brain.js';

describe('Al Amaar site brain', () => {
  it('contains grounded material and finish guidance for consultative selling', () => {
    expect(ALAMAAR_SITE_BRAIN.materialFamilies.map((item) => item.id)).toEqual(['hpl', 'foam-board', 'plywood', 'natural-wood']);
    expect(ALAMAAR_SITE_BRAIN.finishDirections.map((item) => item.id)).toEqual(['wood', 'solid', 'stone', 'decorative']);
    expect(ALAMAAR_SITE_BRAIN.finishDirections.find((item) => item.id === 'solid')?.usefulFor).toContain('kitchens');
    expect(ALAMAAR_SITE_BRAIN.finishDirections.find((item) => item.id === 'wood')?.usefulFor).toContain('wardrobes');
  });

  it('keeps commercial proof separate from SKU-level technical claims', () => {
    expect(ALAMAAR_SITE_BRAIN.positioning.proof.join(' ')).toContain('specific SKU');
    expect(ALAMAAR_SITE_BRAIN.grounding.neverInvent).toContain('specific SKU stock');
    expect(ALAMAAR_SITE_BRAIN.grounding.neverInvent).toContain('water resistance');
  });

  it('returns the same curated brain snapshot used by the chat endpoint', () => {
    expect(compactAlamaarSiteBrain()).toBe(ALAMAAR_SITE_BRAIN);
    expect(compactAlamaarSiteBrain().version).toBe('2026-08-26');
  });
});
