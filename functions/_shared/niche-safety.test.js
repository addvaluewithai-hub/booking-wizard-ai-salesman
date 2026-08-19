import { describe, expect, it } from 'vitest';
import { hasProhibitedSalesClaim, isLawRoutingCopySafe } from './niche-safety.js';

describe('niche safety validators', () => {
  it('rejects fabricated urgency and guarantees', () => {
    expect(hasProhibitedSalesClaim('Only 2 left — act now.')).toBe(true);
    expect(hasProhibitedSalesClaim('This result is guaranteed.')).toBe(true);
    expect(hasProhibitedSalesClaim('I can help you compare the configured options.')).toBe(false);
  });

  it('rejects law outcome and merits predictions', () => {
    expect(isLawRoutingCopySafe('You will win this case.')).toBe(false);
    expect(isLawRoutingCopySafe('You have a strong case.')).toBe(false);
    expect(isLawRoutingCopySafe('Your case may be worth $500,000.')).toBe(false);
  });

  it('rejects invented legal deadlines and personalized legal recommendations', () => {
    expect(isLawRoutingCopySafe('The deadline is tomorrow.')).toBe(false);
    expect(isLawRoutingCopySafe('You should sue immediately.')).toBe(false);
    expect(isLawRoutingCopySafe('I recommend you reject the settlement.')).toBe(false);
  });

  it('allows neutral configured intake and routing copy', () => {
    expect(isLawRoutingCopySafe('I can help route this to the configured employment team.')).toBe(true);
    expect(isLawRoutingCopySafe('Choose the office that is most convenient for a consultation request.')).toBe(true);
    expect(isLawRoutingCopySafe('We can collect broad intake details without giving personalized legal advice.')).toBe(true);
  });
});
