export const ALAMAAR_SITE_BRAIN = {
  version: '2026-08-26',
  positioning: {
    promise: 'Premium HPL, wood and decorative surfaces with practical project support.',
    proof: [
      'Serving the Egyptian wood and surface market since 1996.',
      'Official ACE MICA partner.',
      'Broad ready-stock positioning at brand level; never claim a specific SKU is in stock without live inventory.',
      'Nationwide Egypt project support and distribution.',
      'Material guidance from selection through delivery.',
    ],
  },
  materialFamilies: [
    {
      id: 'hpl',
      label: 'HPL',
      usefulFor: ['kitchens', 'wardrobes', 'furniture', 'offices', 'retail', 'hospitality', 'interior surfaces'],
      salesAngle: 'A wide finish language in one practical surface category: wood, solid, stone, metallic and decorative directions.',
    },
    {
      id: 'foam-board',
      label: 'Foam Board',
      usefulFor: ['interior applications', 'furniture applications', 'signage', 'display units'],
      salesAngle: 'A lightweight board option for interior and display-oriented applications.',
    },
    {
      id: 'plywood',
      label: 'Plywood',
      usefulFor: ['furniture', 'carpentry', 'construction'],
      salesAngle: 'A strong versatile board family where the build itself matters as much as the finish.',
    },
    {
      id: 'natural-wood',
      label: 'Natural Wood',
      usefulFor: ['doors', 'furniture', 'decorative finishes'],
      salesAngle: 'For projects that specifically want the character of natural wood rather than a decorative laminate surface.',
    },
  ],
  finishDirections: [
    {
      id: 'wood',
      siteCollections: ['Classic Wood', 'Artistic Wood', 'Metal Wood'],
      usefulFor: ['rooms', 'wardrobes', 'cabinetry', 'furniture', 'warm residential interiors'],
      salesAngle: 'Adds warmth and natural depth; useful when the client wants the space to feel less flat or clinical.',
    },
    {
      id: 'solid',
      siteCollections: ['Solid Colors'],
      usefulFor: ['kitchens', 'offices', 'retail', 'contemporary furniture'],
      salesAngle: 'Clean visual language and easy coordination when the design needs calm, modern surfaces without busy grain.',
    },
    {
      id: 'stone',
      siteCollections: ['Stone', 'Artistic Stone'],
      usefulFor: ['walls', 'furniture', 'hospitality', 'retail', 'architectural feature areas'],
      salesAngle: 'Brings architectural weight and a more premium visual anchor to the space.',
    },
    {
      id: 'decorative',
      siteCollections: ['Ruby Collection', 'Textile', 'Cane', 'Crystallite', 'Metallic', '1.25 MM Texture'],
      usefulFor: ['feature surfaces', 'statement furniture', 'hospitality', 'retail', 'interiors needing a distinct point of view'],
      salesAngle: 'Best when the project needs personality, tactile detail or a controlled statement rather than a neutral background.',
    },
  ],
  projectProof: [
    {
      project: 'Dubai Creek Harbour',
      context: 'hospitality / premium interiors',
      direction: 'warm wood plus stone-inspired surfaces for visual depth and coordinated interior language',
    },
    {
      project: 'Dubai Hills Estate',
      context: 'premium residential',
      direction: 'natural wood tones for a refined, repeatable material language across interior applications',
    },
    {
      project: 'Cape Hayat RAK',
      context: 'residential development',
      direction: 'soft grey finish for calm contemporary interiors',
    },
    {
      project: 'Binghatti',
      context: 'lobby / public areas',
      direction: 'statement stone-inspired surface paired with warm architectural wood',
    },
  ],
  trustSignals: [
    'Al Amaar presents ACE MICA quality documentation including ISO 9001:2015 and independent test reports.',
    'Treat certifications and test reports as brand/manufacturer documentation, not proof that every individual SKU has every property.',
    'Samples and project support are part of the stated customer journey before final approval.',
  ],
  salesMethod: {
    principle: 'Helpful before persuasive. Reduce uncertainty, make a recommendation when enough context exists, and move the visitor one useful step forward.',
    sequence: [
      'Discover only the missing information that changes the recommendation.',
      'Reflect the visitor goal in plain language so they feel understood.',
      'Recommend a direction instead of dumping a catalog.',
      'Give one concrete reason the direction fits the project.',
      'Use one relevant proof point only when it reduces risk or builds confidence.',
      'Offer a natural next step: narrow, compare, view materials, request a sample, or talk to project support.',
    ],
    restraint: [
      'Do not pressure the visitor or manufacture urgency.',
      'Do not keep asking questions when the existing answers are enough to recommend.',
      'Do not praise every choice; occasionally explain a tradeoff or steer away from a weaker fit.',
      'Do not overwhelm with long explanations, feature dumps, or multiple CTAs.',
      'Do not mention that you are following a sales script.',
    ],
  },
  grounding: {
    neverInvent: ['price', 'discount', 'specific SKU stock', 'delivery date', 'dimensions', 'thickness', 'fire rating', 'water resistance', 'durability claim', 'certification coverage', 'technical performance'],
    technicalRule: 'If the verified context does not support a technical claim, say it needs confirmation and use the technical/human-support semantic path.',
  },
};

export function compactAlamaarSiteBrain() {
  return ALAMAAR_SITE_BRAIN;
}
