# Architecture

## System overview

```text
Website UI
  │
  ├── Observer (browser events)
  │      ↓
  ├── Session State / Memory Reducer
  │      ↓
  ├── Decision Scheduler
  │      ↓
  ├── /api/salesman (Cloudflare Pages Function)
  │      ↓
  ├── Gemini model router + fallback chain
  │      ↓
  ├── Decision Guardrails
  │      ↓
  ├── Ambient Salesman Presence
  │      ↓ visitor clicks
  └── Experience Box
         ├── component planner
         ├── deterministic product/business data
         ├── structured actions
         └── conversion event + memory update
```

The browser owns UI state and event capture. Secrets and AI model calls stay server-side.

---

## Recommended frontend module structure

```text
src/
  app/
    routes/
    layout/
  salesman/
    observer/
      event-types.ts
      observer.ts
      selectors.ts
    memory/
      reducer.ts
      session-store.ts
      summarize.ts
    decision/
      scheduler.ts
      guardrails.ts
      client.ts
    presence/
      SalesmanPresence.tsx
      intervention-motion.ts
    experience/
      ExperienceBox.tsx
      ExperienceRenderer.tsx
      registry.ts
      components/
  niches/
    hpl/
      config.ts
      data.ts
      rules.ts
      components/
    yachts/
    law-firms/
  homepage/
    lead-flow.ts
  analytics/
  design-system/
  lib/
```

Keep the core engine independent from niche copy/data.

---

## Browser event model

Only collect events that can improve experience or measurement. Avoid noisy mouse telemetry.

```ts
export type VisitorEvent = {
  id: string;
  at: number;
  type:
    | 'page_view'
    | 'section_view'
    | 'product_view'
    | 'product_revisit'
    | 'compare_add'
    | 'compare_remove'
    | 'filter_change'
    | 'price_view'
    | 'spec_view'
    | 'cta_view'
    | 'cta_click'
    | 'form_start'
    | 'form_abandon'
    | 'booking_start'
    | 'booking_abandon'
    | 'salesman_impression'
    | 'salesman_click'
    | 'salesman_dismiss'
    | 'salesman_ignore'
    | 'experience_answer'
    | 'experience_complete'
    | 'conversion';
  page: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};
```

### Important

Do not send every event immediately to the LLM.

Use a local reducer that converts events into meaningful state. Call the decision model only when:

- a meaningful intent signal changes
- a hesitation pattern emerges
- a funnel abandonment occurs
- a cooldown ends and there is new information
- the visitor explicitly asks for help

This reduces latency, token use and rate-limit pressure.

---

## Session memory model

```ts
export type SessionMemory = {
  sessionId: string;
  startedAt: number;
  locale: string;
  currentPage: string;
  pageHistory: Array<{ path: string; visits: number; lastSeenAt: number }>;

  viewedEntities: Record<string, {
    views: number;
    totalDwellMs: number;
    lastSeenAt: number;
  }>;

  comparisonIds: string[];
  selectedFilters: Record<string, string[]>;

  inferred: {
    intent?: string;
    stage: 'unknown' | 'exploring' | 'considering' | 'high-intent' | 'converting';
    hesitation?: string;
    priceSensitivity?: 'unknown' | 'low' | 'medium' | 'high';
    confidence: number;
  };

  answers: Record<string, string | number | boolean | string[]>;

  salesman: {
    interventionsShown: number;
    interventionsClicked: number;
    interventionsIgnored: number;
    interventionsDismissed: number;
    lastMessage?: string;
    lastReason?: string;
    lastActionAt?: number;
    cooldownUntil?: number;
    suppressionLevel: 0 | 1 | 2 | 3;
  };
};
```

The model should receive a concise serialized summary of this state, not the full raw event history.

---

## Decision contract

Prefer structured output when the selected Gemini model supports it. If a model does not reliably return schema output, parse defensively and validate.

```ts
export type SalesmanDecision = {
  action: 'silent' | 'intervene';
  message?: string;
  internalReason: string;
  confidence: number;
  cooldownSeconds: number;
  experienceHint?: string;
};
```

### Validation

Reject or downgrade an intervention if:

- message is empty or too long
- message repeats a recent concept
- cooldown has not expired
- suppression level is high and no new strong intent exists
- user is typing/interacting with a form
- model references facts not present in verified business data
- model invents urgency, scarcity, pricing or a claim

Fallback on invalid output: `silent`.

---

## Decision scheduler

Do not ask the model on a fixed timer forever.

Suggested scheduler:

1. Browser events update memory synchronously.
2. `shouldConsiderDecision(memory, event)` checks whether new information matters.
3. Debounce 600–1200ms so bursts of events collapse.
4. Respect minimum model-call interval.
5. Send compact state + business playbook to `/api/salesman`.
6. Validate returned decision.
7. If `intervene`, render one ambient presence.
8. If `silent`, do nothing and wait for a new meaningful signal.

Initial minimum call interval: around 12–20 seconds, adjustable during testing.

---

## Experience plan contract

After a click, the planner should produce a **component plan**, not free-form HTML.

```ts
export type ExperiencePlan = {
  title?: string;
  intro?: string;
  components: ExperienceComponent[];
  nextAction?: string;
};

export type ExperienceComponent =
  | { type: 'single_select'; id: string; question: string; options: Option[] }
  | { type: 'multi_select'; id: string; question: string; options: Option[] }
  | { type: 'product_cards'; ids: string[]; reasonMode: 'brief' | 'detailed' }
  | { type: 'comparison'; ids: string[] }
  | { type: 'date_picker'; id: string }
  | { type: 'time_slots'; id: string; slots: string[] }
  | { type: 'upload_image'; id: string; purpose: string }
  | { type: 'lead_capture'; fields: Array<'name' | 'email' | 'phone' | 'company' | 'url'> }
  | { type: 'sample_request'; productIds: string[] }
  | { type: 'quote_request'; productIds?: string[] }
  | { type: 'book_consultation'; resourceId?: string };
```

The browser renders these using a trusted component registry.

Never allow the model to return executable JavaScript, arbitrary HTML or arbitrary CSS.

---

## Data grounding

Every vertical needs a deterministic source of truth.

### HPL

Structured product object should contain:

- id / SKU
- name
- category
- color family
- pattern family
- finish
- suitable applications
- verified material properties
- image URLs
- sample eligibility
- quote eligibility
- exact technical metadata available from source

AI may explain **why a verified property matters**, but may not create unverified product specifications.

### Yachts

- yacht ID
- capacity
- cabins
- amenities
- verified price rules
- available booking slots
- add-ons
- location

Never create availability or “only X left” language unless supplied by booking data.

### Law firms

- practice areas
- office jurisdictions
- lawyer bios
- consultation types
- routing rules

The AI is an intake/router. It must not provide personalized legal advice, claim eligibility, predict outcomes or estimate a case value.

---

## API routes

Initial:

- `POST /api/salesman` — model router for decision/copy/planning calls

Planned:

- `POST /api/decision` — explicit structured ambient decision contract
- `POST /api/experience` — structured experience-plan generation
- `POST /api/lead` — server-side lead persistence
- `POST /api/event` — optional server analytics sink
- `GET /api/health` — deployment + model health without leaking secrets

Keep public endpoints rate-limited and payload-limited.

---

## Persistence strategy

### Phase 1

- session memory: browser `sessionStorage`
- non-sensitive anonymous event aggregation: in-memory/browser
- lead capture: server endpoint backed by a simple adapter

### Phase 2

Cloudflare D1 is a reasonable first persistence layer for:

- leads
- anonymized conversion events
- client/niche configuration

Cloudflare KV can be considered for low-write config/cache but should not be used as the primary relational event store.

Persistent visitor memory must be introduced only with explicit privacy design.

---

## Failure behavior

The product must still work when AI is unavailable.

- ambient salesman: remain silent or use a very limited safe deterministic fallback
- Experience Box: continue rendering deterministic components based on existing answers
- booking/sample/lead actions: must not depend on the LLM being online
- API error: no scary red error toast to end users; degrade quietly

The model is an intelligence layer, not a single point of failure for core conversion actions.
