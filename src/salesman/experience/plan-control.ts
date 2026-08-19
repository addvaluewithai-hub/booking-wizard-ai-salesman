import type { ExperienceAnswer, ExperienceComponent, ExperiencePlan } from './types';

const CACHE_PREFIX = 'ai-salesman:experience-plan:';
const CACHE_TTL_MS = 2 * 60_000;
const QUESTION_TYPES = new Set<ExperienceComponent['type']>([
  'single_select',
  'multi_select',
  'yes_no',
  'range',
  'quantity',
  'image_choice',
  'upload_image',
  'date_picker',
  'time_slots',
  'add_ons',
]);

export function isQuestionComponent(component: ExperienceComponent) {
  return QUESTION_TYPES.has(component.type);
}

export function removeAnsweredQuestions(plan: ExperiencePlan, answers: Record<string, ExperienceAnswer>): ExperiencePlan | null {
  const components = plan.components.filter((component) => !(isQuestionComponent(component) && answers[component.id] !== undefined));
  if (!components.length) return null;
  return { ...plan, components };
}

export function planSignature(plan: ExperiencePlan) {
  return JSON.stringify(plan.components.map((component) => [component.type, component.id]));
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildPlanCacheKey(value: unknown) {
  return `${CACHE_PREFIX}${stableHash(JSON.stringify(value))}`;
}

export function readCachedPlan(key: string, now = Date.now()): ExperiencePlan | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || typeof parsed.storedAt !== 'number' || now - parsed.storedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.plan ?? null;
  } catch {
    return null;
  }
}

export function writeCachedPlan(key: string, plan: ExperiencePlan, now = Date.now()) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ storedAt: now, plan }));
  } catch {
    // Cache failure must never block the Experience Box.
  }
}
