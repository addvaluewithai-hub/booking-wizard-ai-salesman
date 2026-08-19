import type { NicheId } from '../../niches/config';
import type { SessionMemory } from '../memory/types';
import type { ExperienceEntity, ExperiencePlan } from './types';

type FallbackInput = {
  niche: NicheId;
  memory: SessionMemory;
  entities?: ExperienceEntity[];
};

function topEntityIds(memory: SessionMemory, entities: ExperienceEntity[], limit = 3) {
  const allowed = new Set(entities.map((entity) => entity.id));
  const candidates = [...memory.comparisonIds, ...Object.entries(memory.viewedEntities)
    .sort((a, b) => b[1].views - a[1].views)
    .map(([id]) => id)]
    .filter((id) => allowed.has(id));
  return [...new Set(candidates)].slice(0, limit);
}

export function buildFallbackExperiencePlan({ niche, memory, entities = [] }: FallbackInput): ExperiencePlan {
  if (niche === 'hpl') {
    const shortlist = topEntityIds(memory, entities, 3);
    if (!memory.answers.application && !memory.viewedSections.kitchen) {
      return {
        title: 'Narrow the material by where it will live.',
        intro: shortlist.length ? 'I kept your current shortlist. One project detail will make the comparison more useful.' : 'A project context is more useful than another generic filter.',
        components: [{
          type: 'single_select',
          id: 'application',
          question: 'What is the material for?',
          options: [
            { id: 'kitchen', label: 'Kitchen cabinetry', description: 'Cabinets, fronts and fitted surfaces' },
            { id: 'wardrobe', label: 'Wardrobe / bedroom', description: 'Large vertical surfaces and storage' },
            { id: 'retail', label: 'Retail / hospitality', description: 'Feature surfaces with higher visual impact' },
            { id: 'office', label: 'Office', description: 'Workplace joinery and furniture' },
          ],
        }],
        nextAction: 'replan',
      };
    }

    if (!memory.answers.lighting && (memory.answers.application === 'kitchen' || memory.viewedSections.kitchen)) {
      return {
        title: 'Your shortlist is already telling us something.',
        intro: 'Lighting changes how a dark or warm finish reads at room scale.',
        components: [{
          type: 'single_select',
          id: 'lighting',
          question: 'How much natural light does the room get?',
          options: [
            { id: 'bright', label: 'Lots of daylight' },
            { id: 'medium', label: 'Medium daylight' },
            { id: 'low', label: 'Very little daylight' },
          ],
        }],
        nextAction: 'replan',
      };
    }

    const recommended = shortlist.length ? shortlist : entities.slice(0, 3).map((entity) => entity.id);
    return {
      title: 'Here is the useful shortlist.',
      intro: 'These are drawn only from the demo catalog; the reasons below use the structured attributes attached to each material.',
      components: [
        { type: 'product_cards', id: 'shortlist', entityIds: recommended, reason: 'Best fit from current browsing + answers' },
        ...(recommended.length >= 2 ? [{ type: 'comparison' as const, id: 'compare', entityIds: recommended.slice(0, 3) }] : []),
        { type: 'sample_request', id: 'sample_request', entityIds: recommended, title: 'Request demo samples' },
      ],
      nextAction: 'sample_or_quote',
    };
  }

  if (niche === 'yachts') {
    if (!memory.answers.party_size) {
      return {
        title: 'Start with the one thing that changes the fit most.',
        components: [{ type: 'quantity', id: 'party_size', question: 'How many guests?', min: 2, max: 18, step: 1 }],
        nextAction: 'replan',
      };
    }
    const ids = topEntityIds(memory, entities, 3);
    return {
      title: 'Build the charter around the group, not the biggest boat.',
      components: ids.length ? [{ type: 'product_cards', id: 'vessel_matches', entityIds: ids }] : [{
        type: 'single_select', id: 'occasion', question: 'What kind of charter is this?', options: [
          { id: 'sunset', label: 'Sunset cruise' }, { id: 'celebration', label: 'Celebration' }, { id: 'day', label: 'Day on the water' }, { id: 'corporate', label: 'Corporate / hosting' },
        ],
      }],
      nextAction: 'replan',
    };
  }

  if (niche === 'law-firms') {
    return {
      title: 'I can route you to a consultation path — not give legal advice.',
      intro: 'Choose the broad category that is closest. The next step uses only the firm’s configured practice areas.',
      components: [{
        type: 'single_select', id: 'matter_category', question: 'Which broad area is closest?', options: [
          { id: 'business', label: 'Business / commercial' },
          { id: 'real_estate', label: 'Real estate' },
          { id: 'employment', label: 'Employment' },
          { id: 'other', label: 'Not sure / other' },
        ],
      }],
      nextAction: 'route',
    };
  }

  if (!memory.answers.site_type) {
    return {
      title: 'Map this to your own conversion problem.',
      intro: 'You do not need to give contact details yet.',
      components: [{
        type: 'single_select', id: 'site_type', question: 'What does your website mainly sell?', options: [
          { id: 'catalog', label: 'Products / catalog' },
          { id: 'booking', label: 'Bookings / experiences' },
          { id: 'service', label: 'Professional services' },
          { id: 'other', label: 'Something else' },
        ],
      }],
      nextAction: 'replan',
    };
  }

  if (!memory.answers.conversion_goal) {
    return {
      title: 'What should get easier for the visitor?',
      components: [{
        type: 'single_select', id: 'conversion_goal', question: 'What counts as a conversion for you?', options: [
          { id: 'lead', label: 'Qualified enquiry / lead' },
          { id: 'booking', label: 'Booking' },
          { id: 'product', label: 'Confident product choice' },
          { id: 'sample_quote', label: 'Sample or quote request' },
        ],
      }],
      nextAction: 'replan',
    };
  }

  return {
    title: 'A practical first pilot.',
    intro: 'The first version should focus on one high-friction conversion moment, not try to replace your whole website.',
    components: [
      { type: 'summary', id: 'pilot_summary', title: 'Recommended setup', items: [
        { label: 'Website type', value: String(memory.answers.site_type) },
        { label: 'Primary conversion', value: String(memory.answers.conversion_goal) },
        { label: 'Memory scope', value: 'Current browser session' },
        { label: 'Behavior', value: 'Conservative ambient intervention + structured experience' },
      ] },
      { type: 'lead_capture', id: 'pilot_lead', title: 'Request a pilot walkthrough', fields: ['name', 'email', 'company', 'url'], submitLabel: 'Request walkthrough' },
    ],
    nextAction: 'capture_lead',
  };
}
