import { createInitialMemory } from './reducer';
import type { SessionMemory } from './types';

const SESSION_ID_KEY = 'ai-salesman:session-id';
const MEMORY_KEY = 'ai-salesman:memory-v1';

function randomSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof sessionStorage === 'undefined') return randomSessionId();
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const next = randomSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return randomSessionId();
  }
}

function isSessionMemory(value: unknown): value is SessionMemory {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SessionMemory>;
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.startedAt === 'number' &&
    typeof candidate.currentPage === 'string' &&
    Boolean(candidate.salesman && typeof candidate.salesman === 'object')
  );
}

export function loadSessionMemory(page = typeof window !== 'undefined' ? window.location.pathname : '/', locale = typeof navigator !== 'undefined' ? navigator.language : 'en'): SessionMemory {
  const sessionId = getOrCreateSessionId();
  if (typeof sessionStorage === 'undefined') return createInitialMemory(sessionId, page, locale);

  try {
    const parsed = JSON.parse(sessionStorage.getItem(MEMORY_KEY) ?? 'null');
    if (isSessionMemory(parsed) && parsed.sessionId === sessionId) {
      return {
        ...parsed,
        currentPage: page,
        locale: parsed.locale || locale,
        formActive: false,
        experienceActive: false,
      };
    }
  } catch {
    // Corrupt/blocked session storage should never break the host page.
  }

  return createInitialMemory(sessionId, page, locale);
}

export function saveSessionMemory(memory: SessionMemory): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const compact: SessionMemory = {
      ...memory,
      pageHistory: memory.pageHistory.slice(-20),
      viewedEntities: Object.fromEntries(Object.entries(memory.viewedEntities).slice(-60)),
      viewedSections: Object.fromEntries(Object.entries(memory.viewedSections).slice(-40)),
      comparisonIds: memory.comparisonIds.slice(-8),
      selectedFilters: Object.fromEntries(Object.entries(memory.selectedFilters).slice(-20)),
      answers: Object.fromEntries(Object.entries(memory.answers).slice(-30)),
      recentEventTypes: memory.recentEventTypes.slice(-12),
      salesman: { ...memory.salesman, history: memory.salesman.history.slice(-8) },
    };
    sessionStorage.setItem(MEMORY_KEY, JSON.stringify(compact));
  } catch {
    // Memory is progressive enhancement; silently remain in-memory.
  }
}

export function clearSessionMemory(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(MEMORY_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // No-op.
  }
}
