import { STEPS, choiceValue, type AnswerKey, type Answers } from './experience';
import type { AlamaarProduct } from './catalog';

export type ProductCriteria = {
  tone?: AlamaarProduct['tone'];
  family?: AlamaarProduct['family'];
  style?: string;
};

export type AiSemanticEvent =
  | { type: 'answer'; field: AnswerKey; value: string }
  | { type: 'clarify_current_question'; candidates: Array<{ field: AnswerKey; value: string }> }
  | { type: 'ask_question'; topic: 'general' | 'product' | 'technical' }
  | { type: 'product_request'; criteria: ProductCriteria }
  | { type: 'request_sample' }
  | { type: 'contact_human'; reason?: string }
  | { type: 'unknown' };

export type AiInterpreterResponse = {
  reply: string;
  events: AiSemanticEvent[];
};

export type AiConversationRequest = {
  message: string;
  stepIndex: number;
  answers: Answers;
  currentStep: null | {
    key: AnswerKey;
    title: string;
    options: Array<{ value: string; label: string }>;
  };
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
};

const TONES = new Set<AlamaarProduct['tone']>(['light', 'neutral', 'wood', 'dark']);
const FAMILIES = new Set<AlamaarProduct['family']>(['wood', 'solid', 'stone', 'decorative']);
const QUESTION_TOPICS = new Set(['general', 'product', 'technical']);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function canonicalAnswer(field: unknown, value: unknown) {
  if (typeof field !== 'string' || typeof value !== 'string') return null;
  const step = STEPS.find((item) => item.key === field);
  if (!step) return null;
  const choice = step.choices.find((item) => choiceValue(item) === value);
  if (!choice) return null;
  return { field: step.key, value: choiceValue(choice) } as const;
}

function sanitizeCandidates(value: unknown) {
  if (!Array.isArray(value)) return [];
  const candidates = value
    .map((item) => {
      if (!isObject(item)) return null;
      return canonicalAnswer(item.field, item.value);
    })
    .filter((item): item is { field: AnswerKey; value: string } => Boolean(item));

  return candidates
    .filter((item, index, all) => all.findIndex((other) => other.field === item.field && other.value === item.value) === index)
    .slice(0, 4);
}

function sanitizeCriteria(value: unknown): ProductCriteria {
  const source = isObject(value) ? value : {};
  const tone = typeof source.tone === 'string' && TONES.has(source.tone as AlamaarProduct['tone'])
    ? source.tone as AlamaarProduct['tone']
    : undefined;
  const family = typeof source.family === 'string' && FAMILIES.has(source.family as AlamaarProduct['family'])
    ? source.family as AlamaarProduct['family']
    : undefined;
  const styleStep = STEPS.find((step) => step.key === 'style');
  const style = typeof source.style === 'string' && styleStep?.choices.some((choice) => choiceValue(choice) === source.style)
    ? source.style
    : undefined;
  return { tone, family, style };
}

function sanitizeEvent(value: unknown): AiSemanticEvent | null {
  if (!isObject(value) || typeof value.type !== 'string') return null;

  if (value.type === 'answer') {
    const answer = canonicalAnswer(value.field, value.value);
    return answer ? { type: 'answer', ...answer } : null;
  }

  if (value.type === 'clarify_current_question') {
    return { type: 'clarify_current_question', candidates: sanitizeCandidates(value.candidates) };
  }

  if (value.type === 'ask_question') {
    const topic = typeof value.topic === 'string' && QUESTION_TOPICS.has(value.topic) ? value.topic as 'general' | 'product' | 'technical' : 'general';
    return { type: 'ask_question', topic };
  }

  if (value.type === 'product_request') {
    return { type: 'product_request', criteria: sanitizeCriteria(value.criteria) };
  }

  if (value.type === 'request_sample') return { type: 'request_sample' };

  if (value.type === 'contact_human') {
    const reason = cleanText(value.reason, 120);
    return reason ? { type: 'contact_human', reason } : { type: 'contact_human' };
  }

  if (value.type === 'unknown') return { type: 'unknown' };
  return null;
}

export function normalizeAiInterpreterResponse(value: unknown): AiInterpreterResponse | null {
  if (!isObject(value)) return null;
  const reply = cleanText(value.reply, 190);
  if (!reply) return null;

  const seenAnswers = new Set<AnswerKey>();
  const seenSingletons = new Set<string>();
  const events = Array.isArray(value.events)
    ? value.events
        .map(sanitizeEvent)
        .filter((event): event is AiSemanticEvent => Boolean(event))
        .filter((event) => {
          if (event.type === 'answer') {
            if (seenAnswers.has(event.field)) return false;
            seenAnswers.add(event.field);
            return true;
          }
          if (seenSingletons.has(event.type)) return false;
          seenSingletons.add(event.type);
          return true;
        })
        .slice(0, 7)
    : [];

  return { reply, events: events.length ? events : [{ type: 'unknown' }] };
}
