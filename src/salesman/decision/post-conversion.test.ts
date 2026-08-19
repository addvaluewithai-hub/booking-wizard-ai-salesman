import { describe, expect, it } from 'vitest';
import { createVisitorEvent } from '../observer/event-types';
import { createInitialMemory, reduceVisitorEvent } from '../memory/reducer';
import { shouldConsiderDecision } from './guardrails';

describe('post-conversion restraint', () => {
  it('suppresses proactive selling after a completed conversion', () => {
    const initial = createInitialMemory('session', '/hpl');
    const converted = reduceVisitorEvent(initial, createVisitorEvent({ type: 'conversion', page: '/hpl', entityId: 'qualified_lead', at: 100 }));
    expect(converted.inferred.stage).toBe('converting');
    expect(shouldConsiderDecision(converted, createVisitorEvent({ type: 'product_revisit', page: '/hpl', entityId: 'AV-101', at: 200 }), 200)).toBe(false);
  });

  it('keeps explicit visitor-requested help available after conversion', () => {
    const initial = createInitialMemory('session', '/hpl');
    const converted = reduceVisitorEvent(initial, createVisitorEvent({ type: 'conversion', page: '/hpl', entityId: 'qualified_lead', at: 100 }));
    expect(shouldConsiderDecision(converted, createVisitorEvent({ type: 'explicit_help', page: '/hpl', at: 200 }), 200)).toBe(true);
  });
});
