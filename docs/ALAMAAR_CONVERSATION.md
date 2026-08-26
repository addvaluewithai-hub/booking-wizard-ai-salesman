# Al Amaar visual chat concierge

The `/alamaar` experience is a guided visual chat. Known choices stay deterministic; free text is interpreted by a server-side AI layer.

## Interaction model

- Known quick replies use deterministic UI state and never need a model call.
- Exact typed equivalents of known choices are resolved locally by `chatBridge.ts`.
- Only ambiguous/freeform messages call `/api/alamaar-chat`.
- The live mascot communicates with micro-expression states while the model is thinking.
- The application owns navigation, product selection, rendering, links and component choice.

## Core architecture

The system follows one rule:

> AI understands and advises. Engine decides. UI renders.

Gemini is a consultative material advisor and semantic interpreter, not a UI planner. It never emits JSX, HTML, CSS, URLs, component names, product IDs or route indexes.

Both button clicks and free text ultimately become domain meaning. A button already knows its meaning; free text needs Gemini to translate it.

```text
known button ───────────────┐
                            ├─> domain meaning -> conversation engine -> view effects -> React
free text -> Gemini events ─┘
```

This keeps one brain for application state and rendering: `conversationEngine.ts`.

## Consultative sales brain

`functions/_shared/alamaar-site-brain.js` is a curated, grounded commercial knowledge layer for the Al Amaar advisor. It contains only information the assistant is allowed to use as selling context:

- brand positioning and proof points: since 1996, official ACE MICA partnership, project support, nationwide support and brand-level ready-stock positioning
- material families: HPL, Foam Board, Plywood and Natural Wood with practical use contexts
- finish directions: wood, solid, stone and decorative with the spaces they are naturally suited to
- collection groupings such as Classic Wood, Solid Colors, Stone, Ruby Collection, Textile, Cane, Metallic and related directions
- selected project stories that can be used as restrained social proof when relevant
- a consultative sales method: discover only what changes the recommendation, recommend a direction, explain one reason, reduce risk, then offer one useful next move

The model is encouraged to sell through relevance rather than pressure. It should occasionally steer away from a weaker fit instead of praising every choice.

The advisor may proactively emit `product_request` when at least two clear preferences are already known and a small shortlist would genuinely help. The engine still selects the real product IDs. A simple clarification such as `يعني إيه؟` must never trigger product cards by itself.

The site brain deliberately separates brand proof from SKU-level claims. Brand-level ready stock does not mean a specific finish is currently available, and quality documentation does not mean every individual SKU carries every technical property.

## Semantic AI contract

The server returns a short reply plus semantic events only:

```ts
type AiSemanticEvent =
  | { type: 'answer'; field: AnswerKey; value: string }
  | { type: 'clarify_current_question'; candidates: Array<{ field: AnswerKey; value: string }> }
  | { type: 'ask_question'; topic: 'general' | 'product' | 'technical' }
  | { type: 'product_request'; criteria: { tone?: Tone; family?: Family; style?: string } }
  | { type: 'request_sample' }
  | { type: 'contact_human'; reason?: string }
  | { type: 'unknown' };

type AiInterpreterResponse = {
  reply: string;
  events: AiSemanticEvent[];
};
```

The model can emit multiple `answer` events when one message clearly contains several guided answers. It cannot choose the next question. After validated answers are merged, the engine computes the first unanswered guided step.

### Corrections are engine-owned too

If free text changes an earlier guided answer, the conversation engine treats later answers as dependent state. It clears stale downstream answers unless the same semantic turn explicitly supplies replacements for them.

Example: if the visitor previously chose `kitchen -> modern-dark -> dark` and later says `قصدي مكتب مش مطبخ`, Gemini only emits `{ type: 'answer', field: 'project', value: 'office' }`. The engine changes the project, clears the stale later answers, and resumes at the first unanswered field. If the visitor says `مكتب ومودرن فاتح`, both explicit answer events are preserved and only later unsupplied fields are cleared.

This rule prevents the model from silently leaving an internally inconsistent funnel state.

## Interrupt / resume

A message such as `يعني إيه؟` is an interruption inside the current step, not a new funnel node.

Gemini returns `clarify_current_question`; the engine keeps the same step active. The normal guided choices remain on screen after the explanation. If Gemini supplies a genuine 2-4 value ambiguity for the current field, the engine may convert those semantic candidates into a narrowed guided reply surface. Gemini still never names the component.

A candidate set equal to the full current step is deliberately ignored: the deterministic flow already owns that surface, so recreating it would cause the duplicate-choice problem this architecture is designed to prevent.

## Product requests

For a request such as `وريني حاجة خشبي داكن` Gemini returns criteria only:

```json
{
  "type": "product_request",
  "criteria": { "tone": "dark", "family": "wood" }
}
```

The browser-side conversation engine filters/ranks the real catalog deterministically and emits a `product_results` view effect containing real IDs. React then resolves those IDs to the trusted product records and renders the cards.

Gemini never chooses product IDs in this path.

## Engine-owned view effects

Only the application can create these effects:

```ts
type ConversationEffect =
  | { type: 'guided_candidates'; stepKey: AnswerKey; optionIds: string[] }
  | { type: 'product_results'; productIds: string[] }
  | { type: 'actions'; actionIds: Array<'sample' | 'whatsapp' | 'shop'> };
```

`ConversationEffectRenderer.tsx` renders those effects. This is deliberately downstream of the deterministic engine, not downstream of raw model output.

Examples:

- `clarify_current_question` may become `guided_candidates` only when the candidates are a validated strict subset of the active step.
- `product_request` becomes `product_results` only after deterministic catalog selection.
- `request_sample` becomes the fixed `sample` action.
- `contact_human` becomes the fixed WhatsApp action.
- technical side questions also surface the fixed WhatsApp action because current catalog metadata is not enough to verify technical performance.

## Grounding

The advisor is explicitly blocked from inventing price, discounts, SKU-level stock, delivery dates, durability, fire/water resistance, certifications, dimensions, thickness or unsupported technical performance.

The model receives curated material-family and use-case knowledge, but product selection still happens after interpretation inside application code.

## Server boundary

`functions/api/alamaar-chat.js` uses the existing server-side model router with `context.env.GEMINI_API_KEY` and same-origin/rate-limit guards. The key is never bundled into Vite and the browser never calls Gemini directly.

A GitHub Actions secret by itself is not a browser runtime secret. The deployed Cloudflare environment must expose `GEMINI_API_KEY` to the Pages Function/Worker runtime.
