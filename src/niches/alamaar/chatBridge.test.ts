import { describe, expect, it } from 'vitest';
import { interpretFreeformLocally } from './chatBridge';

describe('Al Amaar hybrid conversation bridge', () => {
  it('routes a typed known option without AI', () => {
    const result = interpretFreeformLocally('مطبخ', 0);

    expect(result.intent).toBe('known-answer');
    expect(result.requiresAi).toBe(false);
    expect(result.answer).toMatchObject({ key: 'project', value: 'kitchen', label: 'مطبخ' });
    expect(result.nextStepIndex).toBe(1);
  });

  it('keeps an unknown freeform answer on the same step for AI interpretation', () => {
    const result = interpretFreeformLocally('أنا بعمل ريسبشن عيادة وعايزه هادي', 0);

    expect(result.intent).toBe('needs-ai');
    expect(result.requiresAi).toBe(true);
    expect(result.answer).toBeUndefined();
  });

  it('recognizes a typed dark tone deterministically', () => {
    const result = interpretFreeformLocally('داكن', 2);

    expect(result.requiresAi).toBe(false);
    expect(result.answer).toMatchObject({ key: 'tone', value: 'dark', label: 'داكن' });
    expect(result.nextStepIndex).toBe(3);
  });
});
