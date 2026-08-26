# Al Amaar hybrid conversational concierge

The `/alamaar` experience is intentionally not a normal chatbot and not a traditional wizard.

## Interaction model

- Known choices use deterministic UI state. No model call is needed.
- Selecting a known choice auto-advances after a short acknowledgement beat.
- The seated mascot stays above the conversation surface and communicates mostly with gaze, lids, brows and tiny posture changes.
- A persistent composer lets the visitor ask a different question or give an answer that is not represented by the visible choices.
- Exact typed equivalents of visible choices are handled locally by `chatBridge.ts` and advance without AI.
- Anything ambiguous remains on the same step and is marked as requiring AI. The client must never guess a structured answer.

## Future Gemini response contract

The server-side AI adapter should accept the shape produced by `buildAiConversationRequest()` and return:

```ts
type AiConversationResponse = {
  intent: 'answer' | 'question' | 'clarify';
  reply: string;
  answer?: {
    key: 'project' | 'style' | 'tone' | 'application';
    value: string;
    label: string;
  };
  nextStepIndex?: number;
};
```

Rules:

1. `intent: answer` may update the structured flow only when the model can map the visitor's message to a valid step/value with high confidence.
2. `intent: question` answers the visitor while preserving the current guided-flow position unless the answer itself clearly supplies missing structured information.
3. `intent: clarify` asks one short clarification and does not advance.
4. The server must validate returned step keys and values against `STEPS`; model output is never trusted directly.
5. Product/technical claims should be grounded in catalog/source data and should distinguish visual guidance from technical suitability.

## Secret handling

Do not expose the Gemini API key through a Vite `VITE_*` variable or browser bundle. A GitHub Actions secret is useful for CI/deploy configuration, but runtime AI requests should go through a server-side Cloudflare Pages Function/Worker (or another server endpoint) whose secret is stored in the deployment platform's server-side secret store.

The current client intentionally contains no Gemini key and no direct browser-to-Gemini request.
