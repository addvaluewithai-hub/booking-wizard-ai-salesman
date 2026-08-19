export type ExperimentVariant = 'control' | 'treatment';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function assignExperimentVariant(sessionId: string, controlPercent = 10): ExperimentVariant {
  const boundedControl = Math.max(0, Math.min(50, Math.round(controlPercent)));
  if (boundedControl === 0) return 'treatment';
  return stableHash(sessionId) % 100 < boundedControl ? 'control' : 'treatment';
}
