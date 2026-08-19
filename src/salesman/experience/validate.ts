import type { ExperienceComponent, ExperienceOption, ExperiencePlan } from './types';

const COMPONENT_TYPES = new Set<ExperienceComponent['type']>([
  'single_select', 'multi_select', 'range', 'quantity', 'product_cards', 'comparison',
  'date_picker', 'time_slots', 'add_ons', 'lead_capture', 'sample_request', 'quote_request',
  'book_consultation', 'faq', 'summary',
]);

const LEAD_FIELDS = new Set(['name', 'email', 'phone', 'company', 'url']);

export type PlanValidationOptions = {
  allowedComponentTypes?: ExperienceComponent['type'][];
  allowedEntityIds?: string[];
  maxComponents?: number;
};

function text(value: unknown, max = 180): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function validOptions(value: unknown): ExperienceOption[] | null {
  if (!Array.isArray(value)) return null;
  const options: ExperienceOption[] = [];
  for (const item of value.slice(0, 12)) {
    if (!item || typeof item !== 'object') return null;
    const option = item as Record<string, unknown>;
    const id = text(option.id, 60);
    const label = text(option.label, 100);
    if (!id || !label) return null;
    options.push({ id, label, description: text(option.description, 160) });
  }
  return options;
}

function entityIds(value: unknown, allowed: Set<string>) {
  if (!Array.isArray(value)) return null;
  const ids = value.filter((id): id is string => typeof id === 'string').slice(0, 8);
  if (!ids.length || ids.some((id) => !allowed.has(id))) return null;
  return [...new Set(ids)];
}

function validateComponent(raw: unknown, allowedEntities: Set<string>): ExperienceComponent | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const type = item.type;
  const id = text(item.id, 60);
  if (!id || typeof type !== 'string' || !COMPONENT_TYPES.has(type as ExperienceComponent['type'])) return null;

  if (type === 'single_select' || type === 'multi_select' || type === 'add_ons') {
    const question = text(item.question, 180);
    const options = validOptions(item.options);
    if (!question || !options?.length) return null;
    if (type === 'multi_select') return { type, id, question, options, max: typeof item.max === 'number' ? Math.max(1, Math.min(options.length, item.max)) : undefined };
    return { type, id, question, options } as ExperienceComponent;
  }

  if (type === 'range' || type === 'quantity') {
    const question = text(item.question, 180);
    const min = typeof item.min === 'number' ? item.min : NaN;
    const max = typeof item.max === 'number' ? item.max : NaN;
    if (!question || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
    if (type === 'range') return { type, id, question, min, max, step: typeof item.step === 'number' ? item.step : undefined, unit: text(item.unit, 20) };
    return { type, id, question, min, max, step: typeof item.step === 'number' ? item.step : undefined };
  }

  if (type === 'product_cards' || type === 'comparison' || type === 'sample_request') {
    const ids = entityIds(item.entityIds, allowedEntities);
    if (!ids) return null;
    if (type === 'product_cards') return { type, id, entityIds: ids, reason: text(item.reason, 220) };
    if (type === 'sample_request') return { type, id, entityIds: ids, title: text(item.title, 120) };
    return { type, id, entityIds: ids };
  }

  if (type === 'quote_request') {
    const ids = item.entityIds === undefined ? undefined : entityIds(item.entityIds, allowedEntities);
    if (item.entityIds !== undefined && !ids) return null;
    return { type, id, entityIds: ids ?? undefined, title: text(item.title, 120) };
  }

  if (type === 'date_picker') {
    const question = text(item.question, 180);
    if (!question) return null;
    return { type, id, question, minDate: text(item.minDate, 20), maxDate: text(item.maxDate, 20) };
  }

  if (type === 'time_slots') {
    const question = text(item.question, 180);
    const slots = Array.isArray(item.slots) ? item.slots.filter((slot): slot is string => typeof slot === 'string').slice(0, 12) : [];
    if (!question || !slots.length) return null;
    return { type, id, question, slots };
  }

  if (type === 'lead_capture') {
    const title = text(item.title, 140);
    if (!Array.isArray(item.fields) || item.fields.length < 1 || item.fields.length > 5) return null;
    if (item.fields.some((field) => typeof field !== 'string' || !LEAD_FIELDS.has(field))) return null;
    const fields = item.fields as Array<'name' | 'email' | 'phone' | 'company' | 'url'>;
    if (!title) return null;
    return { type, id, title, fields: [...new Set(fields)], submitLabel: text(item.submitLabel, 60) };
  }

  if (type === 'book_consultation') return { type, id, resourceId: text(item.resourceId, 80), title: text(item.title, 120) };

  if (type === 'faq') {
    const title = text(item.title, 140);
    const body = text(item.body, 500);
    if (!title || !body) return null;
    return { type, id, title, body };
  }

  if (type === 'summary') {
    const title = text(item.title, 140);
    const items = Array.isArray(item.items)
      ? item.items.slice(0, 8).map((row) => {
          if (!row || typeof row !== 'object') return null;
          const record = row as Record<string, unknown>;
          const label = text(record.label, 80);
          const value = text(record.value, 140);
          return label && value ? { label, value } : null;
        })
      : [];
    if (!title || !items.length || items.some((row) => !row)) return null;
    return { type, id, title, items: items.filter((row): row is { label: string; value: string } => Boolean(row)) };
  }

  return null;
}

export function validateExperiencePlan(raw: unknown, options: PlanValidationOptions): ExperiencePlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.components)) return null;
  const maxComponents = Math.max(1, Math.min(8, options.maxComponents ?? 4));
  if (value.components.length > maxComponents) return null;

  const allowedEntities = new Set(options.allowedEntityIds ?? []);
  const allowedTypes = new Set(options.allowedComponentTypes ?? [...COMPONENT_TYPES]);
  const components: ExperienceComponent[] = [];

  for (const rawComponent of value.components) {
    const component = validateComponent(rawComponent, allowedEntities);
    if (!component || !allowedTypes.has(component.type)) return null;
    components.push(component);
  }

  if (!components.length) return null;
  const ids = components.map((component) => component.id);
  if (new Set(ids).size !== ids.length) return null;

  return {
    title: text(value.title, 140),
    intro: text(value.intro, 320),
    components,
    nextAction: text(value.nextAction, 80),
  };
}
