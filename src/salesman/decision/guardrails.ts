import { hasProhibitedSalesClaim, isLawRoutingCopySafe } from '../../../functions/_shared/niche-safety.js';
import type { VisitorEvent } from '../observer/event-types';
import type { SessionMemory } from '../memory/types';
import { SILENT_DECISION, type SalesmanDecision } from './types';

const STRONG_SIGNAL_TYPES = new Set([
  'product_revisit',
  'compare_add',
  'form_abandon',
  'booking_abandon',
  'explicit_help',
  'price_view',
  'spec_view',
]);

const MAX_PROACTIVE_INTERVENTIONS = 3;

export function normalizeIdea(text: string): string[] {
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'you', 'your', 'this', 'that', 'it', 'is', 'are', 'i', 'we', 'want', 'can']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stop.has(word));
}

export function ideaSimilarity(a: string, b: string): number {
  const aWords = new Set(normalizeIdea(a));
  const bWords = new Set(normalizeIdea(b));
  if (!aWords.size || !bWords.size) return 0;
  const overlap = [...aWords].filter((word) => bWords.has(word)).length;
  return overlap / Math.max(aWords.size, bWords.size);
}

export function shouldConsiderDecision(memory: SessionMemory, event: VisitorEvent, now = Date.now()): boolean {
  if (memory.inferred.stage === 'converting') return event.type === 'explicit_help';
  if (memory.experienceActive || memory.formActive) return event.type === 'explicit_help';
  if (memory.salesman.suppressionLevel >= 3 && event.type !== 'explicit_help') return false;
  if (memory.salesman.interventionsShown >= MAX_PROACTIVE_INTERVENTIONS && event.type !== 'explicit_help') return false;
  if (memory.salesman.cooldownUntil && now < memory.salesman.cooldownUntil && event.type !== 'explicit_help') return false;

  if (event.type === 'explicit_help') return true;
  if (!STRONG_SIGNAL_TYPES.has(event.type)) return false;

  if (memory.salesman.suppressionLevel === 2) {
    return ['booking_abandon', 'form_abandon', 'explicit_help'].includes(event.type) || (event.type === 'product_revisit' && memory.comparisonIds.length >= 2);
  }

  if (memory.salesman.suppressionLevel === 1) {
    return ['booking_abandon', 'form_abandon', 'explicit_help', 'compare_add', 'product_revisit'].includes(event.type);
  }

  return true;
}

export function validateDecision(decision: SalesmanDecision, memory: SessionMemory, event: VisitorEvent, now = Date.now()): SalesmanDecision {
  if (decision.action === 'silent') {
    return {
      ...SILENT_DECISION,
      internalReason: decision.internalReason || SILENT_DECISION.internalReason,
      confidence: Math.max(0, Math.min(1, decision.confidence || 0)),
      cooldownSeconds: Math.max(20, Math.min(300, decision.cooldownSeconds || 45)),
      diagnostics: decision.diagnostics,
    };
  }

  if (!shouldConsiderDecision(memory, event, now)) return SILENT_DECISION;

  const message = decision.message?.trim();
  if (!message || message.length > 180) return SILENT_DECISION;
  if (hasProhibitedSalesClaim(message)) return SILENT_DECISION;

  const recentMessages = memory.salesman.history.slice(-4).map((item) => item.message).filter(Boolean);
  if (recentMessages.some((previous) => ideaSimilarity(previous, message) >= 0.62)) return SILENT_DECISION;

  if (memory.currentPage.startsWith('/law-firms') && !isLawRoutingCopySafe(message)) return SILENT_DECISION;

  return {
    action: 'intervene',
    message: message.slice(0, 180),
    internalReason: decision.internalReason.slice(0, 240),
    confidence: Math.max(0, Math.min(1, decision.confidence)),
    cooldownSeconds: Math.max(45, Math.min(300, decision.cooldownSeconds || 75)),
    experienceHint: decision.experienceHint?.slice(0, 80),
    diagnostics: decision.diagnostics,
  };
}
