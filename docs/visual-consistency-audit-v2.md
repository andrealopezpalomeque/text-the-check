# Visual Consistency Audit v2: Root Pages, Logo, Theme, Components

**Date:** 2026-03-03
**Scope:** Everything NOT covered by v1 audit (which focused on Finanzas/Grupos color migration)

---

## 1. ROOT PAGES AUDIT

Pages scanned: `index.vue`, `privacy.vue`, `landing-prueba.vue`, `configurar.vue`, `iniciar-sesion.vue`, `perfil.vue`, `unirse.vue`

### Summary Table

| Page | Color System | Light Mode | Headings Font | Primary Color | Grade |
|------|-------------|------------|---------------|---------------|-------|
| `index.vue` | Structural (delegates to components) | — | — | — | N/A |
| `landing-prueba.vue` | Structural (delegates to components) | — | — | — | N/A |
| `configurar.vue` | N/A (redirect to `/grupos`) | — | — | — | N/A |
| **`iniciar-sesion.vue`** | **ttc-\* tokens throughout** | **Full** | **font-nunito** | **ttc-primary** | **Excellent** |
| **`perfil.vue`** | ttc-\* tokens + scattered hardcoded | Partial | font-display | ttc-primary | Good |
| **`privacy.vue`** | Mixed (ttc-\* bg + hardcoded text) | Dark-only | font-display | Wrong (blue-400) | Fair |
| **`unirse.vue`** | **Hardcoded Tailwind only** | **dark: pairs** | **font-display** | **Wrong (indigo-600)** | **Poor** |

### CRITICAL

| File | Finding |
|------|---------|
| `pages/unirse.vue` | **Zero ttc-\* token usage.** Entire page uses hardcoded Tailwind colors (`bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`, `bg-indigo-600`). Completely outside the design system. |
| `pages/unirse.vue` | **Wrong primary color**: Uses `bg-indigo-600 hover:bg-indigo-700` and `bg-green-600` for CTAs instead of `bg-ttc-primary`. |
| `pages/privacy.vue` | **Dark-only page**: Uses `text-white`, `prose-invert`, hardcoded `text-gray-300/400/500` with no light-mode alternatives. Will be unreadable if user switches to light mode. |

### INCONSISTENT

| File | Line(s) | Current | Should Be |
|------|---------|---------|-----------|
| `perfil.vue` | 39 | `text-red-500 dark:text-red-400` | `text-ttc-danger` |
| `perfil.vue` | 113, 128 | `bg-blue-100 dark:bg-blue-900/30` | `bg-ttc-primary/10` |
| `perfil.vue` | 194 | `bg-green-100 dark:bg-green-900/30` | `bg-ttc-success/10` |
| `perfil.vue` | 261, 378 | `bg-red-50 dark:bg-red-900/20` | `bg-ttc-danger/10` |
| `perfil.vue` | 67 | `from-blue-500 to-indigo-600` (avatar) | Brand primary gradient |
| `perfil.vue` | 148, 347, 360 | `placeholder-gray-400` | `placeholder:text-ttc-text-dim` |
| `privacy.vue` | 24, 74, 111 | `text-blue-400 hover:text-blue-300` (links) | `text-ttc-primary hover:text-ttc-primary-light` |
| `privacy.vue` | 6 | `text-gray-500` (back button) | `text-ttc-text-muted` |
| `privacy.vue` | 16 | `text-gray-400` (date) | `text-ttc-text-muted` |
| `unirse.vue` | 2 | `bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800` | `bg-ttc-bg` |
| `unirse.vue` | 25, 36 | `bg-white dark:bg-gray-800` | `bg-ttc-card` |
| `unirse.vue` | 56 | `border-gray-200 dark:border-gray-600` | `border-ttc-border` |

### MINOR

| File | Finding |
|------|---------|
| `perfil.vue` | Uses `font-display` (Poppins) for headings — brand spec says Nunito |
| `privacy.vue` | Uses `font-display` (Poppins) for heading — brand spec says Nunito |
| `unirse.vue` | Uses `font-display` for heading — same issue |

---

## 2. LOGO & WORDMARK AUDIT

### All Instances

| File | Line | Rendering | Font | Size | "the" Accented? | Correct? |
|------|------|-----------|------|------|-----------------|----------|
| `components/layout/AppHeader.vue` | 9-12 | `<TtcSymbol>` + `<span>` text | Outfit 600, tracking-[3px] | text-sm (14px) | Yes (`text-ttc-primary`) | **Yes** |
| `components/LandingHeader.vue` | 6-9 | `<TtcSymbol>` + `<span>` text | Outfit 600, tracking-[3px] | text-sm (14px) | Yes (`text-ttc-primary`) | **Yes** |
| `components/LandingFooter.vue` | 5-7 | `<span>` text only | Outfit 600, tracking-[3px] | text-sm (14px) | Yes (`text-ttc-primary`) | **Yes** |
| `components/finanzas/FinanzasNav.vue` | 8-11 | `<TtcSymbol>` + `<span>` text | Outfit 600, tracking-[3px] | text-sm (14px) | Yes (`text-ttc-primary`) | **Yes** |
| `pages/iniciar-sesion.vue` | 7-9 | `<TtcSymbol>` + `<h1>` text | **Nunito 800** (not Outfit) | text-2xl (24px) | Yes (`text-ttc-primary`) | **No** — wrong font |
| `pages/unirse.vue` | 5-7 | `<h1>` text only (no symbol) | **font-display** (Poppins) | text-4xl (36px) | **No** — plain white | **No** — wrong font, no accent |
| `components/ChatPreview.vue` | 21 | `<p>` text | **Nunito** (not Outfit) | text-sm (14px) | **No** — plain text | **No** — wrong font, no accent |

### SVG Logo Files

| File | Font | Letter-spacing | "the" Color | Status |
|------|------|---------------|-------------|--------|
| `public/img/ttc_logo_dark.svg` | Outfit 600 | 3px | `#4A90D9` | **Correct** |
| `public/img/ttc_logo_light.svg` | Outfit 600 | 3px | `#3B7DD8` | **Correct** |

### Symbol Component

| File | Type | Default Size | Color |
|------|------|-------------|-------|
| `components/TtcSymbol.vue` | Inline SVG (receipt + chat) | w-7 h-7 (28px) | `currentColor` (inherits) |

### Image Assets in `public/img/`

- `ttc_logo_transparent.png` — Full logo PNG
- `ttc_logo_white_transparent.png` — White variant
- `ttc_symbol_primary.png` — Blue receipt symbol
- `ttc_symbol_white.png` — White receipt symbol
- `ttc_symbol.svg` — SVG receipt symbol
- `og-image.png` — Open Graph image (1200x630)
- `favicon.png` — Referenced in `nuxt.config.ts:78`

### CRITICAL

| Finding | Details |
|---------|---------|
| **`unirse.vue` wordmark is broken** | "Text The Check" rendered in Poppins (font-display) at text-4xl with no blue accent on "the". Should be Outfit 600 with tracking-[3px] and `text-ttc-primary` on "the". No TtcSymbol icon either. |

### INCONSISTENT

| Finding | Details |
|---------|---------|
| **`iniciar-sesion.vue` uses Nunito for wordmark** | Renders `font-nunito font-extrabold text-2xl` — brand wordmark should always be Outfit 600, tracking-[3px]. The blue accent on "The" is correct. |
| **`ChatPreview.vue` plain wordmark** | "Text the Check" in Nunito bold with no blue accent on "the". In a chat context this may be acceptable (simulating a contact name), but inconsistent. |
| **Meta tags in `nuxt.config.ts`** | `title: 'Text the Check'` — plain text, no accent possible. Acceptable for `<title>` tag. |

---

## 3. THEME TOGGLE AUDIT

### Toggle Presence

| File | Type | ThemeToggle Present? |
|------|------|---------------------|
| `layouts/default.vue` | Bare slot wrapper | No (delegates to page headers) |
| `layouts/finanzas.vue` | Structured layout | No (delegates to FinanzasNav) |
| `layouts/grupos.vue` | Structured layout | No (delegates to AppHeader) |
| `layouts/landing.vue` | Landing wrapper | No (delegates to LandingHeader) |
| `components/layout/AppHeader.vue` | Grupos desktop nav | **Yes** (line 47) |
| `components/finanzas/FinanzasNav.vue` | Finanzas desktop nav | **Yes** (line 25) |
| `components/LandingHeader.vue` | Landing header | **Yes** (line 26) |
| `components/finanzas/FinanzasBottomNav.vue` | Mobile bottom nav | No (no room) |
| `components/grupos/navigation/BottomNav.vue` | Mobile bottom nav | No (no room) |

### Theme Mechanism Analysis

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Tailwind config** | `darkMode: 'class'` | Correct — watches `.dark` on `<html>` |
| **CSS variables** | `:root` (dark default) + `[data-theme="light"]` | Correct — 21 tokens, both modes |
| **Composable** | `useTheme.js` — sets both `.dark` class AND `data-theme` attribute | Correct — kept in sync |
| **Flash prevention** | Inline `<script>` in `<head>` via `nuxt.config.ts` | Correct — runs before Vue mounts |
| **Default** | Dark mode | Correct — `htmlAttrs: { class: 'dark', 'data-theme': 'dark' }` |
| **Persistence** | `localStorage('ttc-theme')` | Correct |

### CRITICAL

| Finding | Details |
|---------|---------|
| **Dual mechanism creates fragility** | Components using `dark:` Tailwind variants depend on `.dark` class. Components using `ttc-*` tokens depend on `data-theme` attribute. If either gets out of sync, parts of the UI break. Currently `applyTheme()` keeps them synced, but this is a single point of failure with no validation. |

### Files Still Using `dark:` Variants (26 files)

These depend on the `.dark` class mechanism (NOT CSS variables):

| File | What Uses `dark:` |
|------|-------------------|
| `ui/ConfirmDialog.vue` | Warning/danger backgrounds (`dark:bg-yellow-900/30`, `dark:bg-red-900/20`) |
| `ui/CategoryIcon.vue` | Category color backgrounds |
| `ui/AmountDisplay.vue` | Text color fallbacks |
| `ui/UserAvatar.vue` | Gradient backgrounds |
| `profile/PaymentInfoModal.vue` | `bg-white dark:bg-gray-800` (should be ttc-card) |
| `profile/LogoutButton.vue` | Gray backgrounds |
| `grupos/balance/BalanceSummary.vue` | Positive/negative text colors |
| `grupos/balance/BalanceList.vue` | Hover states |
| `grupos/balance/DebtSection.vue` | Blue text |
| `grupos/expense/PaymentItem.vue` | Positive icon backgrounds |
| `grupos/expense/ExpenseModal.vue` | Error state backgrounds |
| `grupos/group/GroupList.vue` | Hover borders/shadows |
| `grupos/group/CreateGroupModal.vue` | Error text |
| `grupos/group/AddGhostMemberModal.vue` | Error text |
| `grupos/settlement/SettlementList.vue` | Success state backgrounds |
| `grupos/settlement/SettlementItem.vue` | Success text |
| `grupos/settlement/PaymentInfoRow.vue` | Positive/blue text |
| `pages/grupos/index.vue` | Error/info alerts |
| `pages/grupos/reporte.vue` | Chart colors, info icons |
| `pages/perfil.vue` | Badges, errors, alerts |
| `pages/unirse.vue` | Entire page (every element) |

### INCONSISTENT

| Finding | Details |
|---------|---------|
| **Mixed theming strategies** | Some components use `bg-ttc-card` (CSS variable), others use `bg-white dark:bg-gray-800` (Tailwind variant). Both work, but maintaining two systems increases complexity. |
| **No mobile toggle** | Bottom navs (FinanzasBottomNav, BottomNav) have no theme toggle. Mobile-only users must access desktop nav or have no way to switch themes (unless they visit landing page). |

---

## 4. COMPONENT INVENTORY

### Cards

**No shared Card component exists.** All cards are inline `<div>` with classes.

| Implementation | Background | Border | Radius | Shadow | Padding |
|---------------|------------|--------|--------|--------|---------|
| Grupos GroupList | `bg-ttc-card` | `border-ttc-border` | `rounded-xl` | — | `p-5` |
| Grupos BalanceSummary | `bg-ttc-card` | `border-ttc-border` | `rounded-xl` | `shadow-sm` | `p-6` |
| Grupos ExpenseList | `bg-ttc-card` | `border-ttc-border` | `rounded-xl` | `shadow-sm` | — |
| Finanzas TemplateList | dynamic colors | — | `rounded-full` | — | `px-4 py-2` |
| ModeCard | `bg-ttc-card` | `border` | `rounded-xl` | — | — |
| **PaymentInfoModal** | **`bg-white dark:bg-gray-800`** | — | `rounded-xl` | `shadow-xl` | — |

### Buttons

**No shared Button component exists.** All buttons are inline `<button>` with classes.

| Variant | Classes | Locations |
|---------|---------|-----------|
| Primary | `bg-ttc-primary hover:bg-ttc-primary/90 text-white px-4 py-2.5 rounded-btn` | ExpenseModal, CreateGroupModal |
| Secondary | `border border-ttc-border text-ttc-text rounded-btn hover:bg-ttc-card-hover px-4 py-2.5` | Modal cancel buttons |
| Danger | `bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2` | ConfirmDialog |
| Icon | `p-1.5 rounded-lg text-ttc-text-muted hover:bg-ttc-card-hover` | Modal close buttons |
| Ghost | `text-ttc-primary hover:text-ttc-primary/80 font-medium text-sm` | "Ver más" links |
| FAB | `fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg` | PaymentsNewPayment |

### Modals / Dialogs

| Component | Type | API | Used By |
|-----------|------|-----|---------|
| `ui/Modal.vue` | Generic wrapper (bottom-sheet mobile, centered desktop) | `ref.open()` / `ref.close()` | Finanzas forms, shared |
| `ui/ConfirmDialog.vue` | Confirmation with variants (warning/danger) | `v-model` binding | Grupos, shared |
| **`finanzas/ConfirmDialogue.vue`** | **DUPLICATE** confirmation dialog | `ref.reveal()` (@vueuse) | Finanzas only |
| `grupos/expense/ExpenseModal.vue` | Custom inline modal (not using Modal.vue) | `useNavigationState()` | Grupos expenses |
| `grupos/group/CreateGroupModal.vue` | Custom inline modal | Props `isOpen` | Grupos groups |
| `grupos/group/AddGhostMemberModal.vue` | Custom inline modal | Props `isOpen` | Grupos groups |
| `profile/PaymentInfoModal.vue` | Custom Teleport (not using Modal.vue) | Props + emit | Profile page |

### Form Inputs

**No shared Input component exists.** All inputs are inline.

| Context | Background | Border | Radius | Focus Ring |
|---------|------------|--------|--------|------------|
| Grupos modals | `bg-ttc-input` | `border-ttc-border` | `rounded-btn` | `focus:ring-ttc-primary` |
| Finanzas forms | `bg-ttc-input` | `border-ttc-border` | `rounded-btn` | `focus:ring-ttc-primary` |
| **PaymentInfoModal** | **`bg-gray-700`** | **`border-gray-600`** | **`rounded-md`** | — |

### Loading States

| Pattern | Implementation | Where Used |
|---------|---------------|------------|
| Skeleton shimmer | `skeleton-shimmer` CSS class + `bg-ttc-input` divs | Finanzas index, pagos-unicos, Grupos index |
| Full-screen spinner | `finanzas/Loader.vue` (Teleport + animate-spin SVG) | PaymentsDetails |
| Button text swap | `{{ submitting ? 'Guardando...' : 'Guardar' }}` | All form modals |
| Pulse animation | `animate-pulse` on bars | PaymentsDetails header |

### Empty States

| Component | Type | Where Used |
|-----------|------|------------|
| `ui/EmptyState.vue` | **Shared** — icon + title + description + CTA | GroupList, ExpenseList, pagos-unicos |
| Inline text-only | `text-center text-ttc-text-muted` | DebtSection, CreditSection |
| Inline success state | Custom icon circle + text | SettlementList ("Todos al dia") |

---

## 5. FINDINGS BY SEVERITY

### CRITICAL (Breaks layout/readability)

| # | Finding | Files Affected |
|---|---------|----------------|
| C1 | **`unirse.vue` completely outside design system** — zero ttc-\* tokens, wrong primary color (indigo-600), wrong font | `pages/unirse.vue` |
| C2 | **`unirse.vue` wordmark broken** — "Text The Check" in Poppins, no blue accent on "the", no TtcSymbol | `pages/unirse.vue` |
| C3 | **`privacy.vue` dark-only** — hardcoded whites/grays, will be unreadable in light mode | `pages/privacy.vue` |
| C4 | **Duplicate confirm dialog** — `ConfirmDialog.vue` (shared) vs `ConfirmDialogue.vue` (Finanzas) with incompatible APIs | `ui/ConfirmDialog.vue`, `finanzas/ConfirmDialogue.vue` |

### INCONSISTENT (Works but differs from other parts)

| # | Finding | Files Affected |
|---|---------|----------------|
| I1 | **`perfil.vue` mixes ttc-\* tokens with hardcoded semantic colors** — ~25 instances of `dark:text-red-*`, `dark:bg-blue-*`, `dark:bg-green-*` instead of ttc-danger/success/primary | `pages/perfil.vue` |
| I2 | **`privacy.vue` links use wrong blue** — `text-blue-400` instead of `text-ttc-primary` | `pages/privacy.vue` |
| I3 | **`iniciar-sesion.vue` wordmark uses Nunito** instead of Outfit 600 | `pages/iniciar-sesion.vue` |
| I4 | **`ChatPreview.vue` wordmark plain** — no blue accent on "the", uses Nunito | `components/ChatPreview.vue` |
| I5 | **PaymentInfoModal uses hardcoded colors** — `bg-white dark:bg-gray-800` instead of `bg-ttc-card`, `bg-gray-700`/`border-gray-600` for inputs | `profile/PaymentInfoModal.vue` |
| I6 | **Grupos modals don't use shared Modal.vue** — ExpenseModal, CreateGroupModal, AddGhostMemberModal all have custom inline modal implementations | `grupos/expense/ExpenseModal.vue`, `grupos/group/CreateGroupModal.vue`, `grupos/group/AddGhostMemberModal.vue` |
| I7 | **No mobile theme toggle** — FinanzasBottomNav and BottomNav have no ThemeToggle, mobile-only users can't switch themes from within the app | Bottom nav components |
| I8 | **Button padding inconsistency** — primary buttons range from `px-4 py-2` to `px-6 py-2.5` across different contexts | Multiple files |
| I9 | **26 files still use `dark:` Tailwind variants** instead of CSS variable tokens for semantic colors (error, success, warning states) | See theme toggle section |
| I10 | **`font-display` maps to Poppins** — used in `perfil.vue`, `privacy.vue`, `unirse.vue` headings; brand says headings = Nunito | Multiple root pages |

### MINOR (Cosmetic only)

| # | Finding | Files Affected |
|---|---------|----------------|
| M1 | **No shared Card/Button/Input components** — all styling is inline, increasing inconsistency risk | Codebase-wide |
| M2 | **Multiple loading patterns** — skeleton shimmer, full-screen Loader, button text swap, animate-pulse all coexist | Multiple files |
| M3 | **Some empty states don't use EmptyState.vue** — DebtSection, CreditSection, SettlementList use inline patterns | Grupos balance components |
| M4 | **Meta title uses plain "Text the Check"** — no accent possible in `<title>`, acceptable | `nuxt.config.ts` |
| M5 | **Favicon is PNG** — no SVG favicon for theme-aware icon | `public/favicon.png` |

---

## 6. RECOMMENDED IMPLEMENTATION ORDER

### Phase 3A: Fix Root Pages (High Impact)
1. **Refactor `unirse.vue`** — migrate entirely to ttc-\* tokens, fix wordmark (Outfit 600, blue "the", add TtcSymbol)
2. **Fix `privacy.vue`** — add light mode support, replace hardcoded colors with ttc-\* tokens
3. **Clean up `perfil.vue`** — replace ~25 hardcoded semantic colors with ttc-danger, ttc-success, ttc-primary/10

### Phase 3B: Fix Wordmark Consistency (Medium Impact)
4. **Fix `iniciar-sesion.vue` wordmark** — change font-nunito to font-outfit, add tracking-[3px]
5. **Fix `ChatPreview.vue`** — add blue accent on "the" (or document exception for chat context)

### Phase 3C: Consolidate Components (Medium Impact)
6. **Remove `ConfirmDialogue.vue`** — migrate Finanzas to shared `ConfirmDialog.vue`
7. **Fix `PaymentInfoModal.vue`** — wrap in Modal.vue, replace hardcoded colors
8. **Consider migrating Grupos modals** to shared Modal.vue (larger effort)

### Phase 3D: Polish (Low Impact)
9. Add mobile theme toggle (settings page or profile page)
10. Extract shared Button/Input components (prevents future drift)
11. Standardize loading state pattern (document preferred approach)
