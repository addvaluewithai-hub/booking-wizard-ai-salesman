# Booking Wizard AI Salesman

An AI-native conversion layer for websites.

The product has **two distinct layers** that work together:

1. **AI Salesman (ambient layer)** — observes meaningful visitor behavior, maintains session memory, decides whether to stay silent or intervene, and writes a contextual one-line message designed to be useful at that exact moment.
2. **Interactive Experience Box (engaged layer)** — opens after engagement. It is not a chat transcript. The AI chooses from a trusted structured UI registry while deterministic product/business data remains authoritative.

The repository now includes a production-style **HPL / decorative materials** vertical, dedicated **yacht charter** and **law-firm** demos, and a product homepage that dogfoods the same salesman → Experience Box architecture.

## Product principle

> Observe → understand → remember → decide whether to speak → engage with one useful line → open an adaptive visual experience → convert.

Silence is a valid and common decision. The product must not behave like a generic chatbot, hard-coded pop-up, or aggressive sales widget.

## Start here

AI coding agents should read these files in order:

1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md)
3. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
4. [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
5. [`TASKS.md`](./TASKS.md)

Security/privacy boundaries are documented in [`docs/SECURITY_PRIVACY.md`](./docs/SECURITY_PRIVACY.md).

## Routes

- `/` — product homepage using the product to qualify/capture leads
- `/hpl` — fictional HPL/decorative-materials customer site and primary vertical demo
- `/yachts` — fictional luxury yacht-charter customer site/demo
- `/law-firms` — fictional premium law-firm intake/routing site/demo
- `/playground` — internal behavior, memory, metrics, design-system and complete Experience component test surface

## Local development

The project pins Node in `.node-version` so local/CI/Cloudflare runtimes stay aligned.

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `/functions`

### Required runtime configuration

1. Add `GEMINI_API_KEY` as an encrypted Cloudflare Pages secret for **Preview and Production**.
2. Create a Cloudflare D1 database and bind it to the Pages project as **`DB`** for Preview and Production.
3. Apply the SQL migrations in order:

```text
migrations/0001_leads.sql
migrations/0002_conversion_events.sql
migrations/0003_attribution_and_model_diagnostics.sql
```

The first two migrations are required for lead/event persistence. Migration 0003 adds privacy-safe experiment assignment, assisted-conversion attribution and model-routing diagnostics; the application treats that schema as additive so core event/lead writes do not fail if the third migration is temporarily pending.

`GET /api/health` reports only non-secret readiness booleans plus Cloudflare deployment branch/commit. It never returns the API key.

See [`docs/CLOUDFLARE.md`](./docs/CLOUDFLARE.md) for the deployment contract.

## Gemini model fallback chain

The server router uses this ordered chain:

1. `gemma-4-26b-a4b-it`
2. `gemma-4-31b-it`
3. `gemini-3.1-flash-lite`
4. `gemini-3.5-flash-lite`

Transient/rate/quota/unavailable failures fall through to later models. The router budgets the overall deadline across remaining models so slow early attempts cannot starve the later fallbacks. If all models fail, the ambient decision layer degrades safely to silence and the Experience Box can use deterministic fallback plans.

## Persistence and measurement

- Qualified leads are validated server-side before storage.
- Browser analytics contain semantic events plus a session-scoped anonymous ID; raw mouse movement and pixel-by-pixel scroll are not tracked.
- A deterministic session experiment helper supports a control group where proactive interventions are disabled while explicit help remains available. Hosts opt in with `controlGroupPercent`; the default is treatment-only.
- Assisted conversions can be attributed to a recent clicked intervention without storing raw visitor content.
- Model diagnostics contain task/model/fallback/latency/success fields only — no prompts, chain-of-thought or lead PII.

## CI and deployment gates

Pull requests run:

- dependency install + high-severity audit,
- TypeScript check,
- automated tests,
- production build,
- browser secret/provider-boundary scan,
- Cloudflare branch Preview smoke test.

The smoke test waits for the exact Git commit, checks `/`, `/hpl`, `/yachts`, `/law-firms`, `/playground`, validates Gemini/D1 readiness, and requires one live `/api/decision` response from the model router.

Pushes to `main` run the same code gates plus a Cloudflare **Production** smoke against `https://booking-wizard-ai-salesman.pages.dev` once that exact commit is deployed.

## Current state

The shared observer → session memory → scheduler → model router → ambient presence → structured Experience Box pipeline is implemented across all four public experiences. HPL, yachts and law use deterministic fictional datasets so demos do not imply real product specifications, availability, scarcity or legal outcomes.

`TASKS.md` remains the acceptance checklist. Code-complete items should only be checked when their stated acceptance criteria are actually verified; manual device, screen-reader, Lighthouse and visual QA are intentionally not treated as complete just because CI passes.
