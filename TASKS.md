# Master Build Tasks

This is the execution checklist for the autonomous coding agent. Work top-to-bottom unless a dependency requires a small reorder. Do not mark a task complete until its acceptance criteria are met.

## Phase 0 — Repository + deployment foundation

- [x] Initialize `main` branch so Cloudflare can select a production branch.
- [x] Add Vite + React + TypeScript scaffold.
- [x] Add Cloudflare SPA fallback.
- [x] Add root `/functions/api/salesman.js` model-router proof of concept.
- [x] Add initial deployable homepage/niche shell.
- [ ] Run a clean local `npm install`, `npm run check`, and `npm run build`; fix every error/warning that can affect deployment.
- [ ] Add `.gitignore` for dependencies, dist, env files, local Wrangler state, OS/editor artifacts.
- [ ] Add a small `/api/health` Pages Function that reports app version/AI availability without leaking secrets.
- [ ] Confirm Cloudflare build config in a deployed preview: branch `main`, command `npm run build`, output `dist`.
- [ ] Confirm `/`, `/hpl`, `/yachts`, `/law-firms`, and direct reloads all resolve correctly on Pages.
- [ ] Confirm `GET /api/salesman` works on Pages.
- [ ] Add `GEMINI_API_KEY` to both Cloudflare Preview and Production encrypted secrets and confirm one real generation works.

**Phase 0 acceptance:** a Cloudflare Pages URL exists, every route loads directly, and AI generation works server-side without a browser-exposed key.

---

## Phase 1 — Production design foundation

- [ ] Create reusable design tokens for color, spacing, radius, typography, layering, motion and breakpoints.
- [ ] Build reusable `Button`, `IconButton`, `Surface`, `ChoiceCard`, `Chip`, `Field`, `Badge`, `Skeleton`, and `Sheet/Dialog` primitives.
- [ ] Build a coherent icon system (SVG/lucide-like internal primitives; no mixed random icon styles).
- [ ] Define salesman presence tokens separately from normal CTA styling.
- [ ] Define HPL, Yacht, Law, and Product-home theme skins using the same component contract.
- [ ] Add RTL-ready layout tokens and test at least one component in `dir="rtl"`.
- [ ] Add global visible focus styles.
- [ ] Add reduced-motion utilities.
- [ ] Create a polished loading/skeleton language.
- [ ] Add responsive typography using `clamp()`/tokens with no awkward tablet jumps.
- [ ] Ensure body copy, controls and small labels meet contrast requirements.

**Phase 1 acceptance:** primitives render consistently at 1440/1024/768/390/320px and pass keyboard/focus/reduced-motion review.

---

## Phase 2 — Homepage: world-class product story

- [ ] Replace the current shell hero with final-quality composition and copy.
- [ ] Keep the core promise clear above the fold: **observes + remembers + decides when to speak + opens adaptive visual experience**.
- [ ] Build a believable live website preview in the hero, not a dashboard illustration.
- [ ] Animate a subtle ambient-salesman moment inside the preview without blocking the CTA.
- [ ] Add “two layers” section: Ambient Salesman vs Experience Box.
- [ ] Add an interactive behavior timeline showing `signal → memory → decision → intervention → visual experience → conversion`.
- [ ] Add dedicated niche preview section for HPL / Yachts / Law Firms.
- [ ] Add a memory demonstration showing how an ignored prompt changes later behavior.
- [ ] Add conversion/measurement section focused on assisted conversion, not chat engagement.
- [ ] Add implementation/integration section showing “small script + server config” vision without overpromising unfinished integrations.
- [ ] Add pilot/early-access CTA.
- [ ] Add footer with real product/contact destinations once decided.
- [ ] Replace every placeholder email/copy/URL.
- [ ] Make every major homepage section visually distinct without becoming a collection of unrelated cards.
- [ ] Add subtle scroll/reveal motion with reduced-motion support.
- [ ] Audit page for generic AI/SaaS visual clichés and remove them.

**Phase 2 acceptance:** homepage alone communicates the product in under 20 seconds, looks deliberate on desktop/mobile, and gives a credible live preview of the interaction model.

---

## Phase 3 — Observer: meaningful visitor behavior tracking

Create `src/salesman/observer/`.

- [ ] Define typed `VisitorEvent` model from `docs/ARCHITECTURE.md`.
- [ ] Generate stable anonymous session ID per browser session.
- [ ] Track page view + route changes.
- [ ] Track meaningful section visibility using IntersectionObserver.
- [ ] Track product/service entity views by explicit `data-sales-entity` attributes.
- [ ] Track revisit counts.
- [ ] Track compare add/remove.
- [ ] Track filter changes.
- [ ] Track meaningful price/spec views.
- [ ] Track CTA views/clicks.
- [ ] Track form/booking start and abandon through explicit integration hooks.
- [ ] Track salesman impression/click/dismiss/ignored events.
- [ ] Track Experience Box answers/completion/conversion.
- [ ] Do **not** track raw mouse movement or every scroll pixel.
- [ ] Add debug event inspector in `/playground` only.
- [ ] Add tests for duplicate event suppression and revisit logic.

**Phase 3 acceptance:** a realistic HPL browsing session produces a clean event timeline containing only useful behavioral signals.

---

## Phase 4 — Session memory reducer

Create `src/salesman/memory/`.

- [ ] Implement typed `SessionMemory` model.
- [ ] Implement event reducer from `VisitorEvent[] → SessionMemory`.
- [ ] Track viewed entities, visit counts and dwell buckets.
- [ ] Track compare shortlist.
- [ ] Track selected filters.
- [ ] Track answers from Experience Box.
- [ ] Track conversion stage.
- [ ] Track salesman intervention history.
- [ ] Track suppression level based on ignored/dismissed interventions.
- [ ] Add sessionStorage persistence and restore.
- [ ] Ensure memory does not contain unnecessary raw PII.
- [ ] Build concise `summarizeMemoryForModel()` serializer with token-conscious output.
- [ ] Add fixture tests for HPL, yacht, law and homepage sessions.
- [ ] Add a development-only memory panel in `/playground`.

**Phase 4 acceptance:** refreshing within a session preserves relevant memory and model summaries remain compact/readable.

---

## Phase 5 — Decision scheduler + deterministic guardrails

Create `src/salesman/decision/`.

- [ ] Implement `shouldConsiderDecision(memory, event)`.
- [ ] Trigger only on meaningful state change, hesitation, abandonment, explicit help, or cooldown expiry with new context.
- [ ] Debounce event bursts.
- [ ] Add minimum model-call interval.
- [ ] Add configurable intervention cooldown.
- [ ] Prevent calls while Experience Box is active unless explicitly required.
- [ ] Suppress proactive behavior while visitor is typing/submitting.
- [ ] Implement suppression levels 0–3.
- [ ] Implement duplicate/semantic-repeat detection for recent intervention ideas.
- [ ] Add maximum proactive interventions per session.
- [ ] Add `SILENT` deterministic fallback.
- [ ] Add tests: normal browsing stays mostly silent; strong repeated comparison can trigger; two ignores suppress.

**Phase 5 acceptance:** model-call volume is low and deliberate, and the scheduler is capable of long periods of silence.

---

## Phase 6 — Gemini decision API + robust model routing

Refactor `/functions/api/salesman.js` into production-quality server modules or equivalent maintainable Pages Functions.

- [ ] Create explicit `POST /api/decision` contract.
- [ ] Send niche playbook + verified facts + compact memory + triggering signal.
- [ ] Return structured `SalesmanDecision`.
- [ ] Validate output schema before returning to browser.
- [ ] Keep model chain: `gemma-4-26b-a4b-it → gemma-4-31b-it → gemini-3.1-flash-lite → gemini-3.5-flash-lite`.
- [ ] Fall through on rate/quota/transient/unavailable failures.
- [ ] Do not retry blindly on auth/permission failures.
- [ ] Add request timeout per model attempt.
- [ ] Add overall request deadline so fallback cannot make UI feel frozen.
- [ ] Add request-size limits.
- [ ] Add output-length limits.
- [ ] Add server-side prompt-injection resistance: visitor content is data, not system policy.
- [ ] Add task/model/latency/fallback diagnostic fields for development.
- [ ] Never send diagnostics that expose secret or hidden prompt to production UI.
- [ ] Verify model chain with a mocked 429 on first model.
- [ ] Verify all-model failure degrades to silence.
- [ ] Confirm current key type remains supported by Gemini API before September 2026 migration deadline.

**Phase 6 acceptance:** decision API reliably returns validated `silent/intervene` decisions and automatically survives first-model rate limits.

---

## Phase 7 — Ambient salesman presence

Create `src/salesman/presence/`.

- [ ] Build desktop contextual presence component.
- [ ] Build mobile compact bottom presence.
- [ ] Presence must not cause CLS.
- [ ] Support contextual anchoring to entity/card/section when possible.
- [ ] Support generic viewport-edge placement when anchoring is inappropriate.
- [ ] Add single clear dismissal.
- [ ] Add impression tracking only when actually visible.
- [ ] Add ignored-state detection after a reasonable view window, not instantly.
- [ ] Add clicked state and clean transition into Experience Box.
- [ ] Build subtle niche-specific brand presence variants.
- [ ] Do not use a childish cartoon on law/yacht skins.
- [ ] HPL may use a tasteful minimal material spirit only if it passes premium visual review.
- [ ] Make intervention copy one glance long; clamp overly verbose model output.
- [ ] Add aria live behavior that does not aggressively interrupt screen readers.
- [ ] Test presence near browser safe areas and mobile keyboards.

**Phase 7 acceptance:** presence feels integrated with the host page, can be ignored easily, and never looks like a generic support bubble.

---

## Phase 8 — Experience Box engine + component registry

Create `src/salesman/experience/`.

- [ ] Build `ExperienceBox` state machine.
- [ ] Build component registry and schema validator.
- [ ] Add `SingleSelectCards`.
- [ ] Add `MultiSelectChips`.
- [ ] Add `YesNo`.
- [ ] Add `QuantityStepper`.
- [ ] Add `RangeSelector`.
- [ ] Add `ProductCard` / `ProductGrid`.
- [ ] Add `ProductCompare`.
- [ ] Add `RecommendationReason`.
- [ ] Add `ImageChoice` / `SwatchChoice`.
- [ ] Add `UploadImage` placeholder integration contract.
- [ ] Add `DatePicker`.
- [ ] Add `TimeSlots`.
- [ ] Add `AddOns`.
- [ ] Add `LeadCapture`.
- [ ] Add `RequestSample`.
- [ ] Add `RequestQuote`.
- [ ] Add `BookConsultation`.
- [ ] Add `CallOrWhatsApp`.
- [ ] Add `FAQAnswer` / reassurance card.
- [ ] Build signature presence → Experience Box morph animation.
- [ ] Build mobile bottom-sheet/full-sheet presentation.
- [ ] Manage focus correctly on open/close/step changes.
- [ ] Ensure all answers feed shared session memory immediately.
- [ ] Ensure closing the box does not lose learned preferences.
- [ ] Add deterministic fallback flows when AI planning is unavailable.

**Phase 8 acceptance:** `/playground` can render/test every component and a multi-step experience can adapt without using a chat transcript.

---

## Phase 9 — Experience planner API

- [ ] Create `POST /api/experience`.
- [ ] Define strict allowed `ExperiencePlan` schema.
- [ ] Give planner current memory + allowed component IDs + verified niche data.
- [ ] Planner must ask only for genuinely missing information.
- [ ] Reject unknown component types.
- [ ] Reject arbitrary HTML/JS/CSS.
- [ ] Reject product/entity IDs that do not exist in the deterministic dataset.
- [ ] Add max component count per plan.
- [ ] Add loop protection so planner cannot ask the same question repeatedly.
- [ ] Add plan caching within a step/session where safe.
- [ ] Test with each of the four models/fallback normalization.

**Phase 9 acceptance:** AI can choose a useful next component while the renderer remains deterministic and safe.

---

## Phase 10 — HPL production vertical

Create `src/niches/hpl/` and make `/hpl` a believable real website/demo first, product explanation second.

### Demo catalog

- [ ] Build 18–30 realistic fictional/demo HPL SKUs.
- [ ] Add swatch/image assets with consistent art direction.
- [ ] Add categories/color/finish/application metadata.
- [ ] Add verified demo properties used for matching.
- [ ] Add sample/quote eligibility.
- [ ] Add product listing with filters.
- [ ] Add product detail behavior.
- [ ] Add compare tray.
- [ ] Add application inspiration sections.

### Salesman behavior

- [ ] Configure HPL signal weights/playbook.
- [ ] Detect repeated swatch/product interest.
- [ ] Detect application context.
- [ ] Detect spec/cleaning/usage focus.
- [ ] Add HPL-specific factual guardrail validation.
- [ ] Write tests ensuring unsupported specs are never surfaced.

### HPL Experience Box

- [ ] Skip questions already answered by browsing behavior.
- [ ] Application/project selector when needed.
- [ ] Style/visual preference.
- [ ] light/dark preference.
- [ ] room size.
- [ ] lighting condition.
- [ ] verified usage need(s).
- [ ] product shortlist.
- [ ] compare recommended products.
- [ ] show short grounded “why” reasons.
- [ ] sample-request flow.
- [ ] quote/project-enquiry flow.
- [ ] contact-engineer/sales handoff.
- [ ] feed all answers/actions back to memory.

### HPL conversion UX

- [ ] Build polished request-sample completion state.
- [ ] Build quote summary with selected SKUs/context.
- [ ] Do not ask the visitor to re-enter data already captured.
- [ ] Add Arabic/RTL demo toggle if schedule permits after English quality is complete.

**Phase 10 acceptance:** a visitor can browse normally, receive a contextually generated intervention, click, visually narrow materials, compare, and complete a sample/quote action end-to-end.

---

## Phase 11 — Homepage salesman: dogfood the product

- [ ] Instrument homepage sections/niche visits.
- [ ] Add homepage-specific memory inference.
- [ ] Generate ambient interventions from actual homepage behavior.
- [ ] Remember ignored homepage intervention and adapt.
- [ ] Build homepage Experience Box lead-qualification flow.
- [ ] Ask business/site type visually.
- [ ] Ask conversion goal visually.
- [ ] Ask biggest visitor friction only if useful.
- [ ] Accept website URL.
- [ ] Generate a short tailored recommended product configuration.
- [ ] Only then ask for name/work email/company.
- [ ] Create server-side lead endpoint.
- [ ] Add persistence adapter (Cloudflare D1 preferred once binding is created).
- [ ] Validate/sanitize all lead fields.
- [ ] Add spam/abuse protection strategy.
- [ ] Add success state and next step.
- [ ] Remove `mailto:hello@example.com` placeholder.

**Phase 11 acceptance:** the product homepage itself produces a qualified lead through the same ambient-salesman → Experience Box architecture we sell.

---

## Phase 12 — Yacht charter dedicated demo

- [ ] Build believable luxury yacht charter page, not a SaaS case-study mockup.
- [ ] Add fictional demo fleet with grounded capacity/price/amenity data.
- [ ] Add date/time/party selection demo data.
- [ ] Instrument vessel comparison + price hesitation + booking-start events.
- [ ] Configure yacht salesman rules.
- [ ] Build better-fit vessel recommendation experience.
- [ ] Build time-slot/occasion/add-on components.
- [ ] Never fake availability/scarcity/hold states.
- [ ] Add booking summary conversion action.
- [ ] Add explanation section below the live demo showing what the salesman observed.

**Phase 12 acceptance:** page demonstrates the same core engine in a high-ticket booking context without becoming a normal booking wizard.

---

## Phase 13 — Law-firm dedicated demo

- [ ] Build believable premium law-firm website/demo.
- [ ] Add fictional practice areas/lawyers/office/jurisdiction demo data.
- [ ] Instrument practice-area, lawyer-profile and consultation behavior.
- [ ] Configure strict intake/routing playbook.
- [ ] Add legal-safety response validator.
- [ ] Build matter-category component.
- [ ] Build location/jurisdiction selector from configured data only.
- [ ] Build deterministic lawyer/team match cards.
- [ ] Build consultation time/lead handoff.
- [ ] Add clear disclaimer where appropriate without making the UI alarming.
- [ ] Test prompts trying to elicit legal advice; assistant must remain intake/routing only.

**Phase 13 acceptance:** visitor can be routed to an appropriate demo consultation path without the AI giving legal advice or predicting outcomes.

---

## Phase 14 — Lead + event persistence

- [ ] Create storage adapter interface so product is not tightly coupled to one database.
- [ ] Implement Cloudflare D1 adapter when `LEADS_DB` binding is available.
- [ ] Schema: leads, sessions (minimal), conversions, model diagnostics; avoid raw surveillance data.
- [ ] Add migrations/document setup.
- [ ] Store qualified homepage lead context.
- [ ] Store conversion action + source intervention ID.
- [ ] Store model routing diagnostics without raw PII.
- [ ] Add retention/privacy notes.
- [ ] Add server-side validation and basic rate limits.

**Phase 14 acceptance:** leads/conversions survive browser close and can be attributed to a salesman interaction without storing unnecessary sensitive behavior.

---

## Phase 15 — Measurement + experimentation

- [ ] Define control group where ambient salesman is disabled.
- [ ] Define intervention experiments without changing factual rules.
- [ ] Track intervention impression/click/dismiss/ignore.
- [ ] Track Experience Box start/step/complete.
- [ ] Track assisted conversions.
- [ ] Track direct conversions for comparison.
- [ ] Track model fallback/latency.
- [ ] Build internal `/playground` metrics panel for test sessions.
- [ ] Add dev-only “why did the salesman speak?” explanation.
- [ ] Never expose chain-of-thought; internal reason should be a short operational reason from the output contract.

**Phase 15 acceptance:** we can answer “Did the salesman improve conversion and did it annoy people?” with data.

---

## Phase 16 — Security, privacy, trust

- [ ] Verify no API secret appears in browser source/maps/build artifacts.
- [ ] Add origin/request validation suitable for Pages deployment.
- [ ] Add per-IP/session abuse controls for expensive AI endpoints.
- [ ] Limit free-text payload lengths.
- [ ] Treat webpage/visitor text as untrusted prompt data.
- [ ] Prevent model output from invoking arbitrary actions.
- [ ] Add content-security policy plan compatible with embedding requirements.
- [ ] Document session memory behavior.
- [ ] Do not persist cross-session visitor profile without explicit privacy/consent design.
- [ ] Add “disable proactive assistant” user control if persistent memory is introduced.
- [ ] Review law-firm demo for legal-safety boundaries.
- [ ] Review HPL for fabricated specs.
- [ ] Review yacht for fabricated availability/scarcity.

**Phase 16 acceptance:** threat/privacy review passes and the AI cannot turn model text into arbitrary browser actions.

---

## Phase 17 — Performance + accessibility polish

- [ ] Lighthouse/performance audit on production-like preview.
- [ ] Prevent initial render from waiting on AI.
- [ ] Code-split heavy Experience Box/niche modules if beneficial.
- [ ] Optimize images/responsive sources.
- [ ] Pre-size all media to eliminate CLS.
- [ ] Maintain smooth 60fps transitions on realistic mobile hardware.
- [ ] Test slow 3G/slow AI response.
- [ ] Test AI endpoint failure.
- [ ] Full keyboard flow.
- [ ] Screen-reader dialog/focus review.
- [ ] Reduced-motion review.
- [ ] 200% zoom review.
- [ ] Test 320px width.
- [ ] Test mobile keyboard opening over Experience Box.
- [ ] Test RTL component layout.

**Phase 17 acceptance:** product remains fast, usable and polished under adverse conditions, not only on a developer laptop.

---

## Phase 18 — Final product QA + launch readiness

- [ ] Remove all placeholders/demo-debug labels from production surfaces unless explicitly part of a demo.
- [ ] Ensure fictional niche demo data is not presented as a real business claim.
- [ ] Verify every CTA destination.
- [ ] Verify every route direct-loads on Cloudflare.
- [ ] Verify preview and production environment secrets separately.
- [ ] Test first-model 429 failover in deployed environment if possible.
- [ ] Test all-model failure.
- [ ] Review mobile UI manually across all four routes.
- [ ] Review copy for spammy/creepy salesman language.
- [ ] Verify ignored prompt memory behavior.
- [ ] Verify completed conversion suppresses redundant selling.
- [ ] Confirm page analytics/lead persistence work.
- [ ] Run `npm run check` and `npm run build` cleanly.
- [ ] Update README screenshots/setup once final UI exists.
- [ ] Close all build issues only when their acceptance criteria are met.

**Final acceptance:** the live site demonstrates a genuinely adaptive AI salesman, HPL works end-to-end, homepage uses the product to capture leads, niche pages prove portability, and the experience is polished enough to use in outbound demos.
