import type { AlamaarProduct } from './catalog';
import { STEPS, choiceValue, type AnswerKey, type Answers } from './experience';

export type AiActionId = 'sample' | 'whatsapp' | 'shop';

export type AiUiBlock =
  | {
      type: 'flow_choices';
      data: {
        stepKey: AnswerKey;
        optionIds: string[];
      };
    }
  | {
      type: 'suggestions';
      data: {
        items: Array<{ id: string; label: string; value: string }>;
      };
    }
  | {
      type: 'products';
      data: {
        productIds: string[];
      };
    }
  | {
      type: 'actions';
      data: {
        actionIds: AiActionId[];
      };
    };

export type AiStructuredAnswer = {
  key: AnswerKey;
  value: string;
  label: string;
};

export type AiConversationResponse = {
  intent: 'answer' | 'question' | 'clarify' | 'recommend';
  reply: string;
  updates: AiStructuredAnswer[];
  ui: AiUiBlock[];
};

export type AiConversationRequest = {
  message: string;
  stepIndex: number;
  answers: Answers;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  catalog: Array<Pick<AlamaarProduct, 'id' | 'name' | 'code' | 'family' | 'tone'>>;
};

const INTENTS = new Set<AiConversationResponse['intent']>(['answer', 'question', 'clarify', 'recommend']);
const ACTION_IDS = new Set<AiActionId>(['sample', 'whatsapp', 'shop']);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function canonicalAnswer(key: unknown, value: unknown): AiStructuredAnswer | null {
  if (typeof key !== 'string' || typeof value !== 'string') return null;
  const step = STEPS.find((item) => item.key === key);
  if (!step) return null;
  const choice = step.choices.find((item) => choiceValue(item) === value);
  if (!choice) return null;
  return { key: step.key, value: choiceValue(choice), label: choice.label };
}

function sanitizeUiBlock(raw: unknown, catalogIds: Set<string>): AiUiBlock | null {
  if (!isObject(raw) || typeof raw.type !== 'string' || !isObject(raw.data)) return null;

  if (raw.type === 'flow_choices') {
    const stepKey = cleanText(raw.data.stepKey, 32) as AnswerKey;
    const step = STEPS.find((item) => item.key === stepKey);
    if (!step) return null;
    const allowed = new Set(step.choices.map(choiceValue));
    const optionIds = Array.isArray(raw.data.optionIds)
      ? raw.data.optionIds.filter((item): item is string => typeof item === 'string' && allowed.has(item)).slice(0, 6)
      : [];
    if (!optionIds.length) return null;
    return { type: 'flow_choices', data: { stepKey, optionIds: [...new Set(optionIds)] } };
  }

  if (raw.type === 'suggestions') {
    const source = Array.isArray(raw.data.items) ? raw.data.items : [];
    const items = source
      .map((item, index) => {
        if (!isObject(item)) return null;
        const label = cleanText(item.label, 44);
        const value = cleanText(item.value, 80);
        if (!label || !value) return null;
        return { id: cleanText(item.id, 36) || `suggestion-${index}`, label, value };
      })
      .filter((item): item is { id: string; label: string; value: string } => Boolean(item))
      .slice(0, 4);
    if (!items.length) return null;
    return { type: 'suggestions', data: { items } };
  }

  if (raw.type === 'products') {
    const productIds = Array.isArray(raw.data.productIds)
      ? raw.data.productIds.filter((item): item is string => typeof item === 'string' && catalogIds.has(item)).slice(0, 3)
      : [];
    if (!productIds.length) return null;
    return { type: 'products', data: { productIds: [...new Set(productIds)] } };
  }

  if (raw.type === 'actions') {
    const actionIds = Array.isArray(raw.data.actionIds)
      ? raw.data.actionIds.filter((item): item is AiActionId => typeof item === 'string' && ACTION_IDS.has(item as AiActionId)).slice(0, 3)
      : [];
    if (!actionIds.length) return null;
    return { type: 'actions', data: { actionIds: [...new Set(actionIds)] } };
  }

  return null;
}

export function normalizeAiConversationResponse(value: unknown, catalog: AlamaarProduct[]): AiConversationResponse | null {
  if (!isObject(value)) return null;
  const intent = typeof value.intent === 'string' && INTENTS.has(value.intent as AiConversationResponse['intent'])
    ? value.intent as AiConversationResponse['intent']
    : null;
  const reply = cleanText(value.reply, 280);
  if (!intent || !reply) return null;

  const updates = Array.isArray(value.updates)
    ? value.updates
        .map((item) => isObject(item) ? canonicalAnswer(item.key, item.value) : null)
        .filter((item): item is AiStructuredAnswer => Boolean(item))
        .filter((item, index, all) => all.findIndex((other) => other.key === item.key) === index)
        .slice(0, STEPS.length)
    : [];

  const catalogIds = new Set(catalog.map((product) => product.id));
  const ui = Array.isArray(value.ui)
    ? value.ui
        .map((block) => sanitizeUiBlock(block, catalogIds))
        .filter((block): block is AiUiBlock => Boolean(block))
        .slice(0, 3)
    : [];

  return { intent, reply, updates, ui };
}
