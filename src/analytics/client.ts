import type { NicheId } from '../niches/config';
import type { SessionMemory } from '../salesman/memory/types';
import type { VisitorEvent } from '../salesman/observer/event-types';
import type { ExperimentVariant } from './experiment';

type AnalyticsEvent = {
  id: string;
  sessionId: string;
  at: number;
  niche: NicheId;
  type: string;
  page: string;
  entityId?: string;
  stage: string;
  suppressionLevel: number;
  experimentVariant: ExperimentVariant;
  conversionKind?: string;
  sourceInterventionId?: string;
  assisted?: boolean;
};

const queue: AnalyticsEvent[] = [];
let timer: number | null = null;
let flushing = false;

function scheduleFlush() {
  if (typeof window === 'undefined' || timer !== null) return;
  timer = window.setTimeout(() => {
    timer = null;
    void flushAnalytics();
  }, 4_000);
}

function metadataString(event: VisitorEvent, key: string) {
  const value = event.metadata?.[key];
  return typeof value === 'string' ? value.slice(0, 100) : undefined;
}

export function recordAnalyticsEvent(event: VisitorEvent, memory: SessionMemory, niche: NicheId, experimentVariant: ExperimentVariant = 'treatment') {
  const isConversion = event.type === 'conversion';
  const sourceInterventionId = isConversion ? metadataString(event, 'sourceInterventionId') : undefined;
  queue.push({
    id: event.id,
    sessionId: memory.sessionId,
    at: event.at,
    niche,
    type: event.type,
    page: event.page.slice(0, 180),
    entityId: event.entityId?.slice(0, 120),
    stage: memory.inferred.stage,
    suppressionLevel: memory.salesman.suppressionLevel,
    experimentVariant,
    conversionKind: isConversion ? (metadataString(event, 'conversionType') ?? event.entityId?.slice(0, 100)) : undefined,
    sourceInterventionId,
    assisted: isConversion ? Boolean(event.metadata?.assisted === true && sourceInterventionId) : undefined,
  });
  if (queue.length >= 8) void flushAnalytics();
  else scheduleFlush();
}

export async function flushAnalytics() {
  if (flushing || !queue.length || typeof window === 'undefined') return;
  flushing = true;
  const events = queue.splice(0, 20);
  try {
    const body = JSON.stringify({ events });
    if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
      const accepted = navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      if (!accepted) queue.unshift(...events);
    } else {
      const response = await fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      });
      if (!response.ok && response.status >= 500) queue.unshift(...events);
    }
  } catch {
    queue.unshift(...events);
  } finally {
    flushing = false;
    if (queue.length) scheduleFlush();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { void flushAnalytics(); });
}
