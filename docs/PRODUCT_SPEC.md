# Product Specification

## Working description

**AI Salesman** is an intelligent conversion layer that lives inside an existing website.

It is not primarily a chatbot.
It is not a fixed pop-up.
It is not a hard-coded quiz.
It is not merely a recommendation engine.

It behaves more like a good salesperson inside the website:

- watches meaningful visitor behavior
- maintains a compact memory of what seems to matter
- notices when the visitor ignores it
- decides whether to stay silent or speak
- creates a short contextual intervention when useful
- opens an adaptive visual experience after the visitor engages
- guides the visitor toward an appropriate action

The action depends on the vertical: sample request, quote request, booking, consultation, lead capture, product match, etc.

## Product architecture in one sentence

> Ambient AI Salesman earns the click; Interactive Experience Box earns the conversion.

---

## Layer 1 — Ambient AI Salesman

The ambient salesman runs while the visitor browses normally.

### Inputs

It receives a compact evolving representation of:

- current page
- source/referrer when available
- session duration
- meaningful dwell moments
- scroll milestones
- viewed products/services
- repeat views
- comparisons
- pricing/specification views
- selected filters
- booking/form starts
- booking/form abandonment
- CTA clicks
- previous salesman interventions
- whether those interventions were viewed, ignored, clicked or dismissed
- answers already given inside an Experience Box
- known language/locale
- known intent and uncertainty

### Output

The core decision should be structured, approximately:

```json
{
  "action": "silent | intervene",
  "message": "short contextual sentence",
  "reason": "internal concise reason",
  "confidence": 0.0,
  "cooldown_seconds": 60,
  "experience_hint": "optional experience to open after click"
}
```

`reason` is for logging/debugging, not shown to the visitor.

### Important behavior

The salesman must be allowed to do nothing.

Examples:

**Bad**
> Hi! How can I help you today?

**Better HPL moment**
> You came back to the two darker finishes. One of them will be much easier to live with in a small kitchen.

**Better yacht moment**
> Six people for sunset? You may be paying for more yacht than you need.

**Better homepage moment**
> You spent most of your time on the HPL example. Want to see exactly what the salesman would remember about that visit?

The message should feel like an observation a perceptive salesperson would make.

---

## Layer 2 — Interactive Experience Box

The Experience Box opens only after the visitor explicitly engages with the salesman or an experience CTA.

It should not look like a giant customer-support chat.

It is a flexible container that renders the next-best interactive component based on what is already known and what information is still missing.

### Possible components

- single-select visual cards
- multi-select chips
- project/application selector
- style selector
- color/finish selector
- product cards
- side-by-side comparison
- product recommendation reasons
- budget selector
- quantity selector
- room size / group size control
- date picker
- time slots
- availability cards
- add-ons
- upload photo
- visualize-on-photo action
- FAQ answer card
- social proof / review card
- sample request
- quote request
- booking summary
- consultation booking
- phone/WhatsApp/contact handoff
- email/name/company capture

The AI can decide **which component comes next**, but component behavior and business data remain structured and testable.

---

## Memory

There are two memory scopes.

### Session memory — required for MVP

Stored for the current browser session. It should contain summarized state, not a giant raw transcript.

Example:

```json
{
  "intent": "choose_hpl_for_kitchen",
  "interest": ["dark_wood", "warm_modern"],
  "project_type": "kitchen",
  "room_size": "small",
  "lighting": "low",
  "products_revisited": ["5263-A194", "5177-BS"],
  "salesman": {
    "interventions_shown": 2,
    "interventions_ignored": 1,
    "last_response": "clicked",
    "cooldown_until": 1234567890
  },
  "conversion_stage": "consideration"
}
```

### Returning visitor memory — later phase

Persist only when appropriate and with the required privacy/consent treatment.

It may remember useful, non-sensitive preferences and prior engagement, for example:

- preferred language
- previous category/project
- products saved
- previous sample request
- whether the visitor dislikes proactive prompts

Do not create creepy or unnecessary persistent profiling.

---

## Salesman restraint

The product becomes bad if it is annoying.

Hard constraints should sit above model creativity:

- never show overlapping interventions
- minimum cooldown between interventions
- progressively reduce interruption after ignored/dismissed prompts
- after two ignored proactive interventions, become extremely conservative
- never repeat the same idea with paraphrased wording
- if visitor is successfully progressing through checkout/booking/form, stay silent unless assistance is clearly needed
- never fabricate urgency or scarcity
- never invent a discount
- never conceal important information
- never interrupt keyboard/form entry

The AI is persistent in understanding, not persistent in pestering.

---

## Homepage product use case

We should use our own product to sell the product.

The homepage salesman should observe things such as:

- which niche demo visitor explores
- whether they read architecture/how-it-works sections
- whether they return to pricing/pilot CTA later
- whether they open a niche page and return
- whether they ignored a first intervention

After engagement, the homepage Experience Box should help qualify the lead visually.

Example flow:

1. What kind of website do you have?
2. What does a conversion mean for you?
3. What is currently difficult for visitors?
4. Optional website URL
5. Show a tailored mini-example / recommended setup
6. Capture name + work email only after value has been demonstrated
7. CTA: request pilot / book walkthrough

The homepage should itself be our best case study.

---

## First vertical: HPL / decorative materials

HPL is first because the visitor often has a real selection problem:

- many finishes
- visual preferences
- application constraints
- specifications
- uncertainty about what works in a real space

The AI Salesman can observe browsing; the Experience Box can then help narrow the decision.

Example sequence:

- visitor repeatedly views two warm dark wood finishes
- salesman stays quiet during first pass
- visitor opens kitchen application page and returns
- salesman intervenes: “You keep coming back to the darker woods. If this is for a kitchen, one of these is a safer choice.”
- visitor clicks
- Experience Box already knows the products and current application signal
- asks only the missing question: “How much natural light does the kitchen get?”
- displays two product cards with grounded reasons
- visitor compares
- offers sample request / quote / talk to engineer

See `docs/NICHES.md` for detailed vertical rules.

---

## Success metrics

We should measure the product as a conversion system, not a chatbot engagement toy.

Primary metrics:

- intervention view → click rate
- intervention click → experience completion rate
- experience start → qualified lead/action rate
- conversion lift versus control
- assisted conversion rate
- abandonment recovery rate

Guardrail metrics:

- dismissal rate
- ignored intervention rate
- repeat interruption rate
- page performance impact
- rage clicks / unexpected layout shift
- negative feedback

Do not optimize raw chatbot message count.

---

## MVP boundary

For the first shippable version:

- session memory is sufficient
- HPL is the only fully production-quality vertical
- yacht and law-firm pages can use strong realistic demo data
- persistent cross-session memory is optional
- a full no-code client configuration dashboard is out of scope
- a lightweight JSON/config adapter per niche is acceptable
- lead persistence can use a simple server-side adapter initially
- no need for a complex multi-tenant SaaS control plane before product-market signal

The priority is proving the **behavioral AI salesman + visual experience** feels meaningfully better than a chatbot.
