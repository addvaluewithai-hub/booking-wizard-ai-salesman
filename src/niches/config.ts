export type NicheId = 'homepage' | 'hpl' | 'yachts' | 'law-firms';

export type NicheConfig = {
  id: NicheId;
  name: string;
  salesmanSystemRules: string[];
  allowedActions: string[];
  forbiddenClaims: string[];
  conversionEvents: string[];
  experienceComponents: string[];
  visualTheme: {
    themeClass: string;
    presenceStyle: string;
    tone: string;
  };
};

export const NICHE_CONFIGS: Record<NicheId, NicheConfig> = {
  homepage: {
    id: 'homepage',
    name: 'AI Salesman product homepage',
    salesmanSystemRules: [
      'Default to silence while the visitor is still reading normally.',
      'Reference only behavior present in session memory.',
      'Help the visitor map the product to their own conversion problem.',
      'Demonstrate relevance before asking for contact details.',
    ],
    allowedActions: ['show_memory', 'map_use_case', 'open_lead_qualification'],
    forbiddenClaims: ['guaranteed conversion lift', 'fake customer logos', 'fake deployment claims'],
    conversionEvents: ['pilot_request', 'walkthrough_request'],
    experienceComponents: ['single_select', 'multi_select', 'lead_capture', 'recommendation'],
    visualTheme: { themeClass: 'theme-product', presenceStyle: 'spark', tone: 'quiet confidence' },
  },
  hpl: {
    id: 'hpl',
    name: 'Decorative materials / HPL',
    salesmanSystemRules: [
      'Use only structured demo catalog facts supplied in verifiedFacts.',
      'Prioritize repeated products, application context, cleaning/usage needs and comparisons.',
      'Never invent technical specifications, certifications, stock, availability or price.',
    ],
    allowedActions: ['narrow_materials', 'compare_products', 'request_samples', 'request_quote', 'contact_sales'],
    forbiddenClaims: ['invented fire rating', 'invented moisture rating', 'invented thickness', 'invented warranty', 'invented availability'],
    conversionEvents: ['sample_request', 'quote_request', 'technical_sales_handoff'],
    experienceComponents: ['single_select', 'multi_select', 'product_cards', 'comparison', 'sample_request', 'quote_request'],
    visualTheme: { themeClass: 'theme-hpl', presenceStyle: 'material-spirit', tone: 'warm architectural' },
  },
  yachts: {
    id: 'yachts',
    name: 'Yacht charter',
    salesmanSystemRules: [
      'Use only configured fleet, price, capacity, schedule and policy data.',
      'Help visitors find a better fit for party size, occasion and budget without upselling by default.',
      'Never invent availability, scarcity, hold timers, marina rules or weather certainty.',
    ],
    allowedActions: ['compare_vessels', 'choose_party_size', 'choose_time', 'add_occasion', 'booking_summary'],
    forbiddenClaims: ['fake availability', 'fake scarcity', 'fake price', 'fake hold timer', 'weather certainty'],
    conversionEvents: ['booking_start', 'qualified_charter_enquiry'],
    experienceComponents: ['party_size', 'date_picker', 'time_slots', 'product_cards', 'comparison', 'booking_summary'],
    visualTheme: { themeClass: 'theme-yacht', presenceStyle: 'compass', tone: 'calm luxury' },
  },
  'law-firms': {
    id: 'law-firms',
    name: 'Law-firm intake and routing',
    salesmanSystemRules: [
      'This is intake and routing only, never legal advice.',
      'Use only configured practice areas, offices, jurisdictions and lawyer/team data.',
      'Do not assess merits, predict outcomes, estimate case value or imply attorney-client relationship.',
    ],
    allowedActions: ['route_practice_area', 'choose_office', 'match_team', 'book_consultation', 'contact_handoff'],
    forbiddenClaims: ['legal advice', 'case strength', 'case value', 'outcome prediction', 'invented deadline', 'attorney-client relationship'],
    conversionEvents: ['consultation_booking', 'qualified_intake'],
    experienceComponents: ['single_select', 'team_cards', 'date_picker', 'time_slots', 'lead_capture'],
    visualTheme: { themeClass: 'theme-law', presenceStyle: 'guide-mark', tone: 'serious restrained' },
  },
};

export function nicheFromPath(pathname: string): NicheId {
  if (pathname.startsWith('/hpl')) return 'hpl';
  if (pathname.startsWith('/yachts')) return 'yachts';
  if (pathname.startsWith('/law-firms')) return 'law-firms';
  return 'homepage';
}
