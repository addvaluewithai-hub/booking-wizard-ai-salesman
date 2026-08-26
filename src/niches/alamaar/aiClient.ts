import type { Answers } from './experience';
import { STEPS, choiceValue } from './experience';
import {
  normalizeAiInterpreterResponse,
  type AiConversationRequest,
  type AiInterpreterResponse,
} from './aiContract';
import type { ConversationTurn } from './chatBridge';

export class AlamaarAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlamaarAiError';
  }
}

export function buildAlamaarAiRequest({
  message,
  stepIndex,
  answers,
  history,
}: {
  message: string;
  stepIndex: number;
  answers: Answers;
  history: ConversationTurn[];
}): AiConversationRequest {
  const step = STEPS[stepIndex];
  return {
    message: message.trim().slice(0, 700),
    stepIndex,
    answers,
    currentStep: step
      ? {
          key: step.key,
          title: step.title,
          options: step.choices.map((choice) => ({ value: choiceValue(choice), label: choice.label })),
        }
      : null,
    history: history
      .slice(-6)
      .map((turn) => ({ role: turn.role, text: turn.text.slice(0, 320) })),
  };
}

export async function requestAlamaarAiTurn(
  request: AiConversationRequest,
  signal?: AbortSignal,
): Promise<AiInterpreterResponse> {
  const response = await fetch('/api/alamaar-chat', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(request),
  });

  const body = await response.json().catch(() => null) as { ok?: boolean; turn?: unknown; error?: string } | null;
  if (!response.ok || !body?.ok) {
    throw new AlamaarAiError(body?.error || `AI request failed (${response.status})`);
  }

  const turn = normalizeAiInterpreterResponse(body.turn);
  if (!turn) throw new AlamaarAiError('AI returned an invalid semantic event contract.');
  return turn;
}
