import type { AlamaarProduct } from './catalog';
import { STEPS, choiceValue, rankProducts, scoreProduct, type AnswerKey, type Answers } from './experience';
import type { AiInterpreterResponse, ProductCriteria } from './aiContract';

export type ConversationActionId = 'sample' | 'whatsapp' | 'shop';

export type ConversationEffect =
  | { type: 'guided_candidates'; stepKey: AnswerKey; optionIds: string[] }
  | { type: 'product_results'; productIds: string[] }
  | { type: 'actions'; actionIds: ConversationActionId[] };

export type EngineResolution = {
  answers: Answers;
  nextStepIndex: number;
  effects: ConversationEffect[];
  resolvedCurrentAnswer?: { key: AnswerKey; value: string; label: string };
  didUpdateAnswers: boolean;
};

function firstUnansweredStep(answers: Answers) {
  const index = STEPS.findIndex((step) => !answers[step.key]);
  return index === -1 ? STEPS.length : index;
}

function canonicalAnswer(field: AnswerKey, value: string) {
  const step = STEPS.find((item) => item.key === field);
  const choice = step?.choices.find((item) => choiceValue(item) === value);
  if (!step || !choice) return null;
  return { key: step.key, value: choiceValue(choice), label: choice.label };
}

function pickProducts(catalog: AlamaarProduct[], answers: Answers, criteria: ProductCriteria) {
  const queryAnswers: Answers = { ...answers };
  if (criteria.tone) queryAnswers.tone = criteria.tone;
  if (criteria.style) queryAnswers.style = criteria.style;

  let pool = [...catalog];
  if (criteria.family) pool = pool.filter((product) => product.family === criteria.family);
  if (criteria.tone) pool = pool.filter((product) => product.tone === criteria.tone);

  if (!pool.length) pool = [...catalog];

  return [...pool]
    .map((product, index) => ({ product, index, score: scoreProduct(product, queryAnswers) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ product }) => product.id);
}

function addAction(actions: ConversationActionId[], action: ConversationActionId) {
  if (!actions.includes(action)) actions.push(action);
}

export function reduceSemanticEvents({
  response,
  answers,
  stepIndex,
  catalog,
}: {
  response: AiInterpreterResponse;
  answers: Answers;
  stepIndex: number;
  catalog: AlamaarProduct[];
}): EngineResolution {
  const nextAnswers: Answers = { ...answers };
  const currentStep = STEPS[stepIndex];
  const effects: ConversationEffect[] = [];
  const actionIds: ConversationActionId[] = [];
  let didUpdateAnswers = false;
  let resolvedCurrentAnswer: EngineResolution['resolvedCurrentAnswer'];

  for (const event of response.events) {
    if (event.type === 'answer') {
      const answer = canonicalAnswer(event.field, event.value);
      if (!answer) continue;
      if (nextAnswers[answer.key] !== answer.value) didUpdateAnswers = true;
      nextAnswers[answer.key] = answer.value;
      if (currentStep?.key === answer.key) resolvedCurrentAnswer = answer;
      continue;
    }

    if (event.type === 'clarify_current_question' && currentStep) {
      const allowed = new Set(currentStep.choices.map(choiceValue));
      const candidates = event.candidates
        .filter((candidate) => candidate.field === currentStep.key && allowed.has(candidate.value))
        .map((candidate) => candidate.value)
        .filter((value, index, all) => all.indexOf(value) === index);
      if (candidates.length >= 2 && candidates.length < currentStep.choices.length) {
        effects.push({ type: 'guided_candidates', stepKey: currentStep.key, optionIds: candidates });
      }
      continue;
    }

    if (event.type === 'product_request') {
      const productIds = pickProducts(catalog, nextAnswers, event.criteria);
      if (productIds.length) effects.push({ type: 'product_results', productIds });
      else addAction(actionIds, 'shop');
      continue;
    }

    if (event.type === 'request_sample') {
      addAction(actionIds, 'sample');
      continue;
    }

    if (event.type === 'contact_human') {
      addAction(actionIds, 'whatsapp');
      continue;
    }

    if (event.type === 'ask_question' && event.topic === 'technical') {
      addAction(actionIds, 'whatsapp');
    }
  }

  if (actionIds.length) effects.push({ type: 'actions', actionIds });

  const nextStepIndex = didUpdateAnswers ? firstUnansweredStep(nextAnswers) : stepIndex;
  return { answers: nextAnswers, nextStepIndex, effects, resolvedCurrentAnswer, didUpdateAnswers };
}

export function defaultRecommendations(catalog: AlamaarProduct[], answers: Answers) {
  return rankProducts(catalog, answers, 3);
}
