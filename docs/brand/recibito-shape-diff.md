# Recibito Receipt Silhouette — Brand Drift Diff

**Purpose:** audit the Recibito character SVGs against the canonical receipt silhouette so the brand symbol reads the same across every pose.

**Canonical sources:**
- `client/components/TtcSymbol.vue` — inline SVG at the 80×120 scale (simplified: 6 teeth, stroke-width 5, `currentColor`, stroke-only, no fill).
- `client/public/img/ttc_symbol.svg` — detailed 1200×1200 logo master (filled variant).
- `client/public/img/recibito/symbol-primary.svg` and siblings — the "correct by definition" reference at the character scale (viewBox `0 0 160 200`, 26 teeth, stroke-width 2.5, stroke-only, no fill).

**Canonical principles (shape-level):**
- Zigzag perforations on **both** top and bottom edges.
- Organic S-curves on both sides (two cubic beziers per side).
- Stroke-only, no fill on the outline.
- `stroke-width` in the 2.5–5 px range.
- `stroke-linecap: round` + `stroke-linejoin: round`.
- Color via `currentColor` (or a hardcoded brand color where the file is explicitly a colored variant).

**Character files audited** (not `symbol-*.svg` — those are out of scope by definition):
1. `client/public/img/recibito/confused.svg`
2. `client/public/img/recibito/recibito-v2.svg`
3. `client/public/img/recibito/recibito-overwhelmed.svg`
4. `client/error.vue` (inline duplicate of `confused.svg`) — added to scope because it carries a copy of the silhouette path.

**Canonical character-scale path** (from `symbol-primary.svg`, viewBox `0 0 160 200`):
```
M 28,25
l 4,-3.5 4,3.5  (×13 pairs = 26 segments)
C 142,37 124,78 139,115
C 144,148 124,170 132,175
l -4,3.5 -4,-3.5  (×13 pairs = 26 segments)
C 19,159 37,127 23,88
C 18,52 37,32 28,25
Z
```

---

## 1. `confused.svg`

| Check | Canonical | confused.svg | Status |
|---|---|---|---|
| viewBox | `0 0 160 200` | `0 0 160 200` | ✅ match |
| Start point | `M 28,25` | `M 28,25` | ✅ match |
| Top teeth | 26 segments `4,±3.5` | 26 segments `4,±3.5` | ✅ match |
| Right side curves | `C 142,37 124,78 139,115 C 144,148 124,170 132,175` | identical | ✅ match |
| Bottom teeth | 26 segments `-4,±3.5` | 26 segments `-4,±3.5` | ✅ match |
| Left side curves | `C 19,159 37,127 23,88 C 18,52 37,32 28,25` | identical | ✅ match |
| `stroke` | `currentColor` | `currentColor` | ✅ match |
| `stroke-width` | 2.5–5 | `2.5` | ✅ in range |
| `stroke-linecap` / `stroke-linejoin` | `round` | `round` / `round` | ✅ match |
| Fill on outline | none | no fill attr | ✅ match |
| Extra paths on the silhouette? | — | none (only character elements below) | ✅ |

**Character elements present (intentionally differ):** two filled eye dots at `(62,90)` and `(100,87)`, floating `?` group at top-right (`opacity: 0.4`). Wrapped in `rotate(-3, 80, 100)` head-tilt. All within spec.

**Verdict:** No drift. `confused.svg` is already aligned with the canonical silhouette.

---

## 2. `recibito-v2.svg`

| Check | Canonical | recibito-v2.svg | Status |
|---|---|---|---|
| viewBox | `0 0 160 200` | `0 0 160 200` | ✅ match |
| Start point | `M 28,25` | `M 28,25` | ✅ match |
| Top teeth | 26 segments `4,±3.5` | 26 segments `4,±3.5` | ✅ match |
| Right side curves | `C 142,37 124,78 139,115 C 144,148 124,170 132,175` | identical | ✅ match |
| Bottom teeth | 26 segments `-4,±3.5` | 26 segments `-4,±3.5` | ✅ match |
| Left side curves | `C 19,159 37,127 23,88 C 18,52 37,32 28,25` | identical | ✅ match |
| `stroke` on silhouette | `currentColor` | `#4A90D9` (hardcoded primary blue) | ⚠️ hardcoded — consistent with sibling `symbol-primary.svg`, which also hardcodes `#4A90D9`. File self-identifies in its comment as "Primary blue" variant. Not a silhouette-shape issue. |
| `stroke-width` | 2.5–5 | `2.5` | ✅ in range |
| `stroke-linecap` / `stroke-linejoin` | `round` | `round` / `round` | ✅ match |
| Fill on outline | none | no fill attr | ✅ match |
| Extra paths on the silhouette? | — | none | ✅ |

**Character elements present (intentionally differ):** eye dots at `(62,68)` and `(100,65)`, three chat-line rounded rectangles, floating `?`. All use `#4A90D9` with opacity variations. Wrapped in `rotate(-3, 80, 100)`.

**Verdict:** No silhouette drift. The hardcoded `#4A90D9` is intentional (named "Primary blue" variant) and mirrors the symbol-primary pattern. Leave the color as-is unless you want this file to switch to `currentColor` semantics.

---

## 3. `recibito-overwhelmed.svg`

This is the only character with real silhouette drift.

| Check | Canonical | overwhelmed.svg | Status |
|---|---|---|---|
| viewBox | `0 0 160 200` | `0 0 180 220` | ❌ larger frame (+20 width, +20 height) |
| Start point | `M 28,25` | `M 32,28` | ❌ shifted by `(+4, +3)` |
| Top teeth | 26 segments `4,±3.5` | 26 segments `4,±3.5` | ✅ match |
| Top end x | `28 + 26×2 = 132` | `32 + 104 = 136` | ❌ follows the offset |
| Right side curves | `C 142,37 124,78 139,115 C 144,148 124,170 132,175` | `C 152,40 134,82 148,118 C 153,152 134,174 142,179` | ❌ right side is **wider**, not just shifted — the outward bulge reaches `x = 148` vs canonical `x = 139` (≈ +9 px extra outward bulge on top of the +4 base shift) |
| Bottom teeth | 26 segments `-4,±3.5` | 26 segments `-4,±3.5` | ✅ match |
| Left side curves | `C 19,159 37,127 23,88 C 18,52 37,32 28,25` | `C 22,162 40,130 26,92 C 21,56 40,36 32,28` | ❌ follows the `(+4, +3)` offset; inward extremity reaches `x = 26` vs canonical `x = 23` |
| `stroke` on silhouette | `currentColor` | `#4A90D9` (hardcoded) | ⚠️ same primary-blue convention as `recibito-v2.svg` — noted, not flagged |
| `stroke-width` | 2.5–5 | `2.5` | ✅ in range |
| `stroke-linecap` / `stroke-linejoin` | `round` | `round` / `round` | ✅ match |
| Fill on outline | none | no fill attr | ✅ match |
| Extra paths on the silhouette? | — | none | ✅ |

**Shape of the drift (summary):**
1. The whole silhouette is translated `(+4, +3)` inside a larger `180×220` viewBox (the original designer likely did this so the four floating emotion marks `! ? ?` had breathing room — the bottom-right `?` actually sits at `x ≈ 167`, outside the canonical 160-wide frame).
2. On top of that, the right-hand cubic beziers bulge an **extra ~6 px** outward, making the receipt visibly wider on the right than on the left. This is the hardest-to-ignore brand-consistency break.

**Character elements present (intentionally differ):** two dark-pupil "surprised" eye pairs, four chaotically rotated chat-line rectangles, three floating marks (`!`, `?`, `?`) with varied opacity. Wrapped in `rotate(-6, 90, 110)` — a steeper tilt than the other characters (also fine, character-specific).

**Consumer:** `client/components/landing/LandingSocialProof.vue` renders this as `<img … width="160" height="200">`. The browser scales the `180×220` viewBox down to `160×200`, which slightly squashes the silhouette horizontally and vertically in the final landing-page rendering. Aligning the viewBox to `160×200` would also remove this implicit squash.

**Verdict:** Drift confirmed. Needs alignment.

---

## 4. `client/error.vue` (inline)

`error.vue` carries its own copy of the silhouette path inside a `<svg>` tag. It's a verbatim duplicate of `confused.svg`.

| Check | Canonical | error.vue inline | Status |
|---|---|---|---|
| viewBox | `0 0 160 200` | `0 0 160 200` | ✅ match |
| Silhouette path | canonical | identical to canonical | ✅ match |
| `stroke` / `stroke-width` / caps | `currentColor`, 2.5, round | `currentColor`, `2.5`, round | ✅ match |
| Fill on outline | none | no fill attr | ✅ match |

**Verdict:** No drift — but it's a hand-maintained duplicate of the `confused.svg` path, which is a separate concern (risk of future divergence). Not fixing here; flagged for awareness.

---

## Summary

| File | Silhouette matches canonical? | Action needed |
|---|---|---|
| `confused.svg` | ✅ yes | none |
| `recibito-v2.svg` | ✅ yes | none |
| `recibito-overwhelmed.svg` | ❌ no | **fix:** shape is offset and right side bulges wider; viewBox is oversized |
| `error.vue` (inline) | ✅ yes | none (duplicate of `confused.svg`, flagged) |

Only `recibito-overwhelmed.svg` needs edits for silhouette-level brand consistency. The PLAN PASS covers the options for that single fix.
