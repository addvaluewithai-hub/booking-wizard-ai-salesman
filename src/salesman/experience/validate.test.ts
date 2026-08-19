import { describe, expect, it } from 'vitest';
import type { ExperienceComponent } from './types';
import { validateExperiencePlan } from './validate';

const allowedComponentTypes: ExperienceComponent['type'][] = [
  'single_select', 'yes_no', 'product_cards', 'recommendation_reason', 'image_choice', 'upload_image',
  'call_or_whatsapp', 'lead_capture', 'summary',
];
const options = {
  allowedComponentTypes,
  allowedEntityIds: ['AV-101', 'AV-124'],
  allowedContactKeys: ['sales'],
  maxComponents: 4,
};

describe('ExperiencePlan validation', () => {
  it('accepts a grounded known component plan', () => {
    const plan = validateExperiencePlan({
      title: 'Choose a finish',
      components: [
        { type: 'product_cards', id: 'matches', entityIds: ['AV-101', 'AV-124'], reason: 'Current shortlist' },
      ],
    }, options);

    expect(plan?.components[0].type).toBe('product_cards');
  });

  it('rejects unknown component types', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'arbitrary_html', id: 'x', html: '<script>alert(1)</script>' }] }, options);
    expect(plan).toBeNull();
  });

  it('rejects entity IDs outside deterministic data', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'product_cards', id: 'matches', entityIds: ['INVENTED-999'] }] }, options);
    expect(plan).toBeNull();
  });

  it('rejects unsupported lead fields', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'lead_capture', id: 'lead', title: 'Contact', fields: ['email', 'password'] }] }, options);
    expect(plan).toBeNull();
  });

  it('rejects plans that exceed the component limit', () => {
    const components = Array.from({ length: 5 }, (_, index) => ({ type: 'summary', id: `s${index}`, title: 'Summary', items: [{ label: 'A', value: 'B' }] }));
    expect(validateExperiencePlan({ components }, options)).toBeNull();
  });

  it('keeps recommendation reasons grounded to a known entity', () => {
    expect(validateExperiencePlan({ components: [{ type: 'recommendation_reason', id: 'why', entityId: 'AV-101' }] }, options)?.components[0]).toMatchObject({ type: 'recommendation_reason', entityId: 'AV-101' });
    expect(validateExperiencePlan({ components: [{ type: 'recommendation_reason', id: 'why', entityId: 'INVENTED-999' }] }, options)).toBeNull();
  });

  it('grounds image choices to deterministic entities', () => {
    const valid = validateExperiencePlan({ components: [{ type: 'image_choice', id: 'visual', question: 'Which visual direction?', entityIds: ['AV-101', 'AV-124'] }] }, options);
    const invalid = validateExperiencePlan({ components: [{ type: 'image_choice', id: 'visual', question: 'Which visual direction?', entityIds: ['AV-101', 'FAKE'] }] }, options);
    expect(valid?.components[0].type).toBe('image_choice');
    expect(invalid).toBeNull();
  });

  it('only accepts configured contact keys', () => {
    const valid = validateExperiencePlan({ components: [{ type: 'call_or_whatsapp', id: 'contact', contactKey: 'sales' }] }, options);
    const invalid = validateExperiencePlan({ components: [{ type: 'call_or_whatsapp', id: 'contact', contactKey: 'invented' }] }, options);
    expect(valid?.components[0]).toMatchObject({ type: 'call_or_whatsapp', contactKey: 'sales' });
    expect(invalid).toBeNull();
  });

  it('restricts upload contracts to supported image MIME types and bounded size', () => {
    const valid = validateExperiencePlan({ components: [{ type: 'upload_image', id: 'upload', title: 'Add a room photo', accept: ['image/jpeg', 'image/png'], maxBytes: 5_000_000 }] }, options);
    const invalidType = validateExperiencePlan({ components: [{ type: 'upload_image', id: 'upload', title: 'Add a file', accept: ['text/html'] }] }, options);
    const invalidSize = validateExperiencePlan({ components: [{ type: 'upload_image', id: 'upload', title: 'Add a file', maxBytes: 50_000_000 }] }, options);
    expect(valid?.components[0].type).toBe('upload_image');
    expect(invalidType).toBeNull();
    expect(invalidSize).toBeNull();
  });

  it('normalizes explicit yes/no choices without allowing arbitrary options', () => {
    const plan = validateExperiencePlan({ components: [{ type: 'yes_no', id: 'confirm', question: 'Is this for a commercial project?', yesLabel: 'Commercial', noLabel: 'Residential' }] }, options);
    expect(plan?.components[0]).toEqual({ type: 'yes_no', id: 'confirm', question: 'Is this for a commercial project?', yesLabel: 'Commercial', noLabel: 'Residential' });
  });
});
