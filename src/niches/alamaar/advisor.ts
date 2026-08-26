import { STEPS, type Answers } from './experience';

export type AdvisorMoment = 'after-style' | 'after-tone';

export type AdvisorLeadRequest = {
  moment: AdvisorMoment;
  answers: Answers;
  nextStep: null | { key: string; title: string };
};

export function advisorMomentForNextStep(nextStepIndex: number, answers: Answers): AdvisorMoment | null {
  if (nextStepIndex === 2 && answers.project && answers.style) return 'after-style';
  if (nextStepIndex === 3 && answers.project && answers.style && answers.tone) return 'after-tone';
  return null;
}

export function buildAlamaarAdvisorRequest({
  moment,
  answers,
  nextStepIndex,
}: {
  moment: AdvisorMoment;
  answers: Answers;
  nextStepIndex: number;
}): AdvisorLeadRequest {
  const step = STEPS[nextStepIndex];
  return {
    moment,
    answers,
    nextStep: step ? { key: step.key, title: step.title } : null,
  };
}

export async function requestAlamaarAdvisorLead(
  request: AdvisorLeadRequest,
  signal?: AbortSignal,
): Promise<string | null> {
  const response = await fetch('/api/alamaar-advice', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(request),
  });

  const body = await response.json().catch(() => null) as { ok?: boolean; advice?: { reply?: unknown } | null } | null;
  if (!response.ok || !body?.ok || !body.advice || typeof body.advice.reply !== 'string') return null;
  const reply = body.advice.reply.trim().slice(0, 140);
  return reply || null;
}
