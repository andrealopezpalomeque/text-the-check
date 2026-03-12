# Landing Social Proof Section — Redesign Spec

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Replace `LandingSocialProof.vue` with a combined pain + beta section

---

## Problem

The landing page has no trust signals. The current `LandingSocialProof.vue` (added in this session) used fake stat counters and WhatsApp-style testimonials that felt inauthentic for an early-stage product with no real user data.

---

## Solution

Replace it with a single section combining two honest trust signals:

- **A — "¿Te suena esto?"** — Emotional resonance via relatable pain. Shows the chaos everyone recognizes before pitching the solution.
- **C — Beta abierta** — Honesty as trust signal. Embraces the early-stage moment and attracts the right early adopters.

---

## Section Structure

**File:** `client/components/landing/LandingSocialProof.vue` (full replacement)
**Position:** Between `<HeroPrueba />` and `<LandingFeatures />` in `pages/index.vue` (unchanged)

### Layout (top to bottom)

1. **Section label** — `¿TE SUENA ESTO?` in brand blue, uppercase tracking
2. **Headline** — `El chat que nadie termina de entender`
3. **Subtitle** — Two lines of relatable Argentine rioplatense copy (e.g., "¿quién pagó la pizza?", "yo te debo del viaje anterior")
4. **Recibito illustration** — New "Overwhelmed" SVG expression, centered, surrounded by floating HTML/CSS chat bubble chips
5. **Beta banner** — Pill/card at the bottom of the section with `✦ BETA ABIERTA` label, short honest copy, and CTA button linking to Google login

---

## Recibito — "Overwhelmed" Expression

New SVG variant (`recibito-overwhelmed.svg`), same style as `recibito-v2.svg` (exists at `client/public/img/recibito/recibito-v2.svg`):

- Same receipt body path, same stroke style (`#4A90D9`, 2.5px)
- Tilt: `-6deg` (vs `-3deg` in original)
- Eyes: large circles (r=8) with small dark pupil offset (r=3) — surprised look
- Chat lines: 4 lines at slight random rotations (`rotate(±2deg)`) to suggest chaos
- Floating marks: `!` top-right, `?` top-left, `?` bottom-right at varying opacities

The chat bubble chips around Recibito are **HTML/CSS** (not part of the SVG image), so copy can be edited independently.

---

## Chat Bubble Copy

Four floating chips in rioplatense slang:
- "¿quién pagó la pizza? 🍕"
- "pará que reviso el historial 😅"
- "te debo del viaje anterior"
- "no sé cuánto puse yo 😬"

Positioned: two top (left/right), two bottom (left/right). Slightly rotated (`±2-4deg`). On mobile: hidden or stacked below illustration.

---

## Beta Banner Copy

```
✦ BETA ABIERTA   ← U+2736 SIX POINTED BLACK STAR, literal Unicode character
Estamos construyendo esto con los primeros usuarios.
Sin tarjeta. Sin vueltas.
[Ser de los primeros →]  ← links to /login (Google OAuth)
```

Background: `style="background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.05), rgba(var(--color-accent-rgb), 0.05))"` — or simpler, two overlapping divs with `bg-ttc-primary/5` and `bg-ttc-accent/5`. Border: `border border-ttc-border`.

---

## Animations

- Recibito + bubbles: `fadeUp` on scroll via `IntersectionObserver` (same pattern as `LandingFeatures`)
- Beta banner: staggered fade-up, `100ms` delay after illustration
- Use `ref` arrays (not `document.querySelectorAll`) with IntersectionObserver — e.g. `illustrationRef.value` and `bannerRef.value` passed directly to `observer.observe()`
- `prefers-reduced-motion`: disable transforms, opacity-only transition

---

## Responsive

- **Desktop:** Recibito centered, 4 chat bubbles positioned absolutely around it
- **Mobile (< 768px):** Chat bubbles displayed as a 2-col chip grid below the illustration (not hidden — the copy is load-bearing). Recibito scales down. Bubbles lose absolute positioning and become a `grid grid-cols-2 gap-2` below the illustration. Container must be `position: relative` with `z-index` on children to prevent paint bleed during scroll animations.

---

## Files Changed

| File | Change |
|------|--------|
| `components/landing/LandingSocialProof.vue` | Full rewrite |
| `public/img/recibito/recibito-overwhelmed.svg` | New file |
| `pages/index.vue` | No change needed |
