import type { AlamaarProduct } from './catalog';
import type { Answers } from './experience';
import {
  normalizeAiConversationResponse,
  type AiConversationRequest,
  type AiConversationResponse,
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
  catalog,
}: {
  message: string;
  stepIndex: number;
  answers: Answers;
  history: ConversationTurn[];
  catalog: AlamaarProduct[];
}): AiConversationRequest {
  return {
    message: message.trim().slice(0, 700),
    stepIndex,
    answers,
    history: history
      .slice(-6)
      .map((turn) => ({ role: turn.role, text: turn.text.slice(0, 320) })),
    catalog: catalog.slice(0, 50).map(({ id, name, code, family, tone }) => ({ id, name, code, family, tone })),
  };
}

export async function requestAlamaarAiTurn(
  request: AiConversationRequest,
  catalog: AlamaarProduct[],
  signal?: AbortSignal,
): Promise<AiConversationResponse> {
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

  const turn = normalizeAiConversationResponse(body.turn, catalog, request.stepIndex);
  if (!turn) throw new AlamaarAiError('AI returned an invalid component contract.');
  return turn;
}
