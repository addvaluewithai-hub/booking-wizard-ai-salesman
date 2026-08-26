import { describe, expect, it } from 'vitest';
import { normalizeAiConversationResponse } from './aiContract';
import { ALAMAAR_FALLBACK_PRODUCTS } from './catalog';

describe('Al Amaar AI component contract', () => {
  it('canonicalizes known flow updates and keeps registered components', () => {
    const result = normalizeAiConversationResponse({
      intent: 'answer',
      reply: 'تمام، فهمت.',
      updates: [{ key: 'tone', value: 'dark', label: 'anything' }],
      ui: [
        { type: 'flow_choices', data: { stepKey: 'application', optionIds: ['walls', 'doors', 'invented'] } },
        { type: 'actions', data: { actionIds: ['whatsapp', 'fake'] } },
      ],
    }, ALAMAAR_FALLBACK_PRODUCTS);

    expect(result?.updates).toEqual([{ key: 'tone', value: 'dark', label: 'داكن' }]);
    expect(result?.ui).toEqual([
      { type: 'flow_choices', data: { stepKey: 'application', optionIds: ['walls', 'doors'] } },
      { type: 'actions', data: { actionIds: ['whatsapp'] } },
    ]);
  });

  it('drops invented product ids instead of rendering them', () => {
    const validId = ALAMAAR_FALLBACK_PRODUCTS[0].id;
    const result = normalizeAiConversationResponse({
      intent: 'recommend',
      reply: 'بص على دول.',
      updates: [],
      ui: [{ type: 'products', data: { productIds: [validId, 'made-up-product'] } }],
    }, ALAMAAR_FALLBACK_PRODUCTS);

    expect(result?.ui).toEqual([{ type: 'products', data: { productIds: [validId] } }]);
  });

  it('drops a full duplicate of the current guided choices', () => {
    const result = normalizeAiConversationResponse({
      intent: 'clarify',
      reply: 'قصدي إحساس التصميم: دافي، مودرن، كلاسيك… اختار الأقرب ليك.',
      updates: [],
      ui: [{
        type: 'flow_choices',
        data: {
          stepKey: 'style',
          optionIds: ['warm-wood', 'modern-dark', 'modern-light', 'classic', 'scandi', 'statement'],
        },
      }],
    }, ALAMAAR_FALLBACK_PRODUCTS, 1);

    expect(result?.ui).toEqual([]);
  });

  it('keeps a strict subset when AI genuinely narrows a clarification', () => {
    const result = normalizeAiConversationResponse({
      intent: 'clarify',
      reply: 'تقصد مودرن فاتح ولا مودرن داكن؟',
      updates: [],
      ui: [{ type: 'flow_choices', data: { stepKey: 'style', optionIds: ['modern-light', 'modern-dark'] } }],
    }, ALAMAAR_FALLBACK_PRODUCTS, 1);

    expect(result?.ui).toEqual([{ type: 'flow_choices', data: { stepKey: 'style', optionIds: ['modern-light', 'modern-dark'] } }]);
  });

  it('rejects a response with no usable reply', () => {
    expect(normalizeAiConversationResponse({ intent: 'question', reply: '', updates: [], ui: [] }, ALAMAAR_FALLBACK_PRODUCTS)).toBeNull();
  });
});
