# Al Amaar Rive Character Contract

This document is the runtime contract for the Al Amaar guided material concierge on `/alamaar`.

The page already ships a reactive SVG fallback and a code-split Rive WebGL2 integration. The final `.riv` file can replace the fallback without changing the wizard UI or recommendation logic.

## Goal

The character should feel like a premium in-store material consultant, not a generic chatbot mascot.

Motion ratio:

- ~80% calm / poised / observant
- ~20% expressive / memorable
- no constant bouncing
- no movement that competes with the current question
- no layout shift when the character changes state

## Runtime

Package: `@rive-app/react-webgl2`

State machine name: `Concierge`

Recommended artboard: `Alamaar Concierge`

Recommended artboard aspect: roughly `260 × 330` or an equivalent portrait ratio. Keep all expressive motion inside safe bounds so the web container never needs to resize.

## State machine inputs

The React bridge expects the following exact input names.

### Numbers

| Input | Range | Meaning |
| --- | ---: | --- |
| `lookX` | -100 → 100 | Horizontal eye/head interest direction |
| `lookY` | -100 → 100 | Vertical eye/head interest direction |
| `step` | 0 → 4 | Current guided-experience scene |

### Booleans

| Input | Meaning |
| --- | --- |
| `engaged` | Visitor is actively inside the guided experience |
| `talking` | Speech bubble is active; use for subtle mouth/face life, not lip sync |
| `coolMode` | Dark-direction accessory state, currently sunglasses |

### Triggers

| Trigger | Intended motion |
| --- | --- |
| `welcome` | One confident greeting / wave, then settle |
| `listen` | Lean/listen/attentive reaction |
| `think` | Small thinking beat, then calm idle |
| `approve` | Short positive selection acknowledgement |
| `point` | Guide attention toward the active cards / CTA |
| `present` | Open-body presentation pose for recommendations |
| `celebrate` | Short conversion/success celebration; reserved for important moments |

## Animation layers

Build the character so the main state and micro-motion can blend rather than restart the whole body.

### Base layer

- soft breathing / body settle
- occasional blink
- tiny asymmetry so the character does not feel robotic

### Gaze layer

- eyes react fastest to `lookX` / `lookY`
- head follows with lower amplitude and a small delay
- torso should not chase the cursor
- clamp extreme gaze so it still feels intentional

### Expression layer

- brows
- eyelids
- mouth shapes: neutral, smile, open-smile, thinking
- expression transitions should settle smoothly instead of snapping

### Gesture layer

- left and right arms independently rigged
- point gesture should have anticipation, extension, settle
- welcome wave should stop after a few beats
- presentation pose should be wide but quiet

### Accessory layer

`coolMode = true` reveals sunglasses with a fast, premium snap/drop motion.

Do not make the sunglasses permanently cover the eyes inside the rig logic; gaze should continue underneath so removing them remains natural.

## Scene choreography

### Scene 0 — Project

- fire `welcome`
- direct gaze toward the option area after greeting
- idle becomes calm after ~1–1.5s

### Scene 1 — Visual style

- fire `listen`
- slightly more attentive face
- gaze follows focused/hovered cards

### Scene 2 — Tone

- fire `think`
- when the visitor chooses dark, set `coolMode = true`
- sunglasses moment should be a memorable 250–450ms beat, then settle

### Scene 3 — Application

- fire `point`
- gesture toward the card field / next action
- keep pointing subtle and finite rather than looping aggressively

### Results

- fire `present`
- gaze should favor the lead recommendation / primary CTA
- `celebrate` is available for a successful sample/contact action later, not every result reveal

## Interaction principles

1. Cursor/gaze tracking is supporting motion, never the main interaction.
2. Every discrete gesture should return to a stable idle.
3. A new trigger may interrupt only if the current gesture is safely interruptible.
4. Prefer blend/state transitions over restarting timelines.
5. Respect `prefers-reduced-motion`; the web layer disables fallback animation and the Rive file should also expose a calmer path if we later add a reduced-motion input.

## Web integration

The current page reads an optional `rive` query parameter.

Example preview:

```text
/alamaar?rive=/alamaar/mascot.riv
```

A hosted Rive URL can also be supplied while iterating.

Once the final file is approved, move it to a stable public path and remove the temporary query-param requirement.

The React bridge lives in:

- `src/niches/alamaar/MascotStage.tsx`
- `src/niches/alamaar/RiveMascotCanvas.tsx`

The fallback remains visible until the Rive runtime reports ready, so a missing/slow asset does not leave an empty character area.

## Asset checklist before final export

- [ ] Artboard named and sized intentionally
- [ ] State machine named `Concierge`
- [ ] All runtime inputs use the exact names above
- [ ] Idle loop is seamless and quiet
- [ ] Arms have independent pivots
- [ ] Eyes and head can react to `lookX` / `lookY`
- [ ] Sunglasses are isolated from the face rig
- [ ] Trigger animations return cleanly to idle
- [ ] No animation exceeds the safe portrait bounds
- [ ] File tested at desktop and mobile rendered sizes
- [ ] File tested with throttled CPU/network
- [ ] File size reviewed before production rollout
