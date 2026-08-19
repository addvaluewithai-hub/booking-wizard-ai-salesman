import type { SessionMemory } from './types';

function secondsSince(timestamp: number | undefined, now: number): number | null {
  if (!timestamp) return null;
  return Math.max(0, Math.round((now - timestamp) / 1000));
}

export function summarizeMemoryForModel(memory: SessionMemory, now = Date.now()) {
  const topEntities = Object.entries(memory.viewedEntities)
    .sort((a, b) => b[1].views - a[1].views || b[1].lastSeenAt - a[1].lastSeenAt)
    .slice(0, 8)
    .map(([id, value]) => ({ id, views: value.views }));

  const sections = Object.entries(memory.viewedSections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, views]) => ({ id, views }));

  return {
    sessionAgeSeconds: Math.max(0, Math.round((now - memory.startedAt) / 1000)),
    page: memory.currentPage,
    pages: memory.pageHistory.slice(-8).map(({ path, visits }) => ({ path, visits })),
    entities: topEntities,
    sections,
    compare: memory.comparisonIds.slice(0, 6),
    filters: Object.fromEntries(Object.entries(memory.selectedFilters).slice(-8)),
    inferred: memory.inferred,
    knownAnswers: memory.answers,
    interaction: {
      formActive: memory.formActive,
      experienceActive: memory.experienceActive,
      secondsSinceMeaningfulSignal: secondsSince(memory.lastMeaningfulSignalAt, now),
    },
    salesman: {
      shown: memory.salesman.interventionsShown,
      clicked: memory.salesman.interventionsClicked,
      ignored: memory.salesman.interventionsIgnored,
      dismissed: memory.salesman.interventionsDismissed,
      suppressionLevel: memory.salesman.suppressionLevel,
      secondsSinceAction: secondsSince(memory.salesman.lastActionAt, now),
      recentOutcomes: memory.salesman.history.slice(-4).map(({ message, outcome, reason }) => ({ message, outcome, reason })),
    },
  };
}

export function serializeMemoryForModel(memory: SessionMemory): string {
  return JSON.stringify(summarizeMemoryForModel(memory));
}
