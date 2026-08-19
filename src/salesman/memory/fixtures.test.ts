import { describe, expect, it } from 'vitest';
import { createVisitorEvent, type VisitorEventInput } from '../observer/event-types';
import { createInitialMemory, reduceVisitorEvent } from './reducer';
import { summarizeMemoryForModel } from './summarize';
import type { SessionMemory } from './types';

function runFixture(path: string, events: Array<Omit<VisitorEventInput, 'page'> & { page?: string }>) {
  let memory: SessionMemory = createInitialMemory(`fixture:${path}`, path);
  events.forEach((input, index) => {
    memory = reduceVisitorEvent(memory, createVisitorEvent({
      ...input,
      page: input.page ?? path,
      at: input.at ?? 1_000 + index * 100,
    }));
  });
  return memory;
}

describe('vertical session-memory fixtures', () => {
  it('summarizes an HPL comparison session without raw behavioral noise', () => {
    const memory = runFixture('/hpl', [
      { type: 'product_view', entityId: 'HPL-WALNUT-01' },
      { type: 'product_revisit', entityId: 'HPL-WALNUT-01' },
      { type: 'filter_change', entityId: 'tone', metadata: { value: 'warm' } },
      { type: 'compare_add', entityId: 'HPL-WALNUT-01' },
      { type: 'compare_add', entityId: 'HPL-OAK-02' },
      { type: 'spec_view', entityId: 'HPL-WALNUT-01' },
    ]);

    expect(memory.inferred.stage).toBe('considering');
    expect(memory.inferred.hesitation).toBe('active_comparison');
    expect(memory.inferred.intent).toBe('spec-driven');
    expect(memory.selectedFilters.tone).toBe('warm');
    expect(memory.comparisonIds).toEqual(['HPL-WALNUT-01', 'HPL-OAK-02']);

    const summary = summarizeMemoryForModel(memory, 2_000);
    expect(summary.entities[0]).toEqual({ id: 'HPL-WALNUT-01', views: 2 });
    expect(JSON.stringify(summary)).not.toContain('mouse');
  });

  it('keeps yacht booking intent and structured answers available to the planner', () => {
    const memory = runFixture('/yachts', [
      { type: 'product_view', entityId: 'YACHT-AZURE-62' },
      { type: 'product_view', entityId: 'YACHT-SOL-74' },
      { type: 'compare_add', entityId: 'YACHT-AZURE-62' },
      { type: 'price_view', entityId: 'YACHT-AZURE-62' },
      { type: 'experience_open', entityId: 'yacht-fit' },
      { type: 'experience_answer', entityId: 'party_size', metadata: { value: 8 } },
      { type: 'experience_answer', entityId: 'occasion', metadata: { value: 'birthday' } },
      { type: 'booking_start', entityId: 'charter-request' },
    ]);

    expect(memory.inferred.stage).toBe('ready');
    expect(memory.formActive).toBe(true);
    expect(memory.answers.party_size).toBe(8);
    expect(memory.answers.occasion).toBe('birthday');
    expect(memory.comparisonIds).toEqual(['YACHT-AZURE-62']);

    const summary = summarizeMemoryForModel(memory, 2_500);
    expect(summary.knownAnswers).toMatchObject({ party_size: 8, occasion: 'birthday' });
    expect(summary.interaction.formActive).toBe(true);
  });

  it('keeps law-firm memory limited to intake and routing context', () => {
    const memory = runFixture('/law-firms', [
      { type: 'section_view', entityId: 'employment' },
      { type: 'product_view', entityId: 'LAWYER-EMPLOYMENT-01' },
      { type: 'experience_open', entityId: 'legal-intake' },
      { type: 'experience_answer', entityId: 'matter_category', metadata: { value: 'employment' } },
      { type: 'experience_answer', entityId: 'office', metadata: { value: 'downtown' } },
      { type: 'booking_start', entityId: 'consultation-request' },
    ]);

    expect(memory.inferred.stage).toBe('ready');
    expect(memory.answers).toMatchObject({ matter_category: 'employment', office: 'downtown' });
    expect(memory.viewedEntities['LAWYER-EMPLOYMENT-01'].views).toBe(1);

    const summary = summarizeMemoryForModel(memory, 2_500);
    expect(summary.sections).toContainEqual({ id: 'employment', views: 1 });
    expect(JSON.stringify(summary)).not.toMatch(/case value|outcome|deadline/i);
  });

  it('captures homepage product interest then advances through pilot qualification', () => {
    const memory = runFixture('/', [
      { type: 'section_view', entityId: 'how-it-works' },
      { type: 'section_view', entityId: 'niches' },
      { type: 'cta_click', entityId: 'pilot' },
      { type: 'experience_open', entityId: 'homepage-pilot' },
      { type: 'experience_answer', entityId: 'site_type', metadata: { value: 'catalog' } },
      { type: 'experience_answer', entityId: 'conversion_goal', metadata: { value: 'qualified-leads' } },
      { type: 'experience_complete', entityId: 'pilot-qualification' },
    ]);

    expect(memory.inferred.stage).toBe('ready');
    expect(memory.answers).toMatchObject({ site_type: 'catalog', conversion_goal: 'qualified-leads' });
    expect(memory.experienceActive).toBe(false);

    const summary = summarizeMemoryForModel(memory, 2_500);
    expect(summary.sections).toEqual(expect.arrayContaining([
      { id: 'how-it-works', views: 1 },
      { id: 'niches', views: 1 },
    ]));
    expect(summary.knownAnswers.conversion_goal).toBe('qualified-leads');
  });
});
