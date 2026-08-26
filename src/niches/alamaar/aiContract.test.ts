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

  it('rejects a response with no usable reply', () => {
    expect(normalizeAiConversationResponse({ intent: 'question', reply: '', updates: [], ui: [] }, ALAMAAR_FALLBACK_PRODUCTS)).toBeNull();
  });
});
