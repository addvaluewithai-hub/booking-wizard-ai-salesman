import { describe, expect, it } from 'vitest';
import { LAWYERS, matchLawyers } from './data';

describe('law-firm configured routing', () => {
  it('returns only configured profiles matching practice and office', () => {
    const matches = matchLawyers('real_estate', 'Central Office');
    expect(matches.length).toBeGreaterThan(0);
    for (const lawyer of matches) {
      expect(lawyer.practiceAreas).toContain('real_estate');
      expect(lawyer.offices).toContain('Central Office');
      expect(LAWYERS.some((configured) => configured.id === lawyer.id)).toBe(true);
    }
  });

  it('does not fabricate a match for an unconfigured office', () => {
    expect(matchLawyers('business', 'Nonexistent Office')).toEqual([]);
  });
});
