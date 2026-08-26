import { describe, expect, it } from 'vitest';
import { ALAMAAR_FALLBACK_PRODUCTS } from './catalog';
import { reduceSemanticEvents } from './conversationEngine';

describe('Al Amaar conversation engine', () => {
  it('applies semantic answers and computes the next unanswered step itself', () => {
    const result = reduceSemanticEvents({
      response: {
        reply: 'تمام، فهمت إنك رايح لمودرن داكن.',
        events: [
          { type: 'answer', field: 'project', value: 'kitchen' },
          { type: 'answer', field: 'style', value: 'modern-dark' },
        ],
      },
      answers: {},
      stepIndex: 0,
      catalog: ALAMAAR_FALLBACK_PRODUCTS,
    });

    expect(result.answers).toMatchObject({ project: 'kitchen', style: 'modern-dark' });
    expect(result.nextStepIndex).toBe(2);
    expect(result.resolvedCurrentAnswer).toMatchObject({ key: 'project', value: 'kitchen' });
  });

  it('keeps a normal clarification inside the current guided surface', () => {
    const result = reduceSemanticEvents({
      response: {
        reply: 'قصدي إحساس التصميم: دافي، مودرن، كلاسيك.',
        events: [{ type: 'clarify_current_question', candidates: [] }],
      },
      answers: { project: 'kitchen' },
      stepIndex: 1,
      catalog: ALAMAAR_FALLBACK_PRODUCTS,
    });

    expect(result.nextStepIndex).toBe(1);
    expect(result.effects).toEqual([]);
  });

  it('turns semantic clarification candidates into an app-owned guided surface', () => {
    const result = reduceSemanticEvents({
      response: {
        reply: 'تقصد مودرن فاتح ولا مودرن داكن؟',
        events: [{ type: 'clarify_current_question', candidates: [
          { field: 'style', value: 'modern-light' },
          { field: 'style', value: 'modern-dark' },
        ] }],
      },
      answers: { project: 'kitchen' },
      stepIndex: 1,
      catalog: ALAMAAR_FALLBACK_PRODUCTS,
    });

    expect(result.effects).toEqual([{ type: 'guided_candidates', stepKey: 'style', optionIds: ['modern-light', 'modern-dark'] }]);
  });

  it('selects product IDs deterministically from semantic criteria', () => {
    const result = reduceSemanticEvents({
      response: {
        reply: 'أطلع لك الاتجاه الداكن.',
        events: [{ type: 'product_request', criteria: { tone: 'dark', family: 'wood' } }],
      },
      answers: { project: 'kitchen' },
      stepIndex: 1,
      catalog: ALAMAAR_FALLBACK_PRODUCTS,
    });

    expect(result.effects).toEqual([{ type: 'product_results', productIds: ['5242-SF'] }]);
  });

  it('maps technical questions to a deterministic human-support action', () => {
    const result = reduceSemanticEvents({
      response: {
        reply: 'المعلومة الفنية دي محتاجة تأكيد.',
        events: [{ type: 'ask_question', topic: 'technical' }],
      },
      answers: {},
      stepIndex: 0,
      catalog: ALAMAAR_FALLBACK_PRODUCTS,
    });

    expect(result.effects).toEqual([{ type: 'actions', actionIds: ['whatsapp'] }]);
  });
});
