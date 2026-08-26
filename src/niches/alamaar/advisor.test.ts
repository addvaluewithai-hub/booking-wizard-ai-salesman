import { describe, expect, it } from 'vitest';
import { advisorMomentForNextStep, buildAlamaarAdvisorRequest } from './advisor';

describe('Al Amaar proactive advisor moments', () => {
  it('waits until project and style are known before the first sales insight', () => {
    expect(advisorMomentForNextStep(1, { project: 'kitchen' })).toBeNull();
    expect(advisorMomentForNextStep(2, { project: 'kitchen', style: 'warm-wood' })).toBe('after-style');
  });

  it('uses a second restrained insight only after tone is known', () => {
    expect(advisorMomentForNextStep(3, { project: 'office', style: 'modern-dark' })).toBeNull();
    expect(advisorMomentForNextStep(3, { project: 'office', style: 'modern-dark', tone: 'dark' })).toBe('after-tone');
  });

  it('builds text-only advice context for the next deterministic question', () => {
    expect(buildAlamaarAdvisorRequest({
      moment: 'after-style',
      answers: { project: 'office', style: 'warm-wood' },
      nextStepIndex: 2,
    })).toEqual({
      moment: 'after-style',
      answers: { project: 'office', style: 'warm-wood' },
      nextStep: { key: 'tone', title: 'عايز الألوان تميل لإيه؟' },
    });
  });
});
