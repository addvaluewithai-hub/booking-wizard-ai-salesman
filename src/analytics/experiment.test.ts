import { describe, expect, it } from 'vitest';
import { assignExperimentVariant } from './experiment';

describe('session experiment assignment', () => {
  it('is stable for the same anonymous session', () => {
    const first = assignExperimentVariant('session-stable-123', 10);
    expect(assignExperimentVariant('session-stable-123', 10)).toBe(first);
  });

  it('can disable the control group explicitly', () => {
    expect(assignExperimentVariant('any-session', 0)).toBe('treatment');
  });

  it('never allows more than half of sessions into control', () => {
    const variants = Array.from({ length: 500 }, (_, index) => assignExperimentVariant(`session-${index}`, 100));
    const controls = variants.filter((variant) => variant === 'control').length;
    expect(controls).toBeGreaterThan(150);
    expect(controls).toBeLessThan(350);
  });
});
