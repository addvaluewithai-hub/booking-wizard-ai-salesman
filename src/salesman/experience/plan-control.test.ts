import { describe, expect, it } from 'vitest';
import { buildPlanCacheKey, planSignature, removeAnsweredQuestions } from './plan-control';
import type { ExperiencePlan } from './types';

const plan: ExperiencePlan = {
  components: [
    { type: 'single_select', id: 'project_type', question: 'Project type?', options: [{ id: 'home', label: 'Home' }] },
    { type: 'product_cards', id: 'matches', entityIds: ['A'] },
  ],
};

describe('Experience plan control', () => {
  it('removes already-answered question components but keeps result components', () => {
    const filtered = removeAnsweredQuestions(plan, { project_type: 'home' });
    expect(filtered?.components).toEqual([{ type: 'product_cards', id: 'matches', entityIds: ['A'] }]);
  });

  it('returns null when every component is an already-answered question', () => {
    const questionOnly: ExperiencePlan = {
      components: [{ type: 'yes_no', id: 'confirmed', question: 'Confirmed?' }],
    };
    expect(removeAnsweredQuestions(questionOnly, { confirmed: true })).toBeNull();
  });

  it('produces a stable signature for duplicate-plan detection', () => {
    expect(planSignature(plan)).toBe(planSignature({ ...plan, title: 'Different title' }));
  });

  it('changes the session cache key when planning context changes', () => {
    const first = buildPlanCacheKey({ niche: 'hpl', answers: { room: 'kitchen' } });
    const same = buildPlanCacheKey({ niche: 'hpl', answers: { room: 'kitchen' } });
    const changed = buildPlanCacheKey({ niche: 'hpl', answers: { room: 'office' } });
    expect(first).toBe(same);
    expect(first).not.toBe(changed);
  });
});
