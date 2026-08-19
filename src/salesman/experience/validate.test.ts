import { describe, expect, it } from 'vitest';
import { validateExperiencePlan } from './validate';

const options = {
  allowedComponentTypes: ['single_select', 'product_cards', 'lead_capture', 'summary'] as const,
  allowedEntityIds: ['AV-101', 'AV-124'],
  maxComponents: 4,
};

describe('ExperiencePlan validation', () => {
  it('accepts a grounded known component plan', () => {
    const plan = validateExperiencePlan({
      title: 'Choose a finish',
      components: [
        { type: 'product_cards', id: 'matches', entityIds: ['AV-101', 'AV-124'], reason: 'Current shortlist' },
      ],
    }, { ...options, allowedComponentTypes: [...options.allowedComponentTypes] });

    expect(plan?.components[0].type).toBe('product_cards');
  });

  it('rejects unknown component types', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'arbitrary_html', id: 'x', html: '<script>alert(1)</script>' }] }, {
      allowedComponentTypes: [...options.allowedComponentTypes], allowedEntityIds: options.allowedEntityIds, maxComponents: 4,
    });
    expect(plan).toBeNull();
  });

  it('rejects entity IDs outside deterministic data', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'product_cards', id: 'matches', entityIds: ['INVENTED-999'] }] }, {
      allowedComponentTypes: [...options.allowedComponentTypes], allowedEntityIds: options.allowedEntityIds, maxComponents: 4,
    });
    expect(plan).toBeNull();
  });

  it('rejects unsupported lead fields', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'lead_capture', id: 'lead', title: 'Contact', fields: ['email', 'password'] }] }, {
      allowedComponentTypes: [...options.allowedComponentTypes], allowedEntityIds: options.allowedEntityIds, maxComponents: 4,
    });
    expect(plan).toBeNull();
  });

  it('rejects plans that exceed the component limit', () => {
    const components = Array.from({ length: 5 }, (_, index) => ({ type: 'summary', id: `s${index}`, title: 'Summary', items: [{ label: 'A', value: 'B' }] }));
    expect(validateExperiencePlan({ components }, {
      allowedComponentTypes: [...options.allowedComponentTypes], allowedEntityIds: options.allowedEntityIds, maxComponents: 4,
    })).toBeNull();
  });
});
