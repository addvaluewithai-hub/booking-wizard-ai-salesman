import type { NicheId } from '../../niches/config';
import type { SessionMemory } from '../memory/types';
import type { ExperienceComponent, ExperienceEntity, ExperiencePlan } from './types';

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

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string' && value) return [value];
  return [];
}

function tomorrowDate() {
  const date = new Date(Date.now() + 86_400_000);
  return date.toISOString().slice(0, 10);
}

function yachtFits(memory: SessionMemory, entities: ExperienceEntity[]) {
  const partySize = typeof memory.answers.party_size === 'number' ? memory.answers.party_size : Number(memory.answers.party_size ?? 2);
  return [...entities]
    .filter((entity) => typeof entity.attributes?.capacity === 'number' && Number(entity.attributes.capacity) >= partySize)
    .sort((a, b) => Number(a.attributes?.capacity) - Number(b.attributes?.capacity) || Number(a.attributes?.demo_hourly_price_usd) - Number(b.attributes?.demo_hourly_price_usd));
}

function lawMatches(memory: SessionMemory, entities: ExperienceEntity[]) {
  const matter = typeof memory.answers.matter_category === 'string' ? memory.answers.matter_category : '';
  const office = typeof memory.answers.office === 'string' ? memory.answers.office : '';
  const preferred = typeof memory.answers.preferred_lawyer === 'string' ? memory.answers.preferred_lawyer : '';
  const matches = entities.filter((entity) => {
    const areas = Array.isArray(entity.attributes?.practice_areas) ? entity.attributes.practice_areas : [];
    const offices = Array.isArray(entity.attributes?.offices) ? entity.attributes.offices : [];
    return (!matter || areas.includes(matter)) && (!office || offices.includes(office));
  });
  if (preferred) {
    const selected = entities.find((entity) => entity.id === preferred);
    if (selected) return [selected, ...matches.filter((entity) => entity.id !== preferred)];
  }
  return matches;
}

export function buildFallbackExperiencePlan({ niche, memory, entities = [] }: FallbackInput): ExperiencePlan {
  const requestedAction = typeof memory.answers.requested_action === 'string' ? memory.answers.requested_action : '';
  const requestedEntities = stringArray(memory.answers.requested_entities).filter((id) => entities.some((entity) => entity.id === id));

  if (niche === 'hpl') {
    if (requestedAction === 'sample_request' || requestedAction === 'quote_request') {
      return {
        title: requestedAction === 'sample_request' ? 'Send the sample request with its project context.' : 'Send the quote request with its project context.',
        intro: 'The shortlist and answers are already attached. Only contact details are missing now.',
        components: [
          { type: 'summary', id: 'hpl_request_summary', title: 'Request context', items: [
            { label: 'Action', value: requestedAction === 'sample_request' ? 'Demo sample request' : 'Demo project quote' },
            { label: 'Materials', value: requestedEntities.join(', ') || 'Current shortlist' },
            { label: 'Application', value: String(memory.answers.application ?? 'inferred from browsing') },
            { label: 'Lighting', value: String(memory.answers.lighting ?? 'not specified') },
          ] },
          { type: 'lead_capture', id: 'hpl_request_contact', title: 'Where should the material team follow up?', fields: ['name', 'email', 'company', 'phone'], submitLabel: requestedAction === 'sample_request' ? 'Submit sample request' : 'Submit quote request' },
        ],
        nextAction: 'capture_lead',
      };
    }

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
      intro: 'These are drawn only from the demo catalog; the comparison uses the structured attributes attached to each material.',
      components: [
        { type: 'product_cards', id: 'shortlist', entityIds: recommended, reason: 'Best fit from current browsing + answers' },
        ...(recommended.length >= 2 ? [{ type: 'comparison' as const, id: 'compare', entityIds: recommended.slice(0, 3) }] : []),
        { type: 'sample_request', id: 'sample_request', entityIds: recommended, title: 'Request demo samples' },
        { type: 'quote_request', id: 'quote_request', entityIds: recommended, title: 'Request a demo project quote' },
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
    if (!memory.answers.occasion) {
      return {
        title: 'Build the charter around the group, not the biggest boat.',
        components: [{
          type: 'single_select', id: 'occasion', question: 'What kind of charter is this?', options: [
            { id: 'sunset', label: 'Sunset cruise' }, { id: 'birthday', label: 'Birthday / celebration' }, { id: 'family day', label: 'Day on the water' }, { id: 'corporate', label: 'Corporate / hosting' },
          ],
        }],
        nextAction: 'replan',
      };
    }
    if (!memory.answers.charter_date) {
      return {
        title: 'Choose a date before looking at the configured demo slots.',
        intro: 'No live availability is implied — these are fictional slots attached to the demo fleet.',
        components: [{ type: 'date_picker', id: 'charter_date', question: 'Which day are you considering?', minDate: tomorrowDate() }],
        nextAction: 'replan',
      };
    }

    const fits = yachtFits(memory, entities);
    const visited = topEntityIds(memory, entities, 3);
    const recommended = visited.length ? visited : fits.slice(0, 2).map((entity) => entity.id);
    const primary = entities.find((entity) => entity.id === recommended[0]) ?? fits[0];
    const slots = Array.isArray(primary?.attributes?.demo_available_slots)
      ? primary.attributes.demo_available_slots.filter((slot): slot is string => typeof slot === 'string')
      : [];
    const yachtComponents: ExperienceComponent[] = primary ? [
      { type: 'product_cards', id: 'vessel_matches', entityIds: recommended.length ? recommended : [primary.id], reason: 'Closest configured capacity / current comparison' },
      ...(slots.length ? [{ type: 'time_slots' as const, id: 'charter_time', question: 'Which fictional demo slot suits you?', slots }] : []),
      { type: 'add_ons', id: 'charter_add_ons', question: 'Anything to include in the enquiry?', options: [
        { id: 'none', label: 'Keep it simple' }, { id: 'catering', label: 'Ask about catering' }, { id: 'celebration', label: 'Celebration setup' }, { id: 'water', label: 'Water activities' },
      ] },
      { type: 'lead_capture', id: 'charter_enquiry', title: 'Send this fictional charter brief', fields: ['name', 'email', 'phone'], submitLabel: 'Submit charter enquiry' },
    ].slice(0, 4) : [
      { type: 'faq', id: 'no_vessel_fit', title: 'No configured match', body: 'This fictional fleet does not contain a vessel configured for the selected party size.' },
    ];

    return {
      title: primary ? `${primary.name} is the closest configured fit to start from.` : 'No configured vessel fits that party size.',
      intro: 'The rate, capacity and time options below come only from the fictional fleet dataset.',
      components: yachtComponents,
      nextAction: primary ? 'capture_lead' : 'replan',
    };
  }

  if (niche === 'law-firms') {
    if (requestedAction === 'consultation_request') {
      return {
        title: 'Send the consultation request to the configured route.',
        intro: 'This is still intake only. Submitting does not create an attorney-client relationship.',
        components: [
          { type: 'summary', id: 'consultation_summary', title: 'Configured route', items: [
            { label: 'Broad category', value: String(memory.answers.matter_category ?? 'not specified') },
            { label: 'Office', value: String(memory.answers.office ?? 'not specified') },
            { label: 'Preferred profile', value: String(memory.answers.preferred_lawyer ?? 'closest configured team') },
            { label: 'Purpose', value: 'Initial consultation request only' },
          ] },
          { type: 'lead_capture', id: 'law_contact', title: 'Contact details for the intake team', fields: ['name', 'email', 'phone'], submitLabel: 'Submit consultation request' },
          { type: 'faq', id: 'law_disclaimer', title: 'Before submitting', body: 'This demo routes an enquiry. It does not provide legal advice, assess merits, predict an outcome, estimate case value or create an attorney-client relationship.' },
        ],
        nextAction: 'capture_lead',
      };
    }

    if (!memory.answers.matter_category) {
      return {
        title: 'I can route you to a consultation path — not give legal advice.',
        intro: 'Choose the broad category that is closest. The next step uses only the firm’s configured practice areas.',
        components: [{
          type: 'single_select', id: 'matter_category', question: 'Which broad area is closest?', options: [
            { id: 'business', label: 'Business / commercial' },
            { id: 'real_estate', label: 'Real estate' },
            { id: 'employment', label: 'Employment' },
            { id: 'estate', label: 'Estate planning' },
          ],
        }],
        nextAction: 'replan',
      };
    }
    if (!memory.answers.office) {
      return {
        title: 'Which configured office should receive the enquiry?',
        components: [{ type: 'single_select', id: 'office', question: 'Preferred office', options: [
          { id: 'Central Office', label: 'Central Office' }, { id: 'Harbor Office', label: 'Harbor Office' },
        ] }],
        nextAction: 'replan',
      };
    }

    const matches = lawMatches(memory, entities).slice(0, 3);
    if (!matches.length) {
      return {
        title: 'There is no configured profile matching both selections.',
        intro: 'A general intake can still receive the enquiry without inventing a lawyer match.',
        components: [
          { type: 'faq', id: 'no_lawyer_match', title: 'Routing boundary', body: 'The demo will not fabricate a lawyer or jurisdiction match when the configured data does not contain one.' },
          { type: 'lead_capture', id: 'general_intake', title: 'Send a general consultation request', fields: ['name', 'email', 'phone'], submitLabel: 'Submit intake request' },
        ],
        nextAction: 'capture_lead',
      };
    }

    return {
      title: 'These configured profiles are the closest routing fit.',
      intro: 'The match is based only on broad category and office — not case merits.',
      components: [
        { type: 'product_cards', id: 'lawyer_matches', entityIds: matches.map((entity) => entity.id), reason: 'Configured practice area + office match' },
        { type: 'book_consultation', id: 'consultation_request', resourceId: matches[0].id, title: `Request an initial consultation through ${matches[0].name}` },
        { type: 'faq', id: 'law_boundary', title: 'What this match means', body: 'It identifies a configured intake route only. It is not legal advice and does not imply an attorney-client relationship.' },
      ],
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
