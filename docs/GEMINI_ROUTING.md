# Gemini / Gemma Model Routing

## Goal

Use the free-quota model pool efficiently while keeping the product responsive and resilient.

The API key must stay server-side inside Cloudflare Pages Functions.

## Configured model chain

Use this order initially:

1. `gemma-4-26b-a4b-it`
2. `gemma-4-31b-it`
3. `gemini-3.1-flash-lite`
4. `gemini-3.5-flash-lite`

The project owner supplied these quota characteristics:

| Model | TPM | RPD |
|---|---:|---:|
| Gemma 4 26B | 16K | 14.4K |
| Gemma 4 31B | 16K | 14.4K |
| Gemini 3.1 Flash Lite | 250K | 500 |
| Gemini 3.5 Flash Lite | 250K | 500 |

Treat these numbers as account-specific operational inputs and verify in the provider dashboard when debugging quota behavior.

## Why this order

For frequent lightweight website-salesman decisions, the Gemma quota pool provides a much larger daily request allowance. Use the Flash-Lite models as later fallbacks when the Gemma pool is rate-limited/unavailable or when a task explicitly needs capabilities better supported by Flash-Lite.

Future optimization can route by task type rather than only failover.

## Current server route

`functions/api/salesman.js`

It calls:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

with `x-goog-api-key` and the secret from `context.env.GEMINI_API_KEY`.

## Failover rules

Try the next model on:

- 429 quota/rate limit
- 408/409 transient request state
- 5xx provider error
- model unavailable/not found
- temporary provider/network failure

Do not blindly retry the whole chain on clear authentication/permission failures.

If every model fails:

- ambient salesman should stay silent or use a tiny deterministic safe fallback
- Experience Box should continue with deterministic UI/data when possible
- never block booking/sample/contact actions because the LLM is down

## Rate-limit efficiency

The most important optimization is **not calling a model for every browser event**.

Do this instead:

1. collect browser events locally
2. reduce them into session memory
3. run deterministic `shouldConsiderDecision()`
4. debounce meaningful event bursts
5. enforce a minimum AI decision interval
6. call the model only when there is new meaningful context

Target one decision call per meaningful moment, not one per scroll/click.

## Prompt size

Keep ambient decision prompts compact.

Preferred payload sections:

- business/niche rules
- current verified facts relevant to this visitor
- short session-memory summary
- last few intervention outcomes
- the new event/signal
- structured output requirement

Do not send full HTML pages or raw analytics history.

## Output format

For the decision endpoint, move toward structured JSON:

```json
{
  "action": "silent",
  "message": null,
  "internalReason": "Visitor is still browsing normally",
  "confidence": 0.78,
  "cooldownSeconds": 45
}
```

or:

```json
{
  "action": "intervene",
  "message": "You’ve come back to these two finishes twice. Want the one I’d choose for a small kitchen?",
  "internalReason": "Repeated comparison plus kitchen intent",
  "confidence": 0.91,
  "cooldownSeconds": 90,
  "experienceHint": "hpl_compare_for_kitchen"
}
```

Validate every model response server-side/client-side before rendering.

## Model-specific robustness

Do not assume all models behave identically with structured outputs.

Build a normalization layer:

```ts
interface ModelAdapterResult {
  model: string;
  rawText: string;
  parsed?: unknown;
  latencyMs: number;
  status: number;
}
```

If strict schema output is not available/reliable for a model, request JSON in the prompt and parse defensively.

Never render raw model-generated HTML.

## Observability

Track per request:

- model attempted
- fallback count
- HTTP status
- latency
- tokens if provider response exposes usage metadata
- task type (`decision`, `experience_plan`, `copy`, etc.)
- parsed/validation success

Do not log the API key or unnecessary PII.

## Security

- no `VITE_GEMINI_API_KEY`
- no key in client bundles
- no key in repository
- use Cloudflare encrypted secret `GEMINI_API_KEY`
- apply request-size limits
- validate origin/rate limit public endpoints before production traffic
- sanitize/limit any visitor-provided free text before putting it in prompts

## Key migration note

As of August 2026, Google AI documentation says new AI Studio keys default to authorization keys and standard keys are being phased out, with standard keys scheduled to be rejected in September 2026. Before launch, confirm this project's `GEMINI_API_KEY` is an authorization key/current supported key type.

Official references:

- Gemma on Gemini API: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- Gemini generateContent API: https://ai.google.dev/api/generate-content
- Gemini API key docs: https://ai.google.dev/gemini-api/docs/generate-content/api-key
- Gemini 3.1 Flash-Lite: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite
- Gemini 3.5 Flash-Lite: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
