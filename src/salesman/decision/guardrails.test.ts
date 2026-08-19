import { describe, expect, it } from 'vitest';
import { createVisitorEvent } from '../observer/event-types';
import { createInitialMemory } from '../memory/reducer';
import type { SalesmanDecision } from './types';
import { shouldConsiderDecision, validateDecision } from './guardrails';

function event(type: Parameters<typeof createVisitorEvent>[0]['type'], page = '/hpl') {
  return createVisitorEvent({ type, page, at: 10_000 });
}

function intervene(message: string): SalesmanDecision {
  return { action: 'intervene', message, internalReason: 'test', confidence: 0.9, cooldownSeconds: 75 };
}

describe('decision guardrails', () => {
  it('does not call the model for ordinary reading signals', () => {
    const memory = createInitialMemory('s', '/hpl');
    expect(shouldConsiderDecision(memory, event('section_view'))).toBe(false);
    expect(shouldConsiderDecision(memory, event('page_view'))).toBe(false);
  });

  it('suppresses proactive calls while a form is active', () => {
    const memory = { ...createInitialMemory('s', '/hpl'), formActive: true };
    expect(shouldConsiderDecision(memory, event('product_revisit'))).toBe(false);
    expect(shouldConsiderDecision(memory, event('explicit_help'))).toBe(true);
  });

  it('requires a very strong signal at suppression level two', () => {
    const memory = createInitialMemory('s', '/hpl');
    memory.salesman.suppressionLevel = 2;
    expect(shouldConsiderDecision(memory, event('price_view'))).toBe(false);
    expect(shouldConsiderDecision(memory, event('form_abandon'))).toBe(true);
  });

  it('rejects invented urgency and discounts', () => {
    const memory = createInitialMemory('s', '/hpl');
    const result = validateDecision(intervene('Act now for a discount — only 2 left.'), memory, event('product_revisit'));
    expect(result.action).toBe('silent');
  });

  it('rejects unsafe law-firm advice', () => {
    const memory = createInitialMemory('s', '/law-firms');
    const result = validateDecision(intervene('You should sue — you will win this case.'), memory, event('form_abandon', '/law-firms'));
    expect(result.action).toBe('silent');
  });

  it('rejects semantically repeated intervention ideas', () => {
    const memory = createInitialMemory('s', '/hpl');
    memory.salesman.history = [{ id: 'i1', at: 1, message: 'Compare the dark walnut options for your kitchen', outcome: 'ignored' }];
    const result = validateDecision(intervene('Compare those dark walnut options for the kitchen'), memory, event('product_revisit'));
    expect(result.action).toBe('silent');
  });
});
