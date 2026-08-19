import { useCallback, useEffect, useRef, useState } from 'react';
import { recordAnalyticsEvent } from '../../analytics/client';
import { assignExperimentVariant } from '../../analytics/experiment';
import { NICHE_CONFIGS, nicheFromPath, type NicheId } from '../../niches/config';
import { applyDecisionCooldown, DecisionScheduler } from '../decision/scheduler';
import type { SalesmanDecision } from '../decision/types';
import { reduceVisitorEvent } from '../memory/reducer';
import { loadSessionMemory, saveSessionMemory } from '../memory/session-store';
import type { SessionMemory } from '../memory/types';
import { createVisitorEvent, type VisitorEventInput } from '../observer/event-types';
import { createSalesObserver, type SalesObserver } from '../observer/observer';

export type SalesmanEngineOptions = {
  niche?: NicheId;
  verifiedFacts?: Record<string, unknown>;
  controlGroupPercent?: number;
};

export type ActiveIntervention = {
  id: string;
  decision: SalesmanDecision;
};

export function useSalesmanEngine(options: SalesmanEngineOptions = {}) {
  const niche = options.niche ?? nicheFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
  const config = NICHE_CONFIGS[niche];
  const [memory, setMemory] = useState<SessionMemory>(() => loadSessionMemory());
  const [intervention, setIntervention] = useState<ActiveIntervention | null>(null);
  const memoryRef = useRef(memory);
  const observerRef = useRef<SalesObserver | null>(null);
  const schedulerRef = useRef<DecisionScheduler | null>(null);
  const experimentVariant = assignExperimentVariant(memory.sessionId, options.controlGroupPercent ?? 0);
  const experimentVariantRef = useRef(experimentVariant);
  experimentVariantRef.current = experimentVariant;
  const contextRef = useRef({ niche, verifiedFacts: options.verifiedFacts ?? {}, allowedActions: config.allowedActions });

  contextRef.current = { niche, verifiedFacts: options.verifiedFacts ?? {}, allowedActions: config.allowedActions };

  const shouldAskScheduler = useCallback((eventType: string) => {
    return experimentVariantRef.current === 'treatment' || eventType === 'explicit_help';
  }, []);

  const commitEvent = useCallback((input: VisitorEventInput) => {
    const event = createVisitorEvent(input);
    const next = reduceVisitorEvent(memoryRef.current, event);
    memoryRef.current = next;
    setMemory(next);
    saveSessionMemory(next);
    recordAnalyticsEvent(event, next, niche, experimentVariantRef.current);
    return { event, memory: next };
  }, [niche]);

  useEffect(() => {
    const scheduler = new DecisionScheduler({
      onDecision: (decision, trigger) => {
        if (decision.action !== 'intervene' || !decision.message) return;

        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `i-${Date.now()}`;
        let nextMemory = applyDecisionCooldown(memoryRef.current, decision);
        const impression = createVisitorEvent({
          type: 'salesman_impression',
          page: trigger.page,
          entityId: id,
          metadata: { message: decision.message, reason: decision.internalReason },
        });
        nextMemory = reduceVisitorEvent(nextMemory, impression);
        memoryRef.current = nextMemory;
        setMemory(nextMemory);
        saveSessionMemory(nextMemory);
        recordAnalyticsEvent(impression, nextMemory, niche, experimentVariantRef.current);
        setIntervention({ id, decision });
      },
    });
    schedulerRef.current = scheduler;

    const observer = createSalesObserver({
      onEvent: (event) => {
        const next = reduceVisitorEvent(memoryRef.current, event);
        memoryRef.current = next;
        setMemory(next);
        saveSessionMemory(next);
        recordAnalyticsEvent(event, next, niche, experimentVariantRef.current);
        if (shouldAskScheduler(event.type)) scheduler.consider(next, event, contextRef.current);
      },
    });
    observerRef.current = observer;
    observer.start();

    return () => {
      observer.stop();
      scheduler.cancel();
      observerRef.current = null;
      schedulerRef.current = null;
    };
  }, [niche, shouldAskScheduler]);

  useEffect(() => {
    if (!intervention) return;
    const timer = window.setTimeout(() => {
      const current = memoryRef.current.salesman.history.at(-1);
      if (!current || current.id !== intervention.id || current.outcome !== 'shown') return;
      commitEvent({ type: 'salesman_ignore', page: memoryRef.current.currentPage, entityId: intervention.id });
      setIntervention(null);
    }, 14_000);
    return () => window.clearTimeout(timer);
  }, [intervention, commitEvent]);

  const emit = useCallback((input: VisitorEventInput) => {
    const result = commitEvent(input);
    if (shouldAskScheduler(result.event.type)) schedulerRef.current?.consider(result.memory, result.event, contextRef.current);
    return result;
  }, [commitEvent, shouldAskScheduler]);

  const dismiss = useCallback(() => {
    if (!intervention) return;
    commitEvent({ type: 'salesman_dismiss', page: memoryRef.current.currentPage, entityId: intervention.id });
    setIntervention(null);
  }, [commitEvent, intervention]);

  const engage = useCallback(() => {
    if (!intervention) return;
    commitEvent({ type: 'salesman_click', page: memoryRef.current.currentPage, entityId: intervention.id });
    commitEvent({ type: 'experience_open', page: memoryRef.current.currentPage, entityId: intervention.decision.experienceHint });
    setIntervention(null);
  }, [commitEvent, intervention]);

  const closeExperience = useCallback(() => {
    commitEvent({ type: 'experience_close', page: memoryRef.current.currentPage });
  }, [commitEvent]);

  const answer = useCallback((id: string, value: string | number | boolean | string[]) => {
    commitEvent({ type: 'experience_answer', page: memoryRef.current.currentPage, entityId: id, metadata: { value } });
  }, [commitEvent]);

  const completeExperience = useCallback((conversionType?: string) => {
    commitEvent({ type: 'experience_complete', page: memoryRef.current.currentPage, metadata: conversionType ? { conversionType } : undefined });
    if (conversionType) {
      const now = Date.now();
      const source = [...memoryRef.current.salesman.history].reverse().find((item) => item.outcome === 'clicked' && now - item.at <= 30 * 60_000);
      commitEvent({
        type: 'conversion',
        page: memoryRef.current.currentPage,
        entityId: conversionType,
        metadata: {
          conversionType,
          sourceInterventionId: source?.id ?? null,
          assisted: Boolean(source),
        },
      });
    }
  }, [commitEvent]);

  const askForHelp = useCallback(() => {
    emit({ type: 'explicit_help', page: memoryRef.current.currentPage });
  }, [emit]);

  return {
    memory,
    intervention,
    niche,
    config,
    experimentVariant,
    dismiss,
    engage,
    closeExperience,
    answer,
    completeExperience,
    askForHelp,
    emit,
  };
}
