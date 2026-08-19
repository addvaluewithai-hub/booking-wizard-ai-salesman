import { describe, expect, it } from 'vitest';
import { createVisitorEvent } from '../observer/event-types';
import { createInitialMemory, reduceVisitorEvent } from './reducer';

function apply(type: Parameters<typeof createVisitorEvent>[0]['type'], memory = createInitialMemory('test-session', '/hpl'), extra: Partial<Parameters<typeof createVisitorEvent>[0]> = {}) {
  return reduceVisitorEvent(memory, createVisitorEvent({ type, page: '/hpl', at: 1_000, ...extra }));
}

describe('session memory reducer', () => {
  it('promotes repeated product comparison into consideration memory', () => {
    let memory = createInitialMemory('session', '/hpl');
    memory = apply('product_view', memory, { entityId: 'AV-124' });
    memory = apply('product_revisit', memory, { entityId: 'AV-124' });
    memory = apply('compare_add', memory, { entityId: 'AV-124' });
    memory = apply('compare_add', memory, { entityId: 'AV-131' });

    expect(memory.viewedEntities['AV-124'].views).toBe(2);
    expect(memory.comparisonIds).toEqual(['AV-124', 'AV-131']);
    expect(memory.inferred.stage).toBe('considering');
    expect(memory.inferred.hesitation).toBe('active_comparison');
  });

  it('preserves multi-select answers as arrays', () => {
    const memory = apply('experience_answer', createInitialMemory('session', '/hpl'), {
      entityId: 'usage_needs',
      metadata: { value: ['easy-care', 'warm'] },
    });

    expect(memory.answers.usage_needs).toEqual(['easy-care', 'warm']);
  });

  it('raises suppression after ignored or dismissed proactive interventions', () => {
    let memory = createInitialMemory('session', '/hpl');
    memory = apply('salesman_impression', memory, { entityId: 'i1', metadata: { message: 'A useful thought' } });
    memory = apply('salesman_ignore', memory, { entityId: 'i1' });
    expect(memory.salesman.suppressionLevel).toBe(1);

    memory = apply('salesman_impression', memory, { entityId: 'i2', metadata: { message: 'A different idea' } });
    memory = apply('salesman_dismiss', memory, { entityId: 'i2' });
    expect(memory.salesman.suppressionLevel).toBe(2);
  });
});
