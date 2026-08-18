# Booking Wizard AI Salesman

An AI-native conversion layer for websites.

The product has **two distinct layers** that work together:

1. **AI Salesman (ambient layer)** — observes the visitor's live behavior, maintains session memory, decides whether to stay silent or intervene, and writes a contextual one-line message designed to be useful at that exact moment.
2. **Interactive Experience Box (engaged layer)** — opens only after the visitor engages. It is not a normal chat transcript. The AI chooses from structured UI components such as product cards, visual choices, compare views, date/time pickers, upload, sample requests, quote requests, and booking/lead actions.

The first full vertical is **HPL / decorative materials**. The same core brain will also power dedicated demos for **yacht charter** and **law firms**, plus the product's own homepage salesman.

## Product principle

> Observe → understand → remember → decide whether to speak → engage with one useful line → open an adaptive visual experience → convert.

The AI must not behave like a generic chatbot, a hard-coded pop-up, or an annoying sales widget.

## Start here

AI coding agents should read these files in order:

1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md)
3. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
4. [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
5. [`TASKS.md`](./TASKS.md)

Then execute `TASKS.md` from top to bottom until every acceptance criterion is satisfied.

## Initial routes

- `/` — product homepage, using our own AI Salesman to convert visitors into leads
- `/hpl` — HPL / decorative-materials live demo (first production-quality vertical)
- `/yachts` — yacht charter demo
- `/law-firms` — law-firm intake/demo
- `/playground` — internal behavior + component test surface (not linked in production navigation)

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Cloudflare Pages

This repo is intentionally deployable to Cloudflare Pages.

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Pages Functions live in `/functions` and keep Gemini calls server-side.

**Important:** a GitHub Actions secret is not automatically available to a Cloudflare Pages Function when Pages is connected directly to GitHub. Add `GEMINI_API_KEY` as an encrypted Cloudflare Pages secret for both Preview and Production environments. See [`docs/CLOUDFLARE.md`](./docs/CLOUDFLARE.md).

## Gemini model fallback chain

The server router uses the free-quota models supplied for this project, in order:

1. `gemma-4-26b-a4b-it`
2. `gemma-4-31b-it`
3. `gemini-3.1-flash-lite`
4. `gemini-3.5-flash-lite`

On quota/rate/transient model failure it automatically tries the next model. It never exposes the API key to the browser.

## Current state

The repository contains an intentionally small deployable shell plus a detailed build plan. The shell exists so Cloudflare can be connected immediately and every subsequent PR can receive a preview URL while the AI agent builds the full product.
