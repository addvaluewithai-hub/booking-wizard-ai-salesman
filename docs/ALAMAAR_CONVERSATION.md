# Al Amaar visual chat concierge

The `/alamaar` experience is a guided visual chat. Known choices stay deterministic; free text is interpreted by a server-side AI layer.

## Interaction model

- Known quick replies use deterministic UI state and never need a model call.
- Exact typed equivalents of known choices are resolved locally by `chatBridge.ts`.
- Only ambiguous/freeform messages call `/api/alamaar-chat`.
- The live mascot communicates with micro-expression states while the model is thinking.
- The client keeps ownership of navigation, rendering and product URLs.

## Core AI rule: model chooses data, never components

The model is not allowed to emit JSX, HTML, CSS, URLs or arbitrary component names. It can only return JSON for a small application-owned component registry.

The registry currently contains four renderers:

```ts
type AiUiBlock =
  | { type: 'flow_choices'; data: { stepKey: AnswerKey; optionIds: string[] } }
  | { type: 'suggestions'; data: { items: Array<{ id: string; label: string; value: string }> } }
  | { type: 'products'; data: { productIds: string[] } }
  | { type: 'actions'; data: { actionIds: Array<'sample' | 'whatsapp' | 'shop'> } };
```

`AiUiRenderer.tsx` owns the real React components. The AI only fills their data.

### Why this matters

- `flow_choices` can only reference values already present in `STEPS`.
- `products` can only reference product IDs from the catalog snapshot supplied with the request; the renderer resolves the real image, code and URL locally.
- `actions` can only use fixed application-owned action IDs, so the model cannot invent links.
- `suggestions` are short custom clarification chips. Clicking one sends its value back through the same freeform path rather than mutating flow state directly.

Both the server endpoint and the browser normalize/validate model output. Invalid blocks or invented IDs are dropped.

## Structured response

The validated model response is:

```ts
type AiConversationResponse = {
  intent: 'answer' | 'question' | 'clarify' | 'recommend';
  reply: string;
  updates: Array<{
    key: 'project' | 'style' | 'tone' | 'application';
    value: string;
    label: string;
  }>;
  ui: AiUiBlock[];
};
```

The server asks the model for `key + value`; the browser rebuilds the canonical visible label from `STEPS`. The model does not control labels for structured answers.

When one or more validated updates arrive, the client merges them and computes the first unanswered guided step itself. The model does not get direct control over routing indexes.

## Product grounding

The AI receives only a compact catalog snapshot: `id`, `name`, `code`, `family`, and `tone`. It may choose IDs to render, but it may not invent product fields or technical performance claims. Questions about unsupported durability, fire/water resistance, dimensions, stock or certifications should stay explicitly unverified and can surface a fixed WhatsApp/sample/shop action instead.

## Server boundary

`functions/api/alamaar-chat.js` uses the existing server-side model router with `context.env.GEMINI_API_KEY` and same-origin/rate-limit guards. The key is never bundled into Vite and the browser never calls Gemini directly.

A GitHub Actions secret by itself is not a browser runtime secret. The deployed Cloudflare environment must expose `GEMINI_API_KEY` to the Pages Function/Worker runtime.
