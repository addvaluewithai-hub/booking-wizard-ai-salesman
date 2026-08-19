import type { VisitorEvent } from '../observer/event-types';
import type { ConversionStage, SessionMemory, SuppressionLevel } from './types';

const HIGH_INTENT_EVENTS = new Set(['cta_click', 'form_start', 'booking_start', 'explicit_help']);
const CONSIDERATION_EVENTS = new Set(['product_revisit', 'compare_add', 'price_view', 'spec_view', 'filter_change', 'entity_dwell']);

export function createInitialMemory(sessionId: string, page = '/', locale = 'en'): SessionMemory {
  const now = Date.now();
  return {
    sessionId,
    startedAt: now,
    updatedAt: now,
    locale,
    currentPage: page,
    pageHistory: [],
    viewedEntities: {},
    viewedSections: {},
    comparisonIds: [],
    selectedFilters: {},
    inferred: {
      stage: 'unknown',
      priceSensitivity: 'unknown',
      confidence: 0,
    },
    answers: {},
    formActive: false,
    experienceActive: false,
    recentEventTypes: [],
    salesman: {
      interventionsShown: 0,
      interventionsClicked: 0,
      interventionsIgnored: 0,
      interventionsDismissed: 0,
      suppressionLevel: 0,
      history: [],
    },
  };
}

function clampSuppression(value: number): SuppressionLevel {
  return Math.max(0, Math.min(3, value)) as SuppressionLevel;
}

function inferStage(memory: SessionMemory, event: VisitorEvent): ConversionStage {
  if (event.type === 'conversion' || event.type === 'experience_complete') return 'converting';
  if (HIGH_INTENT_EVENTS.has(event.type)) return 'high-intent';
  if (CONSIDERATION_EVENTS.has(event.type)) return 'considering';
  if (memory.pageHistory.length > 1 || Object.keys(memory.viewedEntities).length > 0) return 'exploring';
  return memory.inferred.stage === 'unknown' ? 'exploring' : memory.inferred.stage;
}

function inferIntent(memory: SessionMemory, event: VisitorEvent): string | undefined {
  const page = event.page.toLowerCase();
  if (page.startsWith('/hpl')) {
    if (memory.viewedSections.kitchen || memory.answers.application === 'kitchen') return 'choose_hpl_for_kitchen';
    return 'choose_decorative_material';
  }
  if (page.startsWith('/yachts')) return 'choose_yacht_charter';
  if (page.startsWith('/law-firms')) return 'find_legal_consultation_path';
  if (page === '/' || page.startsWith('/#')) return 'evaluate_ai_salesman';
  return memory.inferred.intent;
}

function inferHesitation(memory: SessionMemory, event: VisitorEvent): string | undefined {
  if (event.type === 'booking_abandon' || event.type === 'form_abandon') return 'funnel_abandonment';
  if (event.type === 'price_view' && memory.recentEventTypes.includes('price_view')) return 'price_recheck';
  if (event.type === 'product_revisit') return 'repeated_product_consideration';
  if (memory.comparisonIds.length >= 2) return 'active_comparison';
  return memory.inferred.hesitation;
}

export function reduceVisitorEvent(previous: SessionMemory, event: VisitorEvent): SessionMemory {
  const memory: SessionMemory = {
    ...previous,
    updatedAt: event.at,
    currentPage: event.page,
    pageHistory: [...previous.pageHistory],
    viewedEntities: { ...previous.viewedEntities },
    viewedSections: { ...previous.viewedSections },
    comparisonIds: [...previous.comparisonIds],
    selectedFilters: Object.fromEntries(Object.entries(previous.selectedFilters).map(([key, values]) => [key, [...values]])),
    inferred: { ...previous.inferred },
    answers: { ...previous.answers },
    recentEventTypes: [...previous.recentEventTypes, event.type].slice(-12),
    salesman: {
      ...previous.salesman,
      history: [...previous.salesman.history],
    },
  };

  if (event.type === 'page_view') {
    const existing = memory.pageHistory.find((entry) => entry.path === event.page);
    if (existing) {
      existing.visits += 1;
      existing.lastSeenAt = event.at;
    } else {
      memory.pageHistory.push({ path: event.page, visits: 1, lastSeenAt: event.at });
    }
  }

  if ((event.type === 'product_view' || event.type === 'product_revisit') && event.entityId) {
    const existing = memory.viewedEntities[event.entityId] ?? { views: 0, totalDwellMs: 0, lastSeenAt: event.at };
    memory.viewedEntities[event.entityId] = {
      ...existing,
      views: existing.views + 1,
      lastSeenAt: event.at,
    };
  }

  if (event.type === 'entity_dwell' && event.entityId) {
    const dwellMs = typeof event.metadata?.dwellMs === 'number' && Number.isFinite(event.metadata.dwellMs)
      ? Math.max(0, Math.min(120_000, Math.round(event.metadata.dwellMs)))
      : 0;
    if (dwellMs) {
      const existing = memory.viewedEntities[event.entityId] ?? { views: 0, totalDwellMs: 0, lastSeenAt: event.at };
      memory.viewedEntities[event.entityId] = {
        ...existing,
        totalDwellMs: Math.min(600_000, existing.totalDwellMs + dwellMs),
        lastSeenAt: Math.max(existing.lastSeenAt, event.at),
      };
    }
  }

  if (event.type === 'section_view' && event.entityId) {
    memory.viewedSections[event.entityId] = (memory.viewedSections[event.entityId] ?? 0) + 1;
  }

  if (event.type === 'compare_add' && event.entityId && !memory.comparisonIds.includes(event.entityId)) {
    memory.comparisonIds.push(event.entityId);
  }

  if (event.type === 'compare_remove' && event.entityId) {
    memory.comparisonIds = memory.comparisonIds.filter((id) => id !== event.entityId);
  }

  if (event.type === 'filter_change' && event.entityId) {
    const value = event.metadata?.value;
    if (typeof value === 'string' && value) {
      const values = memory.selectedFilters[event.entityId] ?? [];
      memory.selectedFilters[event.entityId] = [...new Set([...values, value])].slice(-8);
    }
  }

  if (event.type === 'experience_answer' && event.entityId) {
    const value = event.metadata?.value;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    ) {
      memory.answers[event.entityId] = Array.isArray(value) ? [...value].slice(0, 12) : value;
    }
  }

  if (event.type === 'form_start' || event.type === 'booking_start') memory.formActive = true;
  if (event.type === 'form_abandon' || event.type === 'booking_abandon' || event.type === 'conversion') memory.formActive = false;
  if (event.type === 'experience_open') memory.experienceActive = true;
  if (event.type === 'experience_close' || event.type === 'experience_complete' || event.type === 'conversion') memory.experienceActive = false;

  if (event.type === 'salesman_impression') {
    const message = typeof event.metadata?.message === 'string' ? event.metadata.message : '';
    const reason = typeof event.metadata?.reason === 'string' ? event.metadata.reason : undefined;
    memory.salesman.interventionsShown += 1;
    memory.salesman.lastMessage = message || memory.salesman.lastMessage;
    memory.salesman.lastReason = reason;
    memory.salesman.lastActionAt = event.at;
    memory.salesman.history.push({ id: event.entityId ?? event.id, at: event.at, message, reason, outcome: 'shown' });
  }

  const updateLatestOutcome = (outcome: 'clicked' | 'ignored' | 'dismissed') => {
    const last = memory.salesman.history.at(-1);
    if (last) last.outcome = outcome;
  };

  if (event.type === 'salesman_click') {
    memory.salesman.interventionsClicked += 1;
    memory.salesman.lastActionAt = event.at;
    updateLatestOutcome('clicked');
  }

  if (event.type === 'salesman_ignore') {
    memory.salesman.interventionsIgnored += 1;
    memory.salesman.lastActionAt = event.at;
    memory.salesman.suppressionLevel = clampSuppression(memory.salesman.interventionsIgnored + memory.salesman.interventionsDismissed >= 2 ? 2 : 1);
    updateLatestOutcome('ignored');
  }

  if (event.type === 'salesman_dismiss') {
    memory.salesman.interventionsDismissed += 1;
    memory.salesman.lastActionAt = event.at;
    const negativeResponses = memory.salesman.interventionsIgnored + memory.salesman.interventionsDismissed;
    memory.salesman.suppressionLevel = clampSuppression(negativeResponses >= 3 ? 3 : negativeResponses >= 2 ? 2 : 1);
    updateLatestOutcome('dismissed');
  }

  if (!['page_view', 'section_view', 'cta_view'].includes(event.type)) memory.lastMeaningfulSignalAt = event.at;

  memory.salesman.history = memory.salesman.history.slice(-8);
  memory.inferred.stage = inferStage(memory, event);
  memory.inferred.intent = inferIntent(memory, event);
  memory.inferred.hesitation = inferHesitation(memory, event);
  memory.inferred.confidence = Math.min(1, 0.18 + memory.pageHistory.length * 0.08 + Object.keys(memory.viewedEntities).length * 0.07 + memory.comparisonIds.length * 0.12);

  if (event.type === 'price_view') {
    const priceViews = memory.recentEventTypes.filter((type) => type === 'price_view').length;
    memory.inferred.priceSensitivity = priceViews >= 2 ? 'high' : 'medium';
  }

  return memory;
}

export function reduceVisitorEvents(initial: SessionMemory, events: VisitorEvent[]): SessionMemory {
  return events.reduce(reduceVisitorEvent, initial);
}
