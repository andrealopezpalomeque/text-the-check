# Recibito — Character Design System

The personified receipt icon for Text the Check. "Recibito" (little receipt) is the brand's receipt symbol given just enough personality to create emotional connection in specific moments — like when a user is lost on a 404 page.

## Design Philosophy

Recibito is NOT a mascot. It's the logo icon given a momentary spark of life. The personification is **minimal and intentional** — two dots for eyes, nothing more. No mouth, no limbs, no accessories. The character communicates through:

1. **Eye position** — asymmetric heights convey emotion (confusion, curiosity)
2. **Head tilt** — a subtle rotation of the entire receipt
3. **Contextual elements** — a floating `?` for confusion, could be a `!` for alerts
4. **Animation** — a gentle float gives it life without being distracting

### Brand Rules That Apply

- The receipt body **must** maintain organic curves — never straighten to a rectangle
- The zigzag edges **must** remain detailed and characterful
- Works with **currentColor** — monochrome, no gradients, no shadows
- The lowercase, approachable personality of the brand must be reflected
- **Clarity over decoration** — the character serves a purpose, it's not ornamental

## SVG Construction Principles

Based on [Josh Comeau's Interactive Guide to SVG Paths](https://www.joshwcomeau.com/svg/interactive-guide-to-paths/).

### ViewBox & Coordinate System

- **ViewBox:** `0 0 160 200` — tall rectangle matching receipt proportions (4:5 ratio)
- Receipt body spans roughly x:28-132, y:25-175, leaving breathing room for the floating `?` and rotation

### Path Commands Used

| Command | Usage | Why |
|---------|-------|-----|
| `M` (Move) | Starting point of the receipt outline | Every path starts with M |
| `l` (Relative Line) | Zigzag teeth on top and bottom edges | Uniform relative segments create consistent perforations |
| `C` (Cubic Bezier) | Organic curves on left and right sides | Two control points allow the S-curve that mimics paper curl |
| `Z` (Close) | Closes the receipt path | Clean connection back to start |

### Zigzag Construction

Each edge uses 13 pairs of relative line segments:
```
l 4,-3.5 4,3.5  (one zigzag tooth: 8px wide, 3.5px peak)
```
- 13 pairs = 26 segments = 104 horizontal units
- Net vertical displacement = 0 (equal up/down)
- Tooth proportions: 4px wide, 3.5px tall — detailed enough to read as "perforated" without dominating

### Organic Side Curves

The sides use cubic beziers (`C`) to create the paper-curl effect:
```
Right side:  C 136,40 131,80 134,115   (first curve segment)
             C 137,148 131,167 132,175 (second curve segment)

Left side:   C 24,162 32,125 28,88     (first curve segment)
             C 24,55 33,35 28,25       (second curve segment)
```

Each side has two cubic bezier segments creating a subtle S-curve. The control points push the curve slightly outward then inward, mimicking a real piece of paper that isn't perfectly flat.

### Styling Properties

- **stroke-width: 2.5** — thick enough to be visible at small sizes, thin enough to feel hand-drawn
- **stroke-linecap: round** — softens line endings, matches brand's rounded personality
- **stroke-linejoin: round** — smooth corners on zigzag joints, avoids sharp spikes
- **fill: none** on the body — outline style allows eyes to be visible inside

## Character Variants

### Confused (404 page)
**File:** `confused.svg`

- **Eyes:** Two filled circles at (62, 90) and (100, 87). The 3px height difference creates a quizzical "raised eyebrow" expression.
- **Head tilt:** `rotate(-3, 80, 100)` — subtle counterclockwise tilt, like cocking its head in confusion.
- **Context element:** Floating `?` at top-right (opacity 0.4). Drawn with a quadratic curve + line + dot.
- **Animation:** Gentle `float` (translateY oscillation, 4s cycle) + `questionPulse` on the `?` (opacity oscillation, 3s cycle).

### Future Variants (not yet created)

- **Happy** — Eyes level, both slightly curved (semicircle arcs for "smiling" eyes). For success states.
- **Alert** — Eyes wide (larger radius), floating `!`. For warning/error states.
- **Sleeping** — Eyes as horizontal lines (closed). For maintenance/downtime pages.
- **Waving** — Same as happy but with a small arc motion line near the receipt. For welcome/onboarding.

## Color Usage

Recibito uses `currentColor` exclusively. Set the color via CSS or the `style` attribute:

| Context | Color | Example |
|---------|-------|---------|
| Dark background (default) | `#E2E8F0` (text) | `style="color: #E2E8F0"` |
| Dark background (accent) | `#4A90D9` (primary) | `style="color: #4A90D9"` |
| Light background | `#1A2030` (text) | `style="color: #1A2030"` |
| On primary | `#FFFFFF` (white) | `style="color: #FFFFFF"` |

In the app, use CSS variables: `color: var(--color-text)` for automatic theme switching.

## Size Reference

| Usage | Width | Height |
|-------|-------|--------|
| 404 page (hero) | 140px | 175px |
| Empty state illustration | 100px | 125px |
| Inline decorative | 48px | 60px |

Minimum recommended size: 48px wide. Below this, the zigzag detail and eyes become hard to distinguish.

## Animation Guidelines

Animations should be **subtle and calming**, never distracting. This is a fintech app — users trust calm interfaces.

```css
/* Gentle floating — the receipt hovers like a piece of paper caught in a light breeze */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* Question mark pulse — draws attention without being aggressive */
@keyframes questionPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.15; }
}
```

- Use `ease-in-out` timing for organic feel
- Keep durations long (3-5s cycles) — fast animation feels anxious
- Use `animation-delay` to stagger elements on page load
- Never animate the receipt body shape itself — only transform (translate, rotate)

## File Structure

```
client/public/img/recibito/
  confused.svg      ← Canonical SVG for the confused variant
  DESIGN.md         ← This file
  preview.html      ← Visual preview of all variants and sizes (dev only)
```

## Usage in Code

### Inline (for animation control)
```vue
<svg viewBox="0 0 160 200" fill="none" class="recibito">
  <!-- paste contents of confused.svg -->
</svg>
```

### As image (static usage)
```html
<img src="/img/recibito/confused.svg" alt="" width="140" height="175" />
```

### As Vue component (future)
```vue
<RecibtoCharacter mood="confused" :size="140" />
```
