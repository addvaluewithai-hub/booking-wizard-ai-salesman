import type { VisitorEvent } from '../observer/event-types';
import type { SessionMemory } from '../memory/types';
import { requestSalesmanDecision, type DecisionContext } from './client';
import { shouldConsiderDecision, validateDecision } from './guardrails';
import type { SalesmanDecision } from './types';

export type DecisionSchedulerOptions = {
  minimumCallIntervalMs?: number;
  debounceMs?: number;
  onDecision: (decision: SalesmanDecision, event: VisitorEvent) => void;
};

export class DecisionScheduler {
  private lastCallAt = 0;
  private timer: number | null = null;
  private controller: AbortController | null = null;
  private readonly minimumCallIntervalMs: number;
  private readonly debounceMs: number;
  private readonly onDecision: DecisionSchedulerOptions['onDecision'];

  constructor(options: DecisionSchedulerOptions) {
    this.minimumCallIntervalMs = options.minimumCallIntervalMs ?? 14_000;
    this.debounceMs = options.debounceMs ?? 850;
    this.onDecision = options.onDecision;
  }

  consider(memory: SessionMemory, event: VisitorEvent, context: DecisionContext) {
    const now = Date.now();
    if (!shouldConsiderDecision(memory, event, now)) return;

    const delayForInterval = Math.max(0, this.lastCallAt + this.minimumCallIntervalMs - now);
    const delay = Math.max(this.debounceMs, delayForInterval);

    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(async () => {
      this.timer = null;
      this.controller?.abort();
      this.controller = new AbortController();
      this.lastCallAt = Date.now();

      const raw = await requestSalesmanDecision(memory, event, context, this.controller.signal);
      const decision = validateDecision(raw, memory, event);
      this.onDecision(decision, event);
    }, delay);
  }

  cancel() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.controller?.abort();
    this.controller = null;
  }
}

export function applyDecisionCooldown(memory: SessionMemory, decision: SalesmanDecision, now = Date.now()): SessionMemory {
  return {
    ...memory,
    salesman: {
      ...memory.salesman,
      cooldownUntil: now + Math.max(20, decision.cooldownSeconds) * 1000,
    },
  };
}
