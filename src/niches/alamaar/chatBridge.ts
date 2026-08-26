import { STEPS, choiceValue, type AnswerKey, type Answers, type WizardStep } from './experience';

export type ConversationRole = 'user' | 'assistant';

export type StructuredAnswer = {
  key: AnswerKey;
  value: string;
  label: string;
};

export type ConversationTurn = {
  id: string;
  role: ConversationRole;
  text: string;
  kind: 'freeform' | 'system';
  createdAt: number;
  stepIndex?: number;
  resolvedAnswer?: StructuredAnswer;
};

export type FreeformInterpretation = {
  intent: 'known-answer' | 'needs-ai';
  requiresAi: boolean;
  assistantText: string;
  answer?: StructuredAnswer;
  nextStepIndex?: number;
};

export type AiConversationRequest = {
  message: string;
  stepIndex: number;
  answers: Answers;
  currentStep: Pick<WizardStep, 'key' | 'title' | 'choices'> | null;
};

export type AiConversationResponse = {
  intent: 'answer' | 'question' | 'clarify';
  reply: string;
  answer?: StructuredAnswer;
  nextStepIndex?: number;
};

const ARABIC_DIACRITICS = /[\u0617-\u061A\u064B-\u0652]/g;
const PUNCTUATION = /[.,!?؟،:;؛()\[\]{}'"`~_\-\/\\]/g;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALIASES: Partial<Record<AnswerKey, Record<string, string[]>>> = {
  project: {
    kitchen: ['مطبخ', 'المطبخ', 'كيتشن', 'kitchen'],
    wardrobe: ['دريسنج', 'دواليب', 'دولاب', 'واردر وب', 'wardrobe'],
    furniture: ['اثاث', 'وحدات', 'فرنتشر', 'furniture'],
    office: ['مكتب', 'اوفيس', 'office'],
    retail: ['محل', 'محل تجاري', 'ريتيل', 'retail'],
    hospitality: ['فندق', 'مطعم', 'هوسبيتاليتي', 'hospitality'],
  },
  style: {
    'warm-wood': ['خشبي', 'خشبي دافئ', 'وود', 'warm wood'],
    'modern-dark': ['مودرن داكن', 'مودرن غامق', 'دارك', 'dark modern'],
    'modern-light': ['مودرن فاتح', 'فاتح مودرن', 'light modern'],
    classic: ['كلاسيك', 'classic'],
    scandi: ['سكاندنافي', 'سكندي', 'scandi'],
    statement: ['جريء', 'فخم', 'جريء فخم', 'statement'],
  },
  tone: {
    light: ['فاتح', 'لايت', 'light'],
    neutral: ['محايد', 'نيوترال', 'neutral'],
    wood: ['خشبي', 'وود', 'wood'],
    dark: ['داكن', 'غامق', 'دارك', 'dark'],
  },
  application: {
    worktop: ['سطح مطبخ', 'اسطح مطابخ', 'رخامه', 'ورك توب', 'worktop'],
    doors: ['واجهات دواليب', 'ابواب دواليب', 'درف', 'doors'],
    walls: ['حوائط', 'حائط', 'جدران', 'walls'],
    furniture: ['اثاث', 'وحدات', 'furniture'],
  },
};

function findKnownChoice(text: string, step: WizardStep): StructuredAnswer | null {
  const normalizedText = normalize(text);
  if (!normalizedText) return null;

  for (const choice of step.choices) {
    const value = choiceValue(choice);
    const candidates = [choice.label, choice.value, choice.microcopy ?? '', ...(ALIASES[step.key]?.[value] ?? [])]
      .map(normalize)
      .filter(Boolean);

    if (candidates.some((candidate) => normalizedText === candidate || normalizedText === `ال${candidate}`)) {
      return { key: step.key, value, label: choice.label };
    }
  }

  return null;
}

export function interpretFreeformLocally(message: string, stepIndex: number): FreeformInterpretation {
  const currentStep = STEPS[stepIndex];
  if (currentStep) {
    const answer = findKnownChoice(message, currentStep);
    if (answer) {
      return {
        intent: 'known-answer',
        requiresAi: false,
        answer,
        nextStepIndex: Math.min(stepIndex + 1, STEPS.length),
        assistantText: `تمام، حسبتها «${answer.label}».`,
      };
    }
  }

  return {
    intent: 'needs-ai',
    requiresAi: true,
    assistantText: currentStep
      ? 'وصلتني. هنفضل عند نفس السؤال دلوقتي.'
      : 'وصلتني. الترشيحات هتفضل زي ما هي دلوقتي.',
  };
}

export function buildAiConversationRequest(message: string, stepIndex: number, answers: Answers): AiConversationRequest {
  const currentStep = STEPS[stepIndex];
  return {
    message,
    stepIndex,
    answers,
    currentStep: currentStep
      ? { key: currentStep.key, title: currentStep.title, choices: currentStep.choices }
      : null,
  };
}
