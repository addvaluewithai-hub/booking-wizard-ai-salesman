import type { VisitorEvent } from '../observer/event-types';
import { summarizeMemoryForModel } from '../memory/summarize';
import type { SessionMemory } from '../memory/types';
import { SILENT_DECISION, type SalesmanDecision } from './types';

export type DecisionContext = {
  niche: 'homepage' | 'hpl' | 'yachts' | 'law-firms';
  verifiedFacts?: Record<string, unknown>;
  allowedActions?: string[];
};

function isDecision(value: unknown): value is SalesmanDecision {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SalesmanDecision>;
  return (
    (candidate.action === 'silent' || candidate.action === 'intervene') &&
    typeof candidate.internalReason === 'string' &&
    typeof candidate.confidence === 'number' &&
    typeof candidate.cooldownSeconds === 'number'
  );
}

export async function requestSalesmanDecision(
  memory: SessionMemory,
  event: VisitorEvent,
  context: DecisionContext,
  signal?: AbortSignal,
): Promise<SalesmanDecision> {
  try {
    const response = await fetch('/api/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal,
      body: JSON.stringify({
        niche: context.niche,
        memory: summarizeMemoryForModel(memory),
        signal: {
          type: event.type,
          page: event.page,
          entityId: event.entityId,
          metadata: event.metadata,
        },
        verifiedFacts: context.verifiedFacts ?? {},
        allowedActions: context.allowedActions ?? [],
      }),
    });

    if (!response.ok) return SILENT_DECISION;
    const payload = (await response.json()) as { decision?: unknown };
    return isDecision(payload.decision) ? payload.decision : SILENT_DECISION;
  } catch {
    return SILENT_DECISION;
  }
}
