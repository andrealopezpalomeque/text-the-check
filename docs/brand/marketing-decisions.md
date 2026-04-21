# Marketing & Brand Decisions

Resolves the ambiguities flagged in `brand-audit.md` §8. Each decision is marked `[proposed — confirm]` so it can be reviewed line by line before being treated as canon. Once confirmed, strike the marker and update the cross-referenced file.

Decisions cross-reference `palette.json` (token-level canon) and `recibito.md` (mascot canon). If you change a decision here, update the linked file in the same commit.

---

## Decisions table

| # | Topic | Decision | Status |
|---|---|---|---|
| 1 | Wordmark casing in marketing copy | **Lowercase** — `text the check` everywhere, including metadata. "the" rendered in brand blue (`ttc-primary`) wherever typography allows. | `[proposed — confirm]` |
| 2 | Canonical "our green" | **`ttc-secondary`** (themeable, plumbed through `--color-secondary`, already the semantic success color). `ttc-whatsapp` is demoted to "WhatsApp-chrome only." | `[proposed — confirm]` |
| 3 | `ttc-accent` vs `ttc-danger` collision | **Reserve the coral-red pairing for destructive semantics only.** Retire "accent" as a marketing-energy color; use `ttc-primary` → `ttc-primary-light` gradients for marketing energy instead. | `[proposed — confirm]` |
| 4 | Landing radius | **`rounded-btn` (8px)** for CTAs — match the app's system radius. Accept that landing CTAs will look slightly tighter than they do today. Landing cards continue to use `rounded-card` (12px) or `rounded-modal` (16px) where appropriate. | `[proposed — confirm]` |
| 5 | Instagram safe-zone for wordmark | Wordmark position: **top-left by default** on 1:1 posts, **bottom-center** on 9:16 story headers. Minimum size: **≥12% of canvas width on 1:1**, **≥8% of canvas width on 9:16**. Clear space: at least one wordmark-height of padding from any edge or content. | `[proposed — confirm]` |
| 6 | Recibito density rule | **~80% of Instagram posts feature Recibito.** Exceptions: pure-data posts (stats cards, product screenshots, testimonial quotes). Every narrative / educational / emotional post includes Recibito. | `[proposed — confirm]` |

---

## Rationales

### 1. Wordmark casing — `text the check` (lowercase)

`AppLogo.vue:8-10` renders the wordmark lowercase with "the" in `ttc-primary`. `nuxt.config.ts:40` emits title case ("Text the Check") in metadata and the `og:title`. `CLAUDE.md:33` says "always lowercase." The system is currently split: the code enforces lowercase in-app, and the config emits title case for search-engine and social-preview consumption.

Recommend unifying on lowercase everywhere that the wordmark renders as typography — landing copy, IG posts, marketing emails, slide decks. Keep title case ONLY where a platform enforces it (browser tab title, some social embeds that cap the first letter regardless, legal filings). This matches the in-app wordmark rule, preserves the brand-blue "the" treatment wherever the wordmark appears, and stops copywriters from guessing. For metadata specifically: update `nuxt.config.ts:40` to `"text the check — tu plata, a un mensaje"`.

Impact on `recibito.md`: Recibito-adjacent captions always render the wordmark lowercase. That rule is now explicit in `recibito.md` → "Voice pairing" → "Wordmark in Recibito-adjacent copy."

### 2. Canonical "our green" — `ttc-secondary`

Three greens currently compete: `ttc-whatsapp` (`#25D366`, hardcoded raw hex, no theme variant), `ttc-secondary` / `ttc-success` (both `#25D366` → `#1FAD54`, themeable via CSS variables), and the shopping category color (`#10B981`, hardcoded outside the token system).

Recommend `ttc-secondary` as THE brand green because it is the only candidate already plumbed through the CSS-variable system — it theme-switches, it is already the semantic success color in `AmountDisplay`, and elevating it to "brand green" unifies semantic success + brand identity + marketing energy under one token. `ttc-whatsapp` remains a valid token, but scoped to WhatsApp-specific chrome (WhatsApp CTA buttons, `WhatsAppHeroDemo`) where its raw-hex behavior is desirable (it intentionally does not theme-shift, because WhatsApp green is the same everywhere). The shopping category green (`#10B981`) is pre-existing drift and should eventually be reconciled — but that is a category-color cleanup, not a brand-green decision.

Linked: `palette.json` → `metadata.canonical_green: "ttc-secondary"` and the accompanying `canonical_green_rationale` echoes this paragraph.

### 3. `ttc-accent` vs `ttc-danger` collision — reserve the pairing for destructive

`main.css:14` and `main.css:18` define `--color-accent` and `--color-danger` with identical hex values (`#E8533F` → `#D04030`). Tailwind exposes both as `ttc-accent` and `ttc-danger`. Today, a "delete this group" button and a brand hero gradient could legitimately both use the same color and both would be correct per the current system — which is to say the system has no opinion, and that is the problem.

Recommend reserving the coral-red pairing for destructive / error semantics only: destructive confirmations, error toasts, failed-state banners. Retire `ttc-accent` as a marketing color — in practice this means: no hero gradients using `ttc-accent`, no "energy" CTAs using `ttc-accent`. Marketing energy is carried by `ttc-primary` → `ttc-primary-light` gradients (already the dominant pattern in `LandingHero.vue`) and, where a warm complement is genuinely needed, `ttc-warning` (`#F5A623` → `#D97706`). This preserves the coral-red's signal value — if it appears, it means destruction — and removes the accidental homograph between "hero tone" and "you are about to delete data."

Code impact: audit for `ttc-accent` usage outside destructive contexts and migrate those call sites. `palette.json` now documents this intent in the `notes` fields of both `ttc-accent` and `ttc-danger`.

### 4. Landing radius — `rounded-btn` (8px)

The audit flags that landing CTAs use `rounded-2xl` (16px — Tailwind default) while the app's system radius scale defines `rounded-btn` as 8px (`tailwind.config.js:81-86`). This means the landing's "Escribile al bot por WhatsApp" button is visually pillier than any button inside the app. Users who click through from the landing to the app experience a small-but-real radius discontinuity.

Recommend normalizing to `rounded-btn` (8px). The landing will lose some of its "pillowy hero button" feel, but the system's own radius scale will finally rule — today the scale is defined and ignored on the very page users see first. Accept the aesthetic cost in exchange for the system consistency. Landing cards and card-like modules continue to use `rounded-card` (12px) or `rounded-modal` (16px) where the scale supports them; the change is scoped to CTA-style buttons. Call sites to update: `LandingHero.vue:28`, `LandingFinalCta.vue`, `LandingStickyWhatsApp.vue` — grep for `rounded-2xl` inside `components/landing/`.

### 5. Instagram safe-zone for wordmark

The audit flags that no Instagram templates exist. To unblock AI-generated IG content, the wordmark needs a hard-coded safe-zone rule.

Recommend: on **1:1 posts**, wordmark sits **top-left** at ≥12% of canvas width, with one wordmark-height of padding from top and left edges. On **9:16 stories**, wordmark sits **bottom-center** at ≥8% of canvas width, with one wordmark-height of padding from the bottom edge. The lower minimum on 9:16 reflects that story headers are narrower and more variable — 8% is readable without dominating. Bottom-center placement on stories acknowledges Instagram's UI chrome (reply bar at bottom, story header at top) — placing the wordmark at the bottom puts it inside the "content band" Instagram doesn't overlay. Top-left on 1:1 matches the visual-hierarchy convention of reading top-to-bottom, left-to-right.

These are minimums. Designers can push the wordmark larger or reposition for specific creative needs — the rule is the floor, not the exact placement.

### 6. Recibito density rule — ~80% of posts

The audit flags that no Recibito usage policy exists. Without a rule, either every post gets a mascot (erodes the mascot's emotional weight) or no post does (underuses the brand's strongest identity asset).

Recommend ~80%: every narrative, educational, emotional, or onboarding-style post includes Recibito in some pose; pure-data posts do not. The exceptions are specifically: stats cards ("$540k dividido entre 1.200 amigos este mes"), product screenshots, testimonial quotes with faces of real users, and any post where Recibito would compete for attention with a number the user needs to read. The 80% floor is what protects the mascot from becoming chrome — if Recibito appears in 100% of posts, including dry data dumps, the character stops carrying emotional weight.

Linked: `recibito.md` → "Usage policy" states the rule and the explicit exceptions.

---

## Cross-reference check

- **Decision #1 (wordmark casing)** ↔ `recibito.md` → "Voice pairing" → "Wordmark in Recibito-adjacent copy": both specify lowercase.
- **Decision #2 (canonical green)** ↔ `palette.json` → `metadata.canonical_green: "ttc-secondary"` and `metadata.canonical_green_rationale`: both name `ttc-secondary` and cite the same three-greens conflict.
- **Decision #3 (accent ↔ danger)** ↔ `palette.json` → `ttc-accent.notes` and `ttc-danger.notes`: both state the destructive-only reservation.
- **Decision #6 (Recibito density)** ↔ `recibito.md` → "Usage policy": both state the 80% rule with the same exception list.

If any of those four pairs diverge in a future edit, the system is inconsistent — treat divergence as a bug.
