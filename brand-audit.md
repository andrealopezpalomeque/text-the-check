# Brand & Design System Audit — text the check

Audit snapshot of the live visual system in `client/`. Purpose: a single brief to hand to AI tools producing landing illustrations, Instagram posts, and other on-brand assets. All findings reference real code (`file:line`). Not a refactor plan.

**Product**: WhatsApp-first financial companion. Argentina / LatAm. Two modes — Grupos (group expense splitting) and Finanzas (personal finances). Dark mode default, Spanish (`es_AR`).

---

## 1. Color system

**Architecture.** Two themes defined as CSS variables in `client/assets/css/main.css:6-57`:
- `:root` = dark ("Buenos Aires Night") — default
- `[data-theme="light"]` = warm cream override

Tailwind exposes them as `ttc-*` utilities in `client/tailwind.config.js:12-37`. Theme toggles via `data-theme` + `.dark` class (`client/nuxt.config.ts:65-66, 70`).

### Brand core

| Hex (dark → light) | Token | Where it's used |
|---|---|---|
| `#4A90D9` → `#3B7DD8` | `ttc-primary` (brand blue) | Wordmark accent on "the" (`AppLogo.vue:9`), headline highlight (`LandingHero.vue:13`), primary CTA bg |
| `#6BA8ED` → `#5A9AE8` | `ttc-primary-light` | Hover / gradient partner, rarely used alone |
| `#25D366` | `ttc-whatsapp` (hardcoded, `tailwind.config.js:35`) | WhatsApp CTA bg (`LandingHero.vue:28`), beta badge (`LandingHero.vue:7`), social-proof highlights |
| `#25D366` → `#1FAD54` | `ttc-secondary` / `ttc-success` | Success states, positive amounts |
| `#E8533F` → `#D04030` | `ttc-accent` / `ttc-danger` | Accent tone, error/destructive (same value — see flag below) |

### Surfaces

| Hex (dark → light) | Token | Notes |
|---|---|---|
| `#14110F` → `#FBF8F3` | `ttc-bg` | Warm off-black vs warm cream — not pure black/white |
| `#1C1815` → `#FFFFFF` | `ttc-surface` | |
| `#241F1A` → `#FFFFFF` | `ttc-card` | Identical to surface in light mode |
| `#3A322A` → `#E8E0D4` | `ttc-border` | Warm neutral |
| `#1E1A16` → `#F5F0E8` | `ttc-input` | Form field bg |
| `#2A2420` → `#F5F0E8` | `ttc-card-hover` | |

### Text

| Hex (dark → light) | Token | Notes |
|---|---|---|
| `#F0EBE3` → `#1A1510` | `ttc-text` | Warm off-white / dark brown — not pure white/black |
| `#9B8E80` → `#6B5E52` | `ttc-text-muted` | |
| `#6B5E52` → `#9B8E80` | `ttc-text-dim` | **Inverted** between themes (see flag) |

### Chat bubbles + toggles (product-specific)

`ttc-bubble-user-primary`, `ttc-bubble-user-accent`, `ttc-bubble-bot`, `ttc-toggle-primary`, `ttc-toggle-accent` — defined `main.css:24-29, 51-56`. Warm-tinted. Used in WhatsApp-style UI and app toggles.

### Semantic

- `ttc-warning` — `#F5A623` (dark) / `#D97706` (light)
- Tailwind `positive.*` and `negative.*` scales (50→900) in `tailwind.config.js:39-56` — used by `AmountDisplay` and `UserAvatar` for sentiment-coded UI

### Flags (inconsistencies)

1. **Three greens competing.** `#25D366` (WhatsApp/secondary), `#1FAD54` (success in light), `#10B981` (shopping category). No single "our green."
2. **`ttc-danger` = `ttc-accent`.** Same hex. A destructive action and a brand accent read identically — `main.css:14,18`.
3. **Category colors hardcoded, no dark variant.** `ExpenseItem.vue:148-155` defines 6 category hexes (`#F97316`, `#3B82F6`, `#A855F7`, `#EC4899`, `#10B981`, `#6B7280`) as a JS map, outside the token system.
4. **WhatsApp demo palette detached.** `WhatsAppHeroDemo.vue` uses 40+ hardcoded hexes (`#0b141a`, `#1f2c34`, `#00a884`, etc.) replicating real WhatsApp — intentional, but won't follow theme switching.
5. **`text-muted` vs `text-dim` inverted.** In dark mode muted is *lighter* than dim; in light mode muted is *darker* than dim (`main.css:16-17, 43-44`). Naming reads as contradictory.
6. **`ttc-whatsapp` is raw hex.** `tailwind.config.js:35` bypasses the CSS variable system; can't be themed.

---

## 2. Typography

### Fonts actually loaded

`nuxt.config.ts:19-27` via `@nuxtjs/google-fonts`:
- **Outfit** (500, 600) — wordmark
- **Nunito** (700, 800) — display / headings
- **DM Sans** (400–700) — body (default in `main.css:80`)
- **DM Mono** (400) — monospace

Tailwind `fontFamily` in `tailwind.config.js:72-79` exposes: `font-outfit`, `font-nunito`, `font-body` (DM Sans), `font-display` (Nunito), `font-dm-mono`, plus `font-sans` (Inter → Roboto → system-ui).

### Flag: CLAUDE.md claim mismatch

`CLAUDE.md:30` says fonts are "Outfit (wordmark), Nunito (headings), DM Sans (body), Poppins + Inter (app UI)." Reality:
- **Inter** is only a CSS fallback in `font-sans` — not loaded from Google Fonts.
- **Poppins** is not referenced anywhere in the config.

### Scale

No custom size scale — Tailwind defaults (`text-xs` → `text-5xl`). Most-used: `text-sm`, `text-base`, `text-lg`. Landing headlines use `clamp()` for fluid scaling, e.g. `text-[clamp(32px,7.5vw,56px)]` (`LandingHero.vue:11`).

### Wordmark rule (canonical)

`AppLogo.vue:8-10, 19-21`:
- `font-outfit font-semibold` (Outfit 600)
- `text-[16px]` horizontal / `text-2xl` stacked
- `tracking-[3px]` — wide kerning
- Always lowercase: `text the check`
- "the" wrapped in `<span class="text-ttc-primary">` → brand blue
- Variants: `horizontal`, `stacked`, `icon-only`

### Other notable treatments

- Landing H1: `uppercase`, `tracking-[0.08em]`, `leading-[1.1]` (`LandingHero.vue:11`)
- Beta badges: `text-[10px] tracking-[1.5px] uppercase` (`LandingHero.vue:7`)
- Body runs: `leading-relaxed` (1.625) for paragraph copy

### Flag

- No formal H1–H6 type scale documented. Headings are one-offs per page.
- Unclear when to use `font-nunito` vs `font-display` (both resolve to Nunito — aliases, not roles).

---

## 3. Component inventory

### Shared primitives (strong — `client/components/ui/`)

| Component | Variants | Props driving visuals |
|---|---|---|
| `Modal.vue` | 1 (responsive: bottom-sheet on mobile, centered on desktop) | `closeOnBackdrop` |
| `ConfirmDialog.vue` | 3 (default / warning / danger) | `variant`, `title`, `message`, `confirmText`, `cancelText` |
| `UserAvatar.vue` | 3 sizes × 3 color variants = 9 | `size`, `variant`, `name`, `photoUrl`, `showName` |
| `AmountDisplay.vue` | 7 sizes × 3 sentiment colors = 21 | `size`, `colorCoded`, `showSign`, `bold` |
| `CategoryIcon.vue` | 6 categories × 3 sizes = 18 | `category`, `size` |
| `EmptyState.vue` | 2 (default / compact) | `icon`, `title`, `description`, `actionLabel`, `compact` |

Used as proper primitives (e.g. `BalanceItem.vue:20-26, 44-50`, `ExpenseItem.vue:62-66, 79`).

### Landing components (isolated, inline-styled)

All under `client/components/landing/`: `LandingHero`, `LandingFeaturesExpanded`, `LandingInputTypes`, `LandingComparison`, `LandingHowItWorks`, `LandingSocialProof`, `LandingBetaBanner`, `LandingFinalCta`, `LandingStickyWhatsApp`, `WhatsAppHeroDemo`. No shared props — each is a bespoke section. Consistent-ish internally (same font roles, same tokens), but not composable.

### App-specific

- Grupos: `BalanceItem`, `ExpenseItem`, `SettlementItem`, `CreateGroupModal`, `AddGhostMemberModal`, `ExpenseModal`, `PaymentInfoModal`, `BottomNav`, `GroupStats`, `BalanceSummary`, `CreditSection`, `DebtSection`
- Layout: `AppHeader.vue`
- Shared: `AppLogo.vue`, `TtcSymbol.vue`

### Flag: missing primitives

- **No shared `Button` component.** Buttons reimplemented inline across:
  - `pages/iniciar-sesion.vue:36-96` (WhatsApp button, primary button, text link — 6× variations across login steps)
  - `pages/perfil.vue` (8+ ad-hoc button styles)
  - `pages/unirse.vue` (similar scatter)
  - `components/profile/LogoutButton.vue:3-9` (one-off gray)
- **No shared `Input` / `Field` component.** Same pattern repeated: `w-full px-3 py-2.5 border border-ttc-border rounded-btn bg-ttc-input`. Seen in `CreateGroupModal.vue:24-50`, `ExpenseModal.vue:32-59`, `iniciar-sesion.vue:28-69`.
- Two modal patterns (`Modal` + `ConfirmDialog`) — fine, but no shared dialog hierarchy.

Rating: strong primitive core for *display*; missing primitives for *input* and *action*. Most page-level scatter comes from those two gaps.

---

## 4. Spacing & layout

### Border radius (`tailwind.config.js:81-86`)

| Token | Value |
|---|---|
| `rounded-btn` | 8px |
| `rounded-tag` | 6px |
| `rounded-card` | 12px |
| `rounded-modal` | 16px |

**Drift**: landing CTAs use `rounded-2xl` (Tailwind default, 16px) — see `LandingHero.vue:28`. Should be `rounded-btn` (8px) to match system. Landing buttons are visibly pillier than app buttons as a result.

### Spacing tokens (usage patterns)

Tailwind defaults, no custom config. Most frequent:
- `gap-4` (16px) for rows / grids
- `p-4` / `p-5` / `p-6` for cards / sections
- `mb-7`, `mb-9` for landing rhythm
- `px-5` mobile → `md:px-8` desktop for section gutters
- `max-w-6xl` wrapper on landing (`LandingHero.vue:3`)

### Safe-area (`tailwind.config.js:87-96`)

- `p-safe`, `pt-safe-top`, `m-safe`, `h-screen-safe` — notch-aware helpers using `env(safe-area-inset-*)`
- Used by `BottomNav.vue` and modal bottom sheets

### Breakpoints

Tailwind defaults (`sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`). No custom config. Mobile-first is consistent.

### Shadows

No custom shadow scale. Usage is ad-hoc: `shadow-md`, `shadow-lg`, and the landing pattern `shadow-lg shadow-ttc-primary/10` (colored shadow with opacity). ~32 occurrences, inconsistent sizing.

### Animations (worth knowing for motion design)

Defined in `main.css:117-225`: `fadeUp`, `slideInLeft`, `slideInRight`, `popIn`, `float`, `shimmer`. Stagger helpers `.stagger-1` → `.stagger-5` (`main.css:221-225`). `prefers-reduced-motion` honored (`main.css:232-238`).

---

## 5. Illustration & iconography

### Recibito — the mascot

A receipt character (name: "recibito" = "little receipt" in es_AR slang). Files in `client/public/img/recibito/`:
- `confused.svg` — tilted receipt outline, dot eyes, floating 40%-opacity question mark
- `overwhelmed.svg` — alternate emotional state
- `recibito-v2.svg` — refinement
- `symbol.svg`, `symbol-primary.svg`, `symbol-white.svg`, `symbol-curved.svg`, `symbol-v2.svg` — symbol variants for themes

**Style principles** (consistent across assets):
- Stroke-based outlines (2.5–5px `stroke-width`)
- Rounded line caps (`stroke-linecap="round"`)
- `currentColor` fill so they inherit `text-ttc-*` — theme-responsive
- Emotion conveyed via asymmetric eye placement + floating metaphors (?, lines)
- Simplified receipt morphology: 3-tooth top/bottom, curved sides (see `components/TtcSymbol.vue:11-16`)

### Icons

`client/package.json:13-14, 22` — **Lucide** via:
- `@iconify-json/lucide` (1.2.87)
- `@iconify/vue` (5.0.0)
- `lucide-vue-next` (0.564.0)
- `unplugin-icons` (22.0.0) — auto-import, registered at `nuxt.config.ts:9`

Usage: auto-imported components like `<IconChartBox>`, `<IconPlus>`, `<IconGrid>`, `<IconShare>` (see `AppHeader.vue:20,29,65,75`). All Lucide — single stroke weight, monochromatic, inherits text color. **No mixed icon sources.**

### Gaps (what a richer landing/Instagram set would need)

1. **Onboarding illustrations** — nothing dedicated. First-run / empty-states currently lean on Lucide icons inside `EmptyState`.
2. **Emotional Recibito range is thin** — only confused + overwhelmed. Missing: celebratory, thinking, waving-hello, counting, sleeping, scanning-receipt, holding-phone.
3. **Scene compositions** — Recibito is always solo. No "Recibito + phone", "Recibito + group of friends", "Recibito + pile of receipts."
4. **No Instagram templates** — no 1:1 post frame, no 9:16 story frame, no carousel template with brand chrome.
5. **No WhatsApp conversation mockup illustration** separate from the live `WhatsAppHeroDemo.vue` component (which is a functional animation, not a static asset).
6. **No decorative patterns** — no dot grid, receipt-edge pattern, or brand texture usable as background.

---

## 6. Logo & brand assets

### Wordmark rule (authoritative)

`components/shared/AppLogo.vue:8-10`:

```
text <span class="text-ttc-primary">the</span> check
```

- Always lowercase
- "the" in brand blue (`ttc-primary`)
- Outfit Semibold, `tracking-[3px]`
- Three layout variants: `horizontal`, `stacked`, `icon-only`

Matches `CLAUDE.md:33` brand rule. Rendered on: `app.vue:14` (auth overlay), `pages/index.vue:9` (landing), `pages/iniciar-sesion.vue:6` (login).

### Symbol

`components/TtcSymbol.vue` — inline SVG receipt, `currentColor`, `w-9 h-9` default in horizontal layout. Themeable.

### Available files (in `client/public/img/`)

| File | Format | Purpose |
|---|---|---|
| `ttc_logo_dark.svg` / `ttc_logo_light.svg` | SVG | Full logo, theme variants |
| `ttc_horizontal_dark.svg` / `_light.svg` | SVG | Horizontal wordmark + symbol |
| `ttc_symbol.svg` | SVG (1200×1200) | Standalone symbol |
| `ttc_symbol_*.png`, `ttc_logo_transparent.png` | PNG | Fallbacks, transparent variants |
| `favicon.png` | 512×512 PNG | Browser tab |
| `og-image.png` | 1200×630 PNG | Social preview (`nuxt.config.ts:50-53`) |

### Flag

- **No `BRAND.md` / `DESIGN.md` in the repo.** The `confused.svg` comment even references a missing `DESIGN.md`. Brand rules live only in `CLAUDE.md` and implicitly in `AppLogo.vue`.
- No explicit clear-space, min-size, or misuse rules.
- No Instagram-ready logo lockups (square safe-area variants, dark-on-light story headers, etc.).

---

## 7. Voice & copy tone

### Microcopy samples

| # | Copy | Where |
|---|---|---|
| 1 | "Dividí gastos en grupo. Sin planillas. Sin discusiones." | `LandingHero.vue:12-14` (H1) |
| 2 | "Mandale un mensaje al bot de WhatsApp con lo que gastaste y listo." | `LandingHero.vue:18` (subhead) |
| 3 | "Escribile al bot por WhatsApp" / "Escribile al bot" | `LandingHero.vue:31-32` (CTA) |
| 4 | "✦ beta gratuita — sin tarjeta" | `LandingHero.vue:8` (badge) |
| 5 | "Ya tengo cuenta →" | `LandingHero.vue:38` (secondary CTA) |
| 6 | "Verificando sesión..." | `app.vue:17` (auth loader) |
| 7 | "Iniciá sesión para continuar" | `pages/iniciar-sesion.vue:8` |
| 8 | "¿Ya tenés una cuenta creada por WhatsApp?" | `pages/iniciar-sesion.vue:103` |
| 9 | "Sí, vincular con WhatsApp" | `pages/iniciar-sesion.vue:113` |
| 10 | "Ej: Viaje a Bariloche" | `CreateGroupModal.vue:28` (placeholder) |
| 11 | "Almuerzo en el centro" | `ExpenseModal.vue:57` (placeholder) |
| 12 | "¿Seguro que querés cerrar sesión?" | `profile/LogoutButton.vue:14` |
| 13 | "Sin gastos asociados" | `grupos/balance/BalanceItem.vue:96` (empty) |
| 14 | "Pagué 5 lucas del uber del aeropuerto" | `landing/LandingInputTypes.vue:85` (example input) |
| 15 | Metadata: "Text the Check — Tu plata, a un mensaje" / "Dividí gastos de viaje con amigos por WhatsApp, todo en un mensaje." | `nuxt.config.ts:40, 44` |

### Language

- **Pure Spanish (es_AR)**. No mixed English except product name itself.
- **Vos form** (Argentine 2nd-person): *iniciá, mandá, tenés, querés, dividí*. Never *tú* or *usted*.
- **Argentinismos**: *"lucas"* (pesos), *"che"*, *"quilombo"* (see `LandingSocialProof.vue`).
- Currency example uses slang, not pesos — a deliberate voice choice that wouldn't port to Mexico or Spain without localization.

### Tone — 3 adjectives

1. **Conversational / peer-level.** Reads like a WhatsApp message from a friend. Evidence: "Mandale un mensaje al bot" (`LandingHero.vue:18`), "¿Seguro que querés cerrar sesión?" (`LogoutButton.vue:14`). No "please," no formal verbs.
2. **Action-forward, zero hedging.** CTAs are imperative and short: "Escribile al bot", "Crear grupo", "Agregar Gasto". Form placeholders are concrete examples, not abstract labels: "Ej: Viaje a Bariloche", "Almuerzo en el centro."
3. **Locally grounded / Argentine.** Vos form, lunfardo, peso-normal examples ("5 lucas del uber del aeropuerto"). Not neutralized for international Spanish — a voice choice, not an oversight.

### Brand-name rendering in copy

- In logo / wordmark: **lowercase** ("text the check"), brand-blue "the".
- In metadata and marketing titles: **Title Case** ("Text the Check" — `nuxt.config.ts:40`). Inconsistent with the CLAUDE.md "always lowercase" rule — copy writers should note.

---

## 8. Gaps & recommendations

### Three things that would make AI-assisted design generation smoother

1. **Ship a `palette.json` swatch file alongside this audit.** Export all `ttc-*` tokens as JSON with name, hex (dark + light), and intent ("brand", "semantic-success", "surface-card"). AI image tools can ingest it directly; humans can paste hexes into Figma / Canva. Today the colors are scattered across CSS variables, Tailwind config, hardcoded component maps, and inline landing hexes.
2. **Write a one-paragraph Recibito character bible.** Current state: we have 2 emotional SVGs and zero written guidance. AI tools will invent their own Recibito unless we pin down: silhouette (receipt shape with torn top/bottom), eye style (dots, sometimes asymmetric), expression range (confused, overwhelmed, and what else is canonical?), line-weight (2.5–5px, rounded caps), no color fill — always `currentColor`. Pair with 2–3 reference SVGs re-linked from this audit.
3. **Define Instagram-ready asset templates.** Specify brand-chrome zones for 1:1 post, 9:16 story, 4:5 reel cover: wordmark position, safe area, bg color (dark or cream?), Recibito focal point rules. Currently there is no such template — every AI-generated post will start from zero.

### Three things to fix before treating this as a locked system

1. **Build shared `Button` and `Input` primitives.** The page-level visual scatter (login, profile, join, logout) traces to these two missing components. Until they exist, pages will drift further every time someone adds a flow. Good news: the token system is ready — `rounded-btn`, `ttc-primary`, `ttc-input`, etc. all exist.
2. **Reconcile the greens and the `danger == accent` collision.** Pick one "our green" for the brand (likely `ttc-secondary` / WhatsApp-adjacent), and decouple destructive-red from accent-red so an error doesn't carry the same visual weight as a hero gradient. Same exercise: move category colors (`ExpenseItem.vue:148-155`) into the token system with dark-mode variants.
3. **Make the docs and the code agree.** `CLAUDE.md:30` lists Poppins + Inter as app UI fonts — neither is loaded. Either load them and use them, or remove the claim. Same for the dangling `DESIGN.md` reference in `confused.svg`. The more the written brand contradicts the rendered brand, the less useful AI tools find either one. Also: normalize landing buttons from `rounded-2xl` to `rounded-btn` (8px) so the system's own radius scale actually rules.
