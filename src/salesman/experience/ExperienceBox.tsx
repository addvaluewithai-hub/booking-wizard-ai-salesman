import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Sheet, Skeleton } from '../../design-system';
import { NICHE_CONFIGS, type NicheId } from '../../niches/config';
import { summarizeMemoryForModel } from '../memory/summarize';
import type { SessionMemory } from '../memory/types';
import { requestExperiencePlan } from './client';
import { buildFallbackExperiencePlan } from './fallback';
import { ExperienceRenderer } from './ExperienceRenderer';
import type { ExperienceAnswer, ExperienceComponent, ExperienceContact, ExperienceEntity, ExperiencePlan, ExperienceUploadHandler } from './types';
import type { ConversionPayload } from './components/ConversionComponents';
import './experience.css';

const ALLOWED_BY_NICHE: Record<NicheId, ExperienceComponent['type'][]> = {
  homepage: ['single_select', 'multi_select', 'yes_no', 'summary', 'lead_capture', 'faq'],
  hpl: ['single_select', 'multi_select', 'yes_no', 'image_choice', 'product_cards', 'comparison', 'recommendation_reason', 'sample_request', 'quote_request', 'lead_capture', 'faq', 'summary'],
  yachts: ['single_select', 'multi_select', 'yes_no', 'quantity', 'product_cards', 'comparison', 'recommendation_reason', 'date_picker', 'time_slots', 'add_ons', 'summary', 'lead_capture'],
  'law-firms': ['single_select', 'yes_no', 'date_picker', 'time_slots', 'product_cards', 'recommendation_reason', 'book_consultation', 'lead_capture', 'faq', 'summary'],
};

export type ExperienceBoxProps = {
  open: boolean;
  niche: NicheId;
  memory: SessionMemory;
  entities?: ExperienceEntity[];
  contacts?: Record<string, ExperienceContact>;
  onUploadAsset?: ExperienceUploadHandler;
  onClose: () => void;
  onAnswer: (id: string, value: ExperienceAnswer) => void;
  onComplete: (conversionType: string) => void;
};

function mergeAnswers(memory: SessionMemory, answers: Record<string, ExperienceAnswer>): SessionMemory {
  return { ...memory, answers: { ...memory.answers, ...answers } as SessionMemory['answers'] };
}

export function ExperienceBox({ open, niche, memory, entities = [], contacts, onUploadAsset, onClose, onAnswer, onComplete }: ExperienceBoxProps) {
  const initialAnswers = useMemo(() => ({ ...memory.answers }) as Record<string, ExperienceAnswer>, [memory.sessionId]);
  const [answers, setAnswers] = useState<Record<string, ExperienceAnswer>>(initialAnswers);
  const [plan, setPlan] = useState<ExperiencePlan>(() => buildFallbackExperiencePlan({ niche, memory, entities }));
  const [planning, setPlanning] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const lastPlanSignature = useRef('');
  const contactKeys = useMemo(() => Object.keys(contacts ?? {}), [contacts]);
  const allowedComponentTypes = useMemo(() => {
    const allowed = [...ALLOWED_BY_NICHE[niche]];
    if (onUploadAsset) allowed.push('upload_image');
    if (contactKeys.length) allowed.push('call_or_whatsapp');
    return allowed;
  }, [niche, onUploadAsset, contactKeys.join('|')]);

  useEffect(() => {
    if (!open) return;
    const mergedMemory = mergeAnswers(memory, answers);
    setPlan(buildFallbackExperiencePlan({ niche, memory: mergedMemory, entities }));
    setPlanVersion((value) => value + 1);
  }, [open, niche]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const mergedMemory = mergeAnswers(memory, answers);
    const fallback = buildFallbackExperiencePlan({ niche, memory: mergedMemory, entities });
    const fallbackSignature = JSON.stringify(fallback.components.map((component) => [component.type, component.id]));
    setPlan(fallback);
    setPlanning(true);

    const timer = window.setTimeout(async () => {
      const aiPlan = await requestExperiencePlan({
        niche,
        memory: mergedMemory,
        entities,
        contactKeys,
        allowedComponentTypes,
      }, controller.signal);
      if (aiPlan) {
        const signature = JSON.stringify(aiPlan.components.map((component) => [component.type, component.id]));
        if (signature !== lastPlanSignature.current || signature !== fallbackSignature) {
          setPlan(aiPlan);
          lastPlanSignature.current = signature;
        }
      }
      setPlanning(false);
    }, planVersion === 0 ? 0 : 380);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, planVersion]);

  const answer = (id: string, value: ExperienceAnswer) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    onAnswer(id, value);
    if (plan.nextAction === 'replan' || plan.components.some((component) => component.id === id && ['single_select', 'multi_select', 'yes_no', 'image_choice', 'upload_image', 'range', 'quantity', 'date_picker', 'time_slots', 'add_ons'].includes(component.type))) {
      setPlanVersion((version) => version + 1);
    }
  };

  const convert = (payload: ConversionPayload) => {
    if (['sample_request', 'quote_request', 'consultation_request'].includes(payload.type)) {
      const additions: Record<string, ExperienceAnswer> = { requested_action: payload.type };
      if (payload.entityIds?.length) additions.requested_entities = payload.entityIds;
      if (payload.resourceId) additions.requested_resource = payload.resourceId;
      setAnswers((current) => ({ ...current, ...additions }));
      for (const [id, value] of Object.entries(additions)) onAnswer(id, value);
      setPlanVersion((version) => version + 1);
      return;
    }
    onComplete(payload.type);
  };

  const submitLead = async (fields: Record<string, string>) => {
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ niche, fields, context: summarizeMemoryForModel(mergeAnswers(memory, answers)) }),
      });
      if (!response.ok) return { ok: false };
      const result = (await response.json()) as { ok?: boolean; stored?: boolean };
      if (result.ok && result.stored) onComplete(String(answers.requested_action ?? 'qualified_lead'));
      return { ok: Boolean(result.ok && result.stored), stored: result.stored };
    } catch {
      return { ok: false };
    }
  };

  const description = plan.intro ?? (niche === 'law-firms' ? 'Safe intake and routing using configured firm data only.' : 'The next useful visual step, based on what the session already knows.');

  return (
    <Sheet open={open} onClose={onClose} title={plan.title ?? 'Continue visually'} description={description}>
      <div className={`experience-box experience-box--${niche}`} data-theme={NICHE_CONFIGS[niche].visualTheme.themeClass.replace('theme-', '')}>
        <div className="experience-box__status">
          <Badge tone="accent">{planning ? 'Adapting…' : 'Using current session context'}</Badge>
          <span>{niche === 'hpl' ? 'Demo product facts only' : niche === 'law-firms' ? 'Routing, not legal advice' : niche === 'yachts' ? 'Fictional fleet data only' : 'Structured components'}</span>
        </div>
        {planning && !plan.components.length ? (
          <div className="experience-box__loading"><Skeleton height="82px" /><Skeleton height="82px" /></div>
        ) : (
          <ExperienceRenderer
            plan={plan}
            data={{ entities, contacts }}
            answers={answers}
            onAnswer={answer}
            onConvert={convert}
            onLeadSubmit={submitLead}
            onUploadAsset={onUploadAsset}
          />
        )}
      </div>
    </Sheet>
  );
}
