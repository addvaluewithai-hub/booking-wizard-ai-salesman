import type { NicheId } from '../../niches/config';
import { summarizeMemoryForModel } from '../memory/summarize';
import type { SessionMemory } from '../memory/types';
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
    const response = await fetch('/api/experience', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        niche: input.niche,
        memory: summarizeMemoryForModel(input.memory),
        allowedComponentTypes: input.allowedComponentTypes,
        verifiedData: { entities: input.entities.slice(0, 40), contactKeys },
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { plan?: unknown };
    return validateExperiencePlan(payload.plan, {
      allowedComponentTypes: input.allowedComponentTypes,
      allowedEntityIds: input.entities.map((entity) => entity.id),
      allowedContactKeys: contactKeys,
      maxComponents: 4,
    });
  } catch {
    return null;
  }
}
