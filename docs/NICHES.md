# Niche Specifications

The product is one core engine with niche-specific data, rules, experience components and visual skins.

## 1. HPL / decorative materials — first production vertical

### Core customer problem

A visitor is choosing between many finishes/materials and often lacks enough context to confidently pick the right option for a real project.

### Ambient salesman signals

High-value signals:

- repeated views of the same 2–4 decors
- moving between color families
- opening technical specs
- visiting an application page (kitchen, wardrobe, retail, hotel, office)
- adding products to compare
- spending time on sample/quote/contact areas without acting
- returning from inspiration pages to product details
- switching between light/dark variants repeatedly

### Good intervention examples

> You’ve come back to these two dark woods twice. If this is for a kitchen, one is much easier to live with.

> You’re comparing by color right now, but the cleaning requirement may matter more for this application.

> Those three are visually close. Want me to narrow them by the room they’re going into?

### Experience Box components

Primary:

- project/application selector
- style selector
- light/dark preference
- room size
- lighting condition
- verified usage-property questions
- swatch cards
- product cards
- side-by-side comparison
- “why this fits” grounded explanation
- request samples
- request quote
- contact material engineer / salesperson

Optional later:

- upload room photo
- apply material to photo/mock scene
- complementary finish suggestions
- saved shortlist

### HPL facts policy

All technical properties must be grounded in product data supplied by the business.

AI may say:
> This option is listed as suitable for kitchen cabinetry and has the cleaning property you selected.

AI may **not** invent:
- fire rating
- heat resistance number
- moisture resistance
- thickness
- certification
- warranty
- availability
- price

unless those fields are present in verified data.

### Conversion goals

1. sample request
2. quote/project enquiry
3. talk to technical sales/engineer
4. saved shortlist

### HPL demo data

Create a realistic but explicitly demo product catalog with 18–30 SKUs. Mark the dataset as fictional/demo internally so no unsupported real-brand claims are made.

Each item should have:

- SKU
- display name
- visual category
- warm/cool
- light/medium/dark
- finish
- verified demo applications
- demo properties
- sample eligibility
- image/swatch asset

The AI receives only this data when explaining recommendations.

---

## 2. Yacht charter — booking demo

### Core customer problem

Visitors compare vessels, capacities, durations, prices and times while trying to build an experience around an occasion.

### Ambient salesman signals

- repeated vessel views
- two-vessel comparison
- party size selected
- price section revisited
- date selected but no booking
- time slots viewed
- add-ons viewed
- birthday/anniversary/sunset signal
- checkout started then abandoned

### Good intervention examples

> For six guests, you’re mostly paying extra for cabin space on this one. I found two better fits.

> If sunset matters, 5:30 gives you the best light on the way out and the skyline lit on the return.

Only make the second claim when sunrise/sunset/location/time data is actually available or configured.

### Experience components

- party size
- occasion
- date
- time slots
- vessel recommendations
- vessel compare
- duration
- add-ons
- price summary
- booking CTA

### Truth rules

Never invent:

- availability
- remaining inventory
- price
- duration
- capacity
- marina rules
- cancellation policy
- weather certainty

No fake “held for 8 minutes” unless the booking backend truly holds it.

### Conversion goals

1. booking start
2. booking completed
3. qualified enquiry if direct booking is not supported

---

## 3. Law firms — intake/routing demo

### Core customer problem

A visitor may not know which practice area/lawyer/consultation type is appropriate and may hesitate to make contact.

### Ambient salesman signals

- multiple practice-area pages viewed
- lawyer bios viewed
- consultation page viewed repeatedly
- contact form started/abandoned
- location/jurisdiction page viewed
- repeated FAQ or fee-related reading

### Good intervention examples

> It looks like you’re comparing two practice areas. I can help route you to the right consultation path.

> You’ve looked at both the business and real-estate teams. Want me to narrow which one handles this kind of issue?

### Experience components

- broad matter category
- location/jurisdiction selector
- conflict/safety screening questions configured by firm
- urgency/timeline selector when appropriate
- lawyer/team matching from deterministic firm data
- consultation type
- calendar/time slots
- secure contact/intake capture

### Legal safety rules

This vertical is a routing/intake assistant, not a lawyer.

Never:

- give personalized legal advice
- tell a visitor they have a valid case
- predict a result
- estimate damages/case value
- create legal deadlines
- imply attorney-client relationship
- make jurisdictional claims not explicitly configured

Safe language:

> Based on the category you selected, this team is the closest fit for an initial consultation.

Not safe:

> You definitely have a strong case and should sue.

### Conversion goals

1. consultation booking
2. qualified intake submitted
3. phone/contact handoff

---

## 4. Homepage — our own product salesman

This is not just a marketing page. It is a live product dogfood environment.

### Signals

- which niche cards/routes the user opens
- how long they spend on product behavior vs architecture vs deployment
- repeated visits to pilot CTA
- demo route return to homepage
- pricing/pilot interest later
- whether first intervention was ignored

### Potential interventions

If visitor spends time on HPL:
> You seem much more interested in product selection than bookings. Want to see how I’d behave on a real catalog session?

If visitor reads technical architecture:
> You’re looking under the hood. I can show you exactly what the salesman remembers before it decides to speak.

If visitor has explored multiple niches:
> You’ve tried three versions. Want me to map the best first use case for your own site?

### Experience components

- site/business type
- conversion goal
- current website URL
- product/service complexity
- traffic/lead context (optional)
- biggest visitor friction
- tailored recommendation
- name/work email/company
- pilot request / walkthrough CTA

### Lead capture philosophy

Do not ask for email immediately.

First demonstrate relevance. Then ask for contact details after the user receives a useful tailored answer.

---

## Shared niche configuration shape

Aim toward a data-driven adapter:

```ts
interface NicheConfig {
  id: string;
  name: string;
  salesmanSystemRules: string[];
  allowedActions: string[];
  forbiddenClaims: string[];
  conversionEvents: string[];
  experienceComponents: string[];
  dataSources: string[];
  visualTheme: {
    accent: string;
    tone: string;
    presenceStyle: string;
  };
}
```

The engine should not contain `if niche === ...` logic everywhere. Isolate vertical differences in adapters/configuration.
