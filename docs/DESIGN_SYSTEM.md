# Design System & Experience Quality Bar

## Goal

The interface should feel like a premium product people want to keep interacting with, not a SaaS template with an AI badge added later.

The design should be original and restrained. Take inspiration from the clarity, polish and confidence of top-tier product interfaces without copying any brand.

## Core aesthetic

- premium minimalism
- strong typography
- generous negative space
- tactile but quiet surfaces
- visual hierarchy before decoration
- one intentional accent per brand skin
- sophisticated motion
- responsive composition, not just responsive stacking
- high contrast and readable type
- real product imagery where the niche needs it

## Avoid

- generic purple/blue AI gradients
- glassmorphism everywhere
- giant glowing orb as the whole brand
- childish cartoon mascot by default
- over-animated floating widgets
- chat transcript as the main interface
- excessive cards inside cards
- meaningless badges
- dark UI that sacrifices legibility
- stock-photo-first design

## Brand presence / mascot

We still need a recognizable salesperson presence, but it should scale with brand tone.

### Default product presence

Use a small abstract living mark (spark / compass / material spirit / guide symbol). Its personality comes from:

- timing
- movement
- copy
- position
- memory
- restraint

Not from a giant face.

### HPL

A tasteful minimal “material spirit” is acceptable if it feels branded and mature. Avoid oversized eyes, exaggerated limbs and sticker-like motion. It can peek subtly from a swatch/product edge in playful contexts, but the premium product UI should remain primary.

### Yacht

Use a refined nautical/compass presence. Luxury, precise, calm.

### Law firm

Use a very restrained guide mark. Do not use a cartoon lawyer or animated gavel. Serious and trustworthy.

## Ambient salesman UI

Before click:

- footprint should be small
- message should be readable in one glance
- should not cover key CTA/product information
- should feel anchored to context when possible
- one line / one idea
- optional tiny label like “noticed something” but avoid AI jargon
- dismissal must be easy

On desktop, contextual anchoring near the relevant product/card can be stronger than a universal bottom-right bubble.

On mobile, use a compact bottom presence with safe-area spacing.

## Experience Box UI

After click:

- expand smoothly from the presence
- maintain visual continuity with the host site
- structured components dominate, not speech bubbles
- responses from the salesperson should be short connective tissue between components
- use product imagery, swatches, dates, times, prices, comparisons visually
- keep progress implicit unless a true multi-step process benefits from explicit progress

## Typography

Use the platform stack until a deliberate webfont choice is made.

Rules:

- hero headings: bold hierarchy through size/spacing, not ultra-heavy weight
- body text: 16–20px depending on context
- small labels never carry critical information alone
- Arabic layouts must use proper RTL handling and a tested Arabic typeface when Arabic launch work starts
- line lengths should remain comfortable

## Spacing

Create a token system rather than ad hoc numbers.

Suggested base:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 112
```

## Radius

Use a limited hierarchy:

- small controls: 10–14px
- cards: 16–22px
- major experience surface: 24–32px
- pills only for true pill controls/tags

## Color

The product homepage can use a charcoal/ink base with a warm neutral accent.

Each niche can use a distinct skin while keeping component behavior consistent.

HPL example:
- charcoal
- warm walnut
- sand
- brass/gold accent
- clean off-white content surfaces where product texture needs accuracy

Yacht example:
- midnight navy
- warm sunset sand
- white
- restrained gold

Law example:
- deep ink/navy
- parchment/off-white
- muted brass

## Motion system

Motion should explain change.

### Timing

- hover: 120–180ms
- normal state transitions: 180–260ms
- larger Experience Box transitions: 240–340ms
- no slow 600ms theatrical UI

### Principles

- 60fps target
- animate transform/opacity where possible
- no layout-jank animation
- no continuous bouncing mascot
- subtle idle motion only if it does not distract
- respect `prefers-reduced-motion`

### Signature motion

When the visitor clicks the salesman:

1. presence compresses slightly
2. container grows/morphs into Experience Box
3. initial component fades/slides into place
4. focus moves accessibly into the new surface

This transition should become a recognizable product behavior.

## Interaction details

Best-in-class feel comes from details:

- buttons have pressed state, not just hover
- choices respond instantly
- loading uses skeleton/quiet status, not spinner spam
- optimistic UI only where safe
- disabled states explain themselves if confusing
- form errors appear near the field
- no sudden page jumps
- selected product cards remain visually stable
- subtle haptic-like scale changes can be used on touch through animation only

## Page structure

### Homepage

Sections should tell a product story:

1. clear hero: “It watches. Remembers. Knows when to speak.”
2. live behavior demo
3. explanation of the two-layer system
4. niche examples
5. behavior/memory story
6. conversion / measurement story
7. pilot CTA

The homepage salesman should itself become the strongest demo after the observer/brain is implemented.

### Dedicated niche page

A niche page should look like a believable customer website first, not a product marketing case-study page.

Visitors need to feel the salesperson operating **inside a real site**.

Recommended approach:

- top portion is a realistic niche website/demo
- AI behavior happens naturally in that environment
- lower portion can explain what happened and why

## Accessibility

Required:

- semantic controls
- full keyboard navigation
- visible focus
- screen-reader labels
- dialog focus management
- escape closes Experience Box where appropriate
- reduced motion
- minimum touch target around 44px
- sufficient contrast
- no interaction dependent only on color

## Performance

Design quality includes speed.

Targets:

- minimal JS for initial hero
- lazy-load heavy niche images/components
- pre-size all media
- no CLS from salesman presence
- no giant videos on mobile by default
- image formats optimized and responsive
- Experience Box code can be code-split if useful

## Quality review checklist

Before calling any page “done”, inspect:

- 1440px desktop
- 1024px laptop/tablet landscape
- 768px tablet
- 390px mobile
- 320px narrow mobile
- light/dark host surface compatibility for embedded components
- Arabic/RTL readiness for component layouts
- reduced-motion mode
- keyboard-only flow
- slow-network AI response
- AI failure/fallback state

Every page should look intentional at all widths, not merely unbroken.
