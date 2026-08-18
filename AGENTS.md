# AI Agent Execution Guide

This repository is intended to be completed by an autonomous coding agent. Work through the product deliberately; do not turn it into a generic chatbot or a normal booking wizard.

## Read before coding

Read these files in this exact order:

1. `README.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/AI_SALESMAN.md`
5. `docs/EXPERIENCE_BOX.md`
6. `docs/DESIGN_SYSTEM.md`
7. `docs/NICHES.md`
8. `docs/GEMINI_ROUTING.md`
9. `docs/CLOUDFLARE.md`
10. `TASKS.md`

## Non-negotiable product rules

- There are **two layers**:
  1. Ambient AI Salesman before the visitor clicks.
  2. Structured Interactive Experience Box after the visitor clicks.
- The ambient layer must be capable of choosing **silence**. It should not constantly prompt.
- Final intervention copy must be generated from current behavior + memory, not selected from a fixed list of timer-based messages.
- A visitor ignoring a prompt is meaningful memory. Respect it and change future behavior.
- The experience box is not a scrolling chat transcript. It is a renderer for structured visual components chosen for the current context.
- AI language can be dynamic; factual product data, availability, pricing, specifications, legal boundaries and business rules must come from deterministic data/rules.
- Never invent scarcity, discounts, stock, availability, specs, prices, legal outcomes, medical outcomes, or business claims.
- Never expose `GEMINI_API_KEY` or other secrets to browser JavaScript.
- Every AI API call must be server-side through `/functions`.
- The site itself must use the AI Salesman on the homepage to generate our own leads.
- The initial production-quality vertical is HPL / decorative materials.
- Yacht charter and law-firm pages are dedicated vertical demos using the same core engine, not separate products.

## UX quality bar

Treat visual and interaction quality as a core product requirement, not a cleanup task.

The target feel is:

- quiet confidence
- premium but not ornamental
- fast and tactile
- precise motion
- no generic SaaS gradients everywhere
- no giant chatbot window
- no childish mascot by default
- no modal overload
- no UI movement that makes the page harder to use
- no layout shift when the salesman appears

The salesman presence should feel like a sophisticated brand character/presence whose personality comes mostly from timing, copy, memory and behavior. Individual niches may have their own visual identity.

## Development workflow

For each task in `TASKS.md`:

1. Understand the acceptance criteria before changing code.
2. Implement the smallest coherent production-quality slice.
3. Run `npm install` if dependencies changed.
4. Run `npm run check`.
5. Run `npm run build`.
6. Test desktop and mobile behavior manually or with the available browser/testing tooling.
7. Verify no secret is present in built client assets.
8. Update the checklist in `TASKS.md` only when acceptance criteria are actually met.
9. Commit with a descriptive message.
10. Prefer a branch + PR for meaningful UI/architecture phases so Cloudflare can provide preview URLs.

Do not mark future work complete just because placeholder UI exists.

## Definition of done for the whole project

The project is not done until:

- Homepage is polished and production-ready.
- Homepage AI Salesman observes behavior, remembers the session, makes intervention decisions dynamically, and captures qualified leads.
- HPL vertical is end-to-end and production quality.
- HPL Experience Box contains real adaptive components and produces sample/quote/contact actions.
- Yacht and law-firm vertical pages demonstrate the same engine credibly.
- Model routing/fallback works across the four configured free-quota models.
- Cloudflare preview and production deployments work.
- Core Web Vitals/performance are excellent on realistic mobile conditions.
- Accessibility, reduced-motion, keyboard navigation, error states and loading states are implemented.
- Event instrumentation makes it possible to measure prompt views, prompt clicks, experience completion and conversion actions.
- Privacy/consent behavior is explicit for any memory persisted beyond the browser session.
- All checks in `TASKS.md` are complete.

## When uncertain

Prefer product behavior that feels like a skilled human salesperson who knows when to leave someone alone.

A useful intervention beats a frequent intervention.
A visual choice beats a paragraph.
A deterministic fact beats an AI guess.
A smooth page-native interaction beats a chatbot window.
