import { describe, expect, it } from 'vitest';
import { normalizeAiInterpreterResponse } from './aiContract';

describe('Al Amaar semantic AI contract', () => {
  it('keeps only canonical answer events', () => {
    const result = normalizeAiInterpreterResponse({
      reply: 'تمام، فهمت الاتجاه.',
      events: [
        { type: 'answer', field: 'tone', value: 'dark' },
        { type: 'answer', field: 'tone', value: 'made-up' },
        { type: 'answer', field: 'unknown', value: 'dark' },
      ],
    });

    expect(result).toEqual({
      reply: 'تمام، فهمت الاتجاه.',
      events: [{ type: 'answer', field: 'tone', value: 'dark' }],
    });
  });

  it('sanitizes semantic product criteria without accepting products or components', () => {
    const result = normalizeAiInterpreterResponse({
      reply: 'أدور لك على اتجاه داكن وخشبي.',
      events: [{
        type: 'product_request',
        criteria: { tone: 'dark', family: 'wood', style: 'modern-dark', productIds: ['fake'] },
        component: 'ProductCarousel',
      }],
    });

    expect(result?.events).toEqual([
      { type: 'product_request', criteria: { tone: 'dark', family: 'wood', style: 'modern-dark' } },
    ]);
  });

  it('canonicalizes clarification candidates as domain values only', () => {
    const result = normalizeAiInterpreterResponse({
      reply: 'تقصد مودرن فاتح ولا مودرن داكن؟',
      events: [{
        type: 'clarify_current_question',
        candidates: [
          { field: 'style', value: 'modern-light' },
          { field: 'style', value: 'modern-dark' },
          { field: 'style', value: 'invented' },
        ],
      }],
    });

    expect(result?.events).toEqual([{ type: 'clarify_current_question', candidates: [
      { field: 'style', value: 'modern-light' },
      { field: 'style', value: 'modern-dark' },
    ] }]);
  });

  it('adds an unknown semantic event when the model gives no usable events', () => {
    expect(normalizeAiInterpreterResponse({ reply: 'محتاج أفهم أكتر.', events: [{ type: 'render_magic_card' }] })).toEqual({
      reply: 'محتاج أفهم أكتر.',
      events: [{ type: 'unknown' }],
    });
  });

  it('rejects a response with no usable reply', () => {
    expect(normalizeAiInterpreterResponse({ reply: '', events: [{ type: 'unknown' }] })).toBeNull();
  });
});
