import type { ExperimentVariant } from './experiment';
import type { SessionMemory } from '../salesman/memory/types';

export type SessionMetrics = {
  variant: ExperimentVariant;
  stage: SessionMemory['inferred']['stage'];
  interventionsShown: number;
  interventionsClicked: number;
  interventionsIgnored: number;
  interventionsDismissed: number;
  clickThroughRate: number;
  negativeSignalRate: number;
  suppressionLevel: number;
  experienceActive: boolean;
};

export function deriveSessionMetrics(memory: SessionMemory, variant: ExperimentVariant): SessionMetrics {
  const shown = memory.salesman.interventionsShown;
  const negative = memory.salesman.interventionsIgnored + memory.salesman.interventionsDismissed;
  return {
    variant,
    stage: memory.inferred.stage,
    interventionsShown: shown,
    interventionsClicked: memory.salesman.interventionsClicked,
    interventionsIgnored: memory.salesman.interventionsIgnored,
    interventionsDismissed: memory.salesman.interventionsDismissed,
    clickThroughRate: shown ? memory.salesman.interventionsClicked / shown : 0,
    negativeSignalRate: shown ? negative / shown : 0,
    suppressionLevel: memory.salesman.suppressionLevel,
    experienceActive: memory.experienceActive,
  };
}
