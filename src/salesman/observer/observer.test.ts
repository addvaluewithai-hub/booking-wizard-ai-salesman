import { describe, expect, it } from 'vitest';
import { classifyEntityVisibility } from './observer';

describe('observer entity visibility', () => {
  it('suppresses duplicate visibility callbacks for the same page observation', () => {
    const seenEntities = new Set<string>();
    const emittedVisibilityKeys = new Set<string>();
    const input = { entityId: 'HPL-101', visibilityKey: 'entity:HPL-101:/hpl', seenEntities, emittedVisibilityKeys };

    expect(classifyEntityVisibility(input)).toBe('product_view');
    expect(classifyEntityVisibility(input)).toBeNull();
    expect(seenEntities.has('HPL-101')).toBe(true);
  });

  it('emits a revisit after a new page/route observation clears the visibility scope', () => {
    const seenEntities = new Set<string>(['HPL-101']);
    const emittedVisibilityKeys = new Set<string>();

    expect(classifyEntityVisibility({
      entityId: 'HPL-101',
      visibilityKey: 'entity:HPL-101:/hpl/detail',
      seenEntities,
      emittedVisibilityKeys,
    })).toBe('product_revisit');
  });

  it('keeps different entities independent', () => {
    const seenEntities = new Set<string>();
    const emittedVisibilityKeys = new Set<string>();
    expect(classifyEntityVisibility({ entityId: 'HPL-101', visibilityKey: 'entity:HPL-101:/hpl', seenEntities, emittedVisibilityKeys })).toBe('product_view');
    expect(classifyEntityVisibility({ entityId: 'HPL-202', visibilityKey: 'entity:HPL-202:/hpl', seenEntities, emittedVisibilityKeys })).toBe('product_view');
  });
});
