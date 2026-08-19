# Cloudflare Pages Deployment

This repository deploys a Vite frontend plus Pages Functions under `/functions`.

## Pages project setup

- Repository: `addvaluewithai-hub/booking-wizard-ai-salesman`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Runtime Node version: pinned in `.node-version`

`public/_redirects` provides SPA routing fallback. `public/_headers` applies the standalone Pages security-header/CSP policy.

## Gemini secret

Cloudflare Pages direct Git integration does **not** inherit GitHub Actions secrets at runtime.

In **Settings → Variables and Secrets** add `GEMINI_API_KEY` as an encrypted secret for both:

- Preview
- Production

Redeploy after adding or changing the secret. Pages Functions read only `context.env.GEMINI_API_KEY`.

Never create `VITE_GEMINI_API_KEY`; Vite-prefixed values are browser-exposed. CI scans `src/` and the built `dist/` for Gemini credential/provider markers.

## D1 binding and migrations

Create a D1 database and bind it to the Pages project using the exact variable name:

```text
DB
```

Configure the binding for Preview and Production. Apply migrations in order:

1. `migrations/0001_leads.sql` — qualified leads
2. `migrations/0002_conversion_events.sql` — anonymous semantic events
3. `migrations/0003_attribution_and_model_diagnostics.sql` — experiment assignment, assisted-conversion attribution, and model-routing diagnostics

The third migration is additive. Lead and base event persistence remain functional if it is temporarily pending; attribution/diagnostic writes are best-effort until its tables exist.

## Pages Functions

Current public routes include:

- `GET /api/health` — non-secret runtime/readiness metadata
- `POST /api/decision` — validated ambient `silent/intervene` decision
- `POST /api/experience` — validated trusted component plan or deterministic fallback signal
- `POST /api/lead` — validated qualified-lead persistence
- `POST /api/event` — anonymous semantic event/attribution persistence
- `GET|POST /api/salesman` — legacy-compatible model-router endpoint retained during migration

Model/provider calls happen only inside Pages Functions. Public write/model endpoints apply same-origin checks, request-size limits, validation, and best-effort rate controls.

## Automated Preview verification

Every pull request runs the normal code gates, then the Cloudflare Preview smoke script. It waits until the branch Preview reports the exact PR head commit and verifies:

```text
/
/hpl
/yachts
/law-firms
/playground
/api/health
/api/decision
```

The smoke requires:

- the SPA routes to direct-load,
- Gemini to be configured server-side,
- D1 base schema readiness,
- one live validated model response through the fallback router.

## Automated Production verification

Every push to `main` runs the same code gates and then targets:

```text
https://booking-wizard-ai-salesman.pages.dev
```

The production smoke waits for `CF_PAGES_COMMIT_SHA` to equal the exact GitHub `main` commit before testing. This avoids treating a stale deployment as acceptance.

## Manual release review

Automated smoke is not a replacement for visual/device accessibility review. Before calling a launch fully accepted, manually review desktop/tablet/mobile layouts, keyboard and screen-reader dialog behavior, reduced motion, 200% zoom, mobile keyboard overlap, and representative slow-network behavior.

## Runtime health

`GET /api/health` intentionally returns booleans and deployment identifiers only. It must not reveal secret values or model prompts.

## Privacy and retention

See [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md). Persistent storage is intentionally limited to qualified leads, anonymous semantic events/experiment/attribution records, and privacy-safe model-routing diagnostics. Session memory remains session-scoped unless a separate consent/retention design is introduced.

## Official Cloudflare references

- Pages Functions: https://developers.cloudflare.com/pages/functions/
- Pages Functions bindings/secrets: https://developers.cloudflare.com/pages/functions/bindings/
- D1: https://developers.cloudflare.com/d1/
- Vite Pages deployment: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
