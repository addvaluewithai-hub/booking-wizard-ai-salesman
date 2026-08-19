import type { NicheId } from '../../niches/config';
import { summarizeMemoryForModel } from '../memory/summarize';
import type { SessionMemory } from '../memory/types';
import { buildPlanCacheKey, readCachedPlan, removeAnsweredQuestions, writeCachedPlan } from './plan-control';
import type { ExperienceEntity, ExperiencePlan } from './types';
import { validateExperiencePlan } from './validate';

export type ExperiencePlannerInput = {
  niche: NicheId;
  memory: SessionMemory;
  entities: ExperienceEntity[];
  contactKeys?: string[];
  allowedComponentTypes: ExperiencePlan['components'][number]['type'][];
};

export async function requestExperiencePlan(input: ExperiencePlannerInput, signal?: AbortSignal): Promise<ExperiencePlan | null> {
  try {
    const contactKeys = (input.contactKeys ?? []).slice(0, 12);
    const memorySummary = summarizeMemoryForModel(input.memory);
    const validationOptions = {
      allowedComponentTypes: input.allowedComponentTypes,
      allowedEntityIds: input.entities.map((entity) => entity.id),
      allowedContactKeys: contactKeys,
      maxComponents: 4,
    };
    const cacheKey = buildPlanCacheKey({
      niche: input.niche,
      memory: memorySummary,
      entityIds: validationOptions.allowedEntityIds,
      contactKeys,
      allowedComponentTypes: input.allowedComponentTypes,
    });

    const cachedRaw = readCachedPlan(cacheKey);
    if (cachedRaw) {
      const cached = validateExperiencePlan(cachedRaw, validationOptions);
      const usableCached = cached ? removeAnsweredQuestions(cached, input.memory.answers) : null;
      if (usableCached) return usableCached;
    }

    const response = await fetch('/api/experience', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        niche: input.niche,
        memory: memorySummary,
        allowedComponentTypes: input.allowedComponentTypes,
        verifiedData: { entities: input.entities.slice(0, 40), contactKeys },
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { plan?: unknown };
    const validated = validateExperiencePlan(payload.plan, validationOptions);
    if (!validated) return null;
    const usable = removeAnsweredQuestions(validated, input.memory.answers);
    if (!usable) return null;
    writeCachedPlan(cacheKey, usable);
    return usable;
  } catch {
    return null;
  }
}
