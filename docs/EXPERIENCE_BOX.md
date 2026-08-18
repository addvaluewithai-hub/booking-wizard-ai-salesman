# Interactive Experience Box

## Purpose

The Experience Box is the engaged state that appears **after** the visitor clicks the ambient salesman or a deliberate experience CTA.

It should feel like a small adaptive product experience embedded into the site, not a support chat window.

## Core behavior

- starts with everything already known from session memory
- asks only for missing information
- favors visual components over paragraphs
- can change component sequence based on answers
- can show deterministic product/business data
- can invoke a model to choose the next useful component
- keeps the visitor close to the underlying website context
- ends in a concrete action

## Component registry

Initial reusable components:

### Choice
- `SingleSelectCards`
- `MultiSelectChips`
- `YesNo`
- `RangeSelector`
- `QuantityStepper`

### Product / recommendation
- `ProductCard`
- `ProductGrid`
- `ProductCompare`
- `RecommendationReason`
- `SpecsSummary`
- `BestFitBadge`

### Booking
- `DatePicker`
- `TimeSlots`
- `PartySize`
- `AvailabilityCard`
- `AddOns`
- `BookingSummary`

### Visual
- `ImageChoice`
- `SwatchChoice`
- `UploadImage`
- `BeforeAfter`
- `VisualizeOnPhoto`

### Conversion
- `RequestSample`
- `RequestQuote`
- `BookConsultation`
- `LeadCapture`
- `CallOrWhatsApp`

### Reassurance
- `FAQAnswer`
- `ReviewCard`
- `PolicySummary`
- `TrustSignals`

## Rendering rules

The AI returns component data that is validated against known schemas.

The AI must never return arbitrary HTML/JS/CSS to render.

The registry controls:

- layout
- motion
- keyboard behavior
- accessible labels
- loading states
- error states
- event tracking
- field validation

## Experience state

```ts
interface ExperienceState {
  id: string;
  open: boolean;
  sourceInterventionId?: string;
  mode: string;
  knownAnswers: Record<string, unknown>;
  currentComponentIds: string[];
  completedComponentIds: string[];
  selectedEntityIds: string[];
  status: 'idle' | 'planning' | 'active' | 'converting' | 'complete' | 'error';
}
```

Answers immediately feed back into the shared session memory so the ambient salesman is smarter if the visitor closes the box and resumes browsing.

## HPL example

Known before click:

- visitor returned to `5177 BS` and `5263 A-194`
- kitchen application page was viewed
- dark/warm filters used

Do **not** ask “What project is this for?” if kitchen intent is already strong.

Possible first component:

> How much natural light does the kitchen get?

Options:

- Lots of daylight
- Medium
- Very little

Next:

- compare the two known products
- explain only verified differences
- optionally ask size/style if still necessary
- show one best-fit recommendation
- offer sample / quote / engineer handoff

## Homepage example

Known before click:

- visitor spent time on HPL route
- returned to homepage
- read “How it works”

The Experience Box could open with:

> It looks like product discovery is the version you care about most. What does your site sell?

Then show choices:

- materials / interiors
- ecommerce products
- bookings
- professional services
- other

After two or three useful questions, show a tailored mini flow and only then ask for:

- website URL
- name
- work email

Lead capture should feel like the logical next step, not a gate before value.

## Motion

The Experience Box should visually grow from the salesman presence when possible.

Motion goals:

- 180–320ms transitions
- spring-like ease without bounce gimmicks
- component crossfade/slide with stable container geometry
- preserve focus
- reduced-motion alternative
- never cover essential content unexpectedly on mobile

## Mobile

Mobile is not a desktop sidebar squeezed narrower.

Recommended behavior:

- ambient salesman remains a compact bottom presence
- after click, Experience Box becomes a bottom sheet/full-height sheet depending on component complexity
- sticky action area only when useful
- thumb-friendly targets
- no nested scrolling traps
- date/selection controls use native capabilities where they are better

## Completion

Every experience has an explicit success action and a clean completion state.

Examples:

- sample request submitted
- quote requested
- consultation booked
- booking handed off
- qualified lead captured

After completion, write the result into memory so subsequent ambient behavior does not redundantly sell the same action.
