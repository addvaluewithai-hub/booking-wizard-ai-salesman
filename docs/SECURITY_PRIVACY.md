# Security, privacy, retention, and embedding boundaries

This product deliberately separates browser behavior capture from server-only model and storage capabilities. The browser observes a small set of semantic sales signals; Cloudflare Pages Functions own model credentials, persistence, validation, and abuse controls.

## Secret boundary

- `GEMINI_API_KEY` is a Cloudflare encrypted secret and is read only from `context.env` under `/functions`.
- Browser code under `src/` must never reference `GEMINI_API_KEY`, `x-goog-api-key`, or the Gemini provider endpoint directly.
- The browser talks only to same-origin product endpoints such as `/api/decision`, `/api/experience`, `/api/lead`, and `/api/event`.
- CI performs a browser-boundary scan after build so provider credentials/provider-call markers cannot silently enter `src/` or `dist/`.

## Session memory

Session memory is intentionally session-scoped. It uses `sessionStorage`, so it survives a reload in the same tab/session but is not designed as a durable cross-session visitor profile.

Stored session memory contains useful sales context such as:

- page/section/entity interest,
- compare/filter state,
- Experience Box answers,
- inferred stage/hesitation/price sensitivity,
- intervention history and suppression level.

It does not intentionally store raw mouse movement, every scroll position, keystroke streams, hidden page content, or raw uploaded files. Upload integrations return an opaque asset ID; the local filename/file object is not written into session memory.

A durable cross-session profile must not be introduced without a separate consent, disclosure, retention, deletion, and disable-control design.

## Server persistence

The storage adapter currently uses the Cloudflare D1 `DB` binding, but API handlers call an adapter contract rather than issuing D1 statements directly.

Persistent data is intentionally narrow:

- `leads`: explicit qualified lead/contact fields plus compact lead context;
- `conversion_events`: anonymous semantic event records;
- `session_experiments`: anonymous control/treatment assignment;
- `conversion_attribution`: conversion kind plus optional source intervention ID and assisted flag;
- `model_diagnostics`: task, selected model, fallback count, latency, success flag, anonymous session ID when available.

Model prompts, hidden system policy, chain-of-thought, raw page text, and raw uploaded files are not written to the diagnostics tables.

## Pilot retention plan

Until customer-specific policy replaces these defaults, use the following operational targets:

- model diagnostics: 30 days;
- anonymous semantic events, experiment assignment, and conversion attribution: 90 days;
- qualified leads: retain only as long as required for the active sales process and the customer's documented CRM/privacy policy.

These are policy targets, not an automatic deletion promise. Production launch should pair them with a scheduled cleanup/export process appropriate to the customer and jurisdiction.

## Abuse and input boundaries

Public write/model endpoints use same-origin checks, request-size limits, field/schema validation, and best-effort per-IP rate limits. Visitor/page data is marked as untrusted data in model prompts and cannot override system policy.

The Experience Box renderer accepts only the trusted component union. Model output cannot execute HTML, JavaScript, CSS, arbitrary browser actions, arbitrary contact destinations, or invented entity IDs. Contact links come only from deterministic host configuration. Recommendation facts come from deterministic entity attributes.

## CSP and embedding plan

`public/_headers` applies a restrictive CSP to this standalone Pages application:

- scripts and network connections are same-origin only;
- objects are disabled;
- forms post only to self;
- images may come from self, data URLs, or HTTPS sources because deterministic niche catalogs may use hosted media;
- inline styles remain allowed because trusted React components use dynamic style attributes for configured swatches/images.

`frame-ancestors` is intentionally not fixed in the current CSP. The long-term product vision is host-site integration through a small script/component contract rather than an arbitrary iframe, and embedding policy must be chosen per customer deployment. When iframe embedding is introduced, use an explicit customer-origin allowlist rather than `*`.

## Product safety boundaries

- HPL: only configured demo/product facts may be surfaced; unsupported specifications are rejected by data grounding.
- Yacht: fictional demo fleet/price/slot data must not be represented as real-time availability, scarcity, or holds.
- Law: the assistant is intake/routing only and must not provide legal advice, predict outcomes, value claims, or invent deadlines.

These constraints belong in deterministic validation as well as prompts; prompts alone are not treated as a security boundary.
