# Recibito — Character Bible

One-page reference for the Text the Check mascot. Every rule in this file is extracted from existing SVGs and `brand-audit.md` §5–§6 and `recibito-shape-diff.md`. Nothing here is invented.

---

## Identity

**Name.** Recibito — Argentine diminutive of *recibo* ("receipt"), literally "little receipt." The diminutive conveys warmth and peer-level familiarity, matching the product's es_AR vos-form voice (see `marketing-decisions.md` decision #1).

**Product role.** Recibito is the face of Text the Check — a personified receipt that carries the brand's emotional tone across empty states, onboarding, error surfaces, and social-media content. The mascot exists because the product's primary surface is WhatsApp (chat-native, voice-forward, low-chrome); Recibito gives the web landing and app screens an emotional anchor that a neutral interface would lack.

**One-line description (for AI tools).** A stroke-only receipt silhouette with dot eyes, tilted slightly off-vertical, expressing a single emotion via eye placement and floating metaphors. Never filled. Never colored except as `currentColor` or as a named brand-blue variant.

---

## Visual anatomy

These rules are verified against `client/public/img/recibito/confused.svg`, `recibito-v2.svg`, and the aligned canonical `symbol-primary.svg`. They are the non-negotiable shape spec for any new pose.

**Silhouette.**
- `viewBox="0 0 160 200"` at character scale. (Simplified variant in `TtcSymbol.vue` uses `viewBox="10 10 80 120"` with 3 teeth and `stroke-width="5"` — this is the icon-scale simplification and is NOT the character shape. Don't mix them.)
- Zigzag perforations on **both** top and bottom edges — 26 tooth segments each (`l 4,±3.5` repeated 13 times, alternating direction).
- Organic S-curves on both sides, two cubic Béziers per side. Right side: `C 142,37 124,78 139,115 C 144,148 124,170 132,175`. Left side: `C 19,159 37,127 23,88 C 18,52 37,32 28,25`.
- Receipt closes with `Z`.

**Line weight.**
- Character-scale silhouettes: `stroke-width="2.5"`.
- Icon-scale symbol (`TtcSymbol.vue`): `stroke-width="5"` with 3 simplified teeth.
- Interior chat lines: `stroke-width="4"` at opacity 0.55 (icon scale) or filled rounded rects at opacities 0.14–0.28 (character scale).
- Caps and joins: `stroke-linecap="round"` + `stroke-linejoin="round"`. No exceptions.

**Fill rule.**
- The silhouette outline is **stroke-only, never filled**. The SVG root uses `fill="none"`.
- Fill is only used for eyes, floating punctuation dots, and interior chat-line rectangles.
- Stroke color is `currentColor` on character files that need theme-responsive behavior (e.g. `confused.svg`). The two "primary blue" variants (`recibito-v2.svg`, `recibito-overwhelmed.svg`) hardcode `#4A90D9` — this is the declared convention for that specific variant family, not a drift.

**Canonical references.** Any new Recibito pose must trace the silhouette from one of these files, not reconstruct it from scratch:
- `client/components/TtcSymbol.vue` — the icon-scale symbol (80×120, 3 teeth, stroke 5).
- `client/public/img/ttc_symbol.svg` — the detailed 1200×1200 master (filled variant for logo use).
- `client/public/img/recibito/symbol-primary.svg` — the character-scale stroke-only reference (160×200, 26 teeth, stroke 2.5). **This is the canonical starting point for new character poses.**
- `client/public/img/recibito/confused.svg` — already aligned, `currentColor`-based. Best template for new `currentColor` poses.

If you are generating a new pose, open one of these files, copy the `<path d="…">` verbatim, then add character elements on top. Do not redraw the outline.

---

## Emotional range

### Current canon (ship-ready)

Only these two SVGs currently exist and are approved for use:

- **Confused.** Head tilted `rotate(-3, 80, 100)`, dot eyes `r=5` at `(62,90)` and `(100,87)` — the right eye is 3 px higher to read as quizzical. Floating `?` at `opacity: 0.4` top-right, outside the rotated group so it floats independently.
- **Overwhelmed.** Head tilted further `rotate(-6, 80, 100)`, big surprised eyes (`r=8` light-blue iris + `r=3` dark pupil offset up-and-right). Chaotic chat lines inside the receipt at small random rotations. Three floating marks (`!`, `?`, `?`) at opacities 0.50 / 0.35 / 0.22. **NOTE:** the silhouette of `recibito-overwhelmed.svg` currently drifts from canonical — see `recibito-shape-diff.md` §3. New poses should follow `confused.svg`, not this file.

### Proposed extensions to canonize

These are the mascot poses identified in `brand-audit.md` §5 ("Gaps — what a richer landing/Instagram set would need") as priorities. Each one is specified below with just enough rule to keep future generations consistent. They are NOT yet approved — they are the design brief for the next batch.

| Pose | Eye style | Floating metaphor / element | Head tilt |
|---|---|---|---|
| **Celebrating** | Curved "^ ^" happy eyes (two short strokes, `stroke-width="2.5"`, `linecap="round"`) | Confetti specks (3–5 small rotated rects at opacity 0.4–0.6, mixed brand blue + ttc-secondary) OR a small "✓" floating top-right | `rotate(2, 80, 100)` — slight right-lean (upbeat) |
| **Waving-hello** | Standard dot eyes `r=5` | One "hand" stroke: a short curved path emerging from the right side of the receipt, 2–3 segments, `stroke-width="2.5"` | `rotate(-2, 80, 100)` |
| **Thinking** | One closed eye (short horizontal stroke) + one open dot | A small "…" ellipsis in a rounded chat bubble floating top-right, opacity 0.4 | `rotate(-4, 80, 100)` — chin-up posture |
| **Counting** | Standard dot eyes, both looking down-right | Small numbers or "$" signs floating at decreasing opacity (0.45 → 0.15) in a stacked cluster near one side | `rotate(0)` — upright, concentrated |
| **Scanning-receipt** | Standard dot eyes, both looking down | A second smaller receipt (use `TtcSymbol.vue` geometry) floating below, opacity 0.6 | `rotate(-8, 80, 100)` — leaned-over-a-task |
| **Holding-phone** | Standard dot eyes | A small WhatsApp-green (`ttc-secondary`) rounded rectangle floating adjacent to the silhouette, with a tiny chat-bubble tail | `rotate(-3, 80, 100)` |
| **Sleeping** | Closed curved eyes ("u u", short curved strokes) | Floating "Z" characters stacked top-right, opacities 0.5 / 0.3 / 0.15 | `rotate(-10, 80, 100)` — head-against-shoulder lean |

**Rule for proposing any additional pose:** one emotion per file, expressed through exactly two mechanisms — eye style + ONE category of floating element (punctuation, objects, or Zs). Don't combine multiple metaphor types in a single pose.

---

## Consistency rules

What **never** changes across poses:

- The silhouette path. Copy it verbatim from `symbol-primary.svg` or `confused.svg`. Do not redraw.
- The `viewBox="0 0 160 200"` at character scale.
- Stroke weight 2.5 on the outline, round caps and joins.
- The receipt is stroke-only on its outline. Never filled.
- Color source: `currentColor` (preferred — theme-responsive) or a hardcoded `#4A90D9` (allowed only for the declared "primary blue variant" family, e.g. `recibito-v2.svg`). No other fixed colors on the silhouette.

What **does** change per pose:

- Eye shape (dot, curved, closed, offset-pupil) and placement within the receipt body.
- Head tilt — the `rotate()` transform on the wrapping `<g>` group. Range observed: `-10` to `+3` degrees around center `(80, 100)` or `(90, 110)`.
- Floating elements outside the rotated group: punctuation, small objects, particles. These float independently of the head tilt.
- Interior chat lines — number, angle, opacity. Optional.
- Posture of any added character elements (hands, held objects).

---

## Usage policy

**When Recibito appears.**
- Empty states in Grupos and Finanzas (e.g. "Sin gastos asociados" — currently `EmptyState` leans on Lucide icons; Recibito is the intended upgrade).
- Onboarding / first-run screens where the product is introducing itself.
- Instagram content — posts, stories, carousels. Roughly 80% of posts feature Recibito, per `marketing-decisions.md` decision #6.
- Landing page emotional beats — hero secondary imagery, "how it works" steps, social-proof sidebar (where `recibito-overwhelmed.svg` already appears in `LandingSocialProof.vue`).
- 404 / error surfaces that are recoverable (`client/error.vue` carries an inline duplicate of `confused.svg`).

**When Recibito must not appear.**
- Serious / destructive error dialogs ("¿Estás seguro que querés eliminar este grupo?"). The warm mascot undermines the weight of a destructive decision. Use the stock `ConfirmDialog` `danger` variant instead.
- Precise financial data displays — balance sheets, settlement tables, exported summaries. These need to read as neutral records; a cartoon next to a number erodes trust.
- Any surface where Recibito would be the only graphical element and the user needs unambiguous clarity (e.g. "Pago recibido: $5.240" — show the number, not the mascot).

**Size and spacing.**
- Minimum rendered size: 80×100 px on screen. Below that, the 26-tooth perforation becomes noise; use `TtcSymbol.vue` (3 teeth, stroke 5) as the icon-scale fallback instead.
- Clear space: at least one Recibito-head-width (≈80 px at native scale) between the silhouette and any adjacent text or UI element.

---

## Voice pairing

Recibito captions and in-product microcopy near the mascot are always:

- **es_AR Spanish.** Never English, never neutralized-international Spanish.
- **Vos form, not tú or usted.** *"¿Dividimos el viaje?"* — not *"¿Dividamos el viaje?"* and definitely not *"Let's split the trip."*
- **Peer-level, not corporate.** Recibito speaks like a friend who happens to be a receipt — informal, concrete, mildly self-deprecating when confused.
- **Short.** One sentence per caption. The mascot conveys the emotion; the copy names the situation.

Examples of the tone (from `brand-audit.md` §7):
- "Mandale un mensaje al bot por WhatsApp."
- "¿Seguro que querés cerrar sesión?"
- "Pagué 5 lucas del uber del aeropuerto."

**Wordmark in Recibito-adjacent copy.** When the product name appears in a caption or UI text next to Recibito, render it lowercase — `text the check` — per `marketing-decisions.md` decision #1. Title case ("Text the Check") is reserved for metadata and external marketing chrome where the lowercase wordmark is not also present.

---

## File references

Canonical SVGs currently in `client/public/img/recibito/`:

| File | Role | Color source | Notes |
|---|---|---|---|
| `symbol-primary.svg` | **Canonical character silhouette reference** | Hardcoded `#4A90D9` | The "correct by definition" receipt shape at 160×200 scale. Start any new pose from this file. |
| `symbol-v2.svg` | Symbol variant | (see file) | Alternate symbol variant — not a character pose. |
| `symbol-curved.svg` | Symbol variant | (see file) | Symbol variant with emphasized curves. |
| `symbol-white.svg` | Symbol variant | White | For dark-background lockups. |
| `confused.svg` | **Canonical "confused" pose** | `currentColor` | Ship-ready. Best template for new `currentColor`-based poses. |
| `recibito-v2.svg` | "Primary blue" variant of the neutral symbol | Hardcoded `#4A90D9` | Ship-ready. Treat as a color-locked variant, not a character pose. |
| `recibito-overwhelmed.svg` | "Overwhelmed" pose | Hardcoded `#4A90D9` | Ship-ready, but silhouette drifts from canonical — see `recibito-shape-diff.md` §3. Do NOT use as a geometric reference. |

Related components:
- `client/components/TtcSymbol.vue` — icon-scale inline SVG (3 teeth, stroke 5). Use for favicons, small nav symbols, buttons.
- `client/public/img/ttc_symbol.svg` — 1200×1200 master (filled variant) for logo lockups.
- `client/error.vue` — inline duplicate of `confused.svg`. Flagged in `recibito-shape-diff.md` §4 as a maintenance risk (duplicated path).
