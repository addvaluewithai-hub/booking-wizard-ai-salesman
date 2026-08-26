import { describe, expect, it } from 'vitest';
import type { AlamaarProduct } from './catalog';
import { guideMessage, mascotState, rankProducts, resultBadges, scoreProduct } from './experience';

const products: AlamaarProduct[] = [
  {
    id: 'dark-wood',
    name: 'Dark Walnut',
    code: 'D-01',
    image: '/dark.webp',
    url: '/dark',
    family: 'wood',
    tone: 'dark',
  },
  {
    id: 'light-solid',
    name: 'Soft Ivory',
    code: 'L-01',
    image: '/light.webp',
    url: '/light',
    family: 'solid',
    tone: 'light',
  },
  {
    id: 'warm-wood',
    name: 'Warm Oak',
    code: 'W-01',
    image: '/warm.webp',
    url: '/warm',
    family: 'wood',
    tone: 'wood',
  },
];

describe('Al Amaar guided experience', () => {
  it('prioritizes a dark finish for a dark visual direction', () => {
    const answers = { project: 'kitchen', style: 'modern-dark', tone: 'dark', application: 'doors' };
    expect(scoreProduct(products[0], answers)).toBeGreaterThan(scoreProduct(products[1], answers));
    expect(rankProducts(products, answers, 1)[0].id).toBe('dark-wood');
  });

  it('prioritizes wood for a warm wood direction', () => {
    const answers = { project: 'hospitality', style: 'warm-wood', tone: 'wood', application: 'walls' };
    expect(rankProducts(products, answers, 1)[0].id).toBe('warm-wood');
  });

  it('keeps recommendation copy explicitly visual rather than technical', () => {
    const badges = resultBadges(products[0], { tone: 'dark', application: 'worktop' });
    expect(badges).toContain('مطابق لاتجاه اللون');
    expect(badges.some((badge) => badge.includes('للمقارنة'))).toBe(true);
  });

  it('reacts with cool mode when the visitor picks a dark direction', () => {
    expect(mascotState(3, { tone: 'dark' })).toBe('cool');
    expect(guideMessage(3, { tone: 'dark' }).eyebrow).toContain('😎');
  });

  it('names the lead recommendation in the final guide message', () => {
    const message = guideMessage(4, { tone: 'wood' }, products[2]);
    expect(message.text).toContain('Warm Oak');
    expect(message.text).toContain('W-01');
  });
});
