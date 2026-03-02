# Visual Consistency Audit: Finanzas vs Grupos

**Date:** 2026-03-02
**Status:** Phase 1.5 complete — theme toggle available app-wide

## 1. TAILWIND CONFIG

### Colors
- **Brand tokens defined?** Partially. CSS variables (`ttc-*`) exist for the landing page with correct Deep Trust values. However, the app sections (Grupos + Finanzas) largely bypass these tokens and use default Tailwind colors.
- **`primary` token mismatch:** `tailwind.config.js:42` defines `primary.DEFAULT` as `#3b82f6` (Tailwind blue-500). Brand spec says accent should be `#4A90D9` (dark) / `#3B7DD8` (light). These are different blues.
- **Missing brand color tokens:** No `success`, `warning`, or `danger` tokens are defined in the config, yet Finanzas pages reference `bg-success`, `text-warning`, `text-danger` classes — these will NOT work unless defined elsewhere.

### Fonts
- **Nunito loaded?** Yes — `nuxt.config.ts:17` loads Nunito 700, 800. Tailwind defines `font-nunito`.
- **DM Sans loaded?** Yes — `nuxt.config.ts:18` loads DM Sans 400-700. Tailwind defines `font-body`.
- **Problem:** `font-display` maps to **Poppins**, not Nunito. Per brand manual, headings should use Nunito.
- **`font-nunito` is defined but NEVER USED** in any Grupos or Finanzas component.

### Spacing/Radius
- Custom border-radius tokens exist: `rounded-card` (12px), `rounded-btn` (8px) — correct per spec.
- No custom spacing tokens for 16px base / 24px section gaps, but Tailwind defaults `p-4` = 16px and `gap-6` = 24px, which matches.
- **`rounded-card` is defined but rarely used** — components use `rounded-xl` (also 12px) or `rounded-lg` (8px) inconsistently.

---

## 2. COLOR INCONSISTENCIES

### CRITICAL: Two Incompatible Color Systems

The codebase runs **two different theming approaches simultaneously**:

| Aspect | Landing | Grupos | Finanzas |
|--------|---------|--------|----------|
| Theme method | CSS vars (`ttc-*`) | Tailwind `dark:` variant | **Mixed** (some `ttc-*`, mostly hardcoded) |
| BG dark | `#0C1017` (correct) | `bg-gray-900` = `#111827` | `bg-gray-900` = `#111827` |
| Card dark | `#141B25` (correct) | `bg-gray-800` = `#1f2937` | `bg-gray-800` = `#1f2937` |
| Accent | `#4A90D9` (correct) | `bg-blue-600` = `#2563eb` | `bg-blue-600` / `bg-primary` = `#3b82f6` |
| Text | `#E2E8F0` (correct) | `dark:text-white` = `#fff` | `text-white` = `#fff` |
| Muted | `#7B8FA6` (correct) | `dark:text-gray-400` = `#9ca3af` | `text-gray-400` = `#9ca3af` |

### Detailed Findings

#### VISUALLY JARRING

| File | Line | Current | Should Be | Issue |
|------|------|---------|-----------|-------|
| `layouts/finanzas.vue` | 2 | `bg-gray-50 dark:bg-gray-900` | `bg-ttc-bg` | BG #111827 instead of brand #0C1017 |
| `components/finanzas/FinanzasNav.vue` | ~1 | `bg-white dark:bg-gray-800` | `bg-ttc-surface` | Card #1f2937 instead of brand #131920 |
| `components/finanzas/FinanzasBottomNav.vue` | ~1 | `bg-white dark:bg-gray-800` | `bg-ttc-surface` | Same issue |
| `pages/finanzas/summary.vue` | multiple | `bg-gray-800` (no dark: prefix) | `bg-ttc-card` | Hardcoded — breaks in light mode |
| `pages/grupos/index.vue` | multiple | `bg-white dark:bg-gray-800` | `bg-ttc-card` | Wrong dark gray |
| `components/layout/AppHeader.vue` | 93 | `bg-blue-600` (#2563eb) | `bg-ttc-primary` (#4A90D9) | Wrong blue for primary button |
| `components/finanzas/FinanzasBottomNav.vue` | ~50 | `bg-blue-600` (#2563eb) | `bg-ttc-primary` (#4A90D9) | Wrong blue for FAB |
| `pages/finanzas/summary.vue` | ~60 | `bg-blue-600` (tab active) | `bg-ttc-primary` | Wrong blue |

#### INCONSISTENT

| File | Line | Current | Should Be | Issue |
|------|------|---------|-----------|-------|
| `components/grupos/expense/ExpenseItem.vue` | border | `border-gray-100 dark:border-gray-700` | `border-ttc-border` | Grupos borders != brand #242E3C |
| `pages/finanzas/categories.vue` | borders | `border-gray-600` | `border-ttc-border` | Different from Grupos borders |
| `pages/finanzas/one-time.vue` | cards | `bg-ttc-surface` + `border-gray-600` | Consistent tokens | Mixing systems |
| `pages/finanzas/summary.vue` | stats | `bg-gray-700/40` | `bg-ttc-surface` or `bg-ttc-card` | Hardcoded opacity variant |
| `components/ui/ConfirmDialog.vue` | 103 | `bg-blue-600` (#2563eb) | `bg-ttc-primary` (#4A90D9) | Shared component uses wrong blue |
| All Finanzas pages | muted text | `text-gray-400` (#9ca3af) | Brand muted #7B8FA6 | Wrong muted gray |
| All Grupos components | muted text | `dark:text-gray-400` (#9ca3af) | Brand muted #7B8FA6 | Same wrong gray |

#### MINOR

| File | Line | Current | Should Be | Issue |
|------|------|---------|-----------|-------|
| `components/ui/UserAvatar.vue` | 93 | `from-blue-500 to-indigo-600` | Brand gradient TBD | Arbitrary gradient |
| `components/ui/CategoryIcon.vue` | colors | Various Tailwind defaults | Brand-derived | Category colors not in brand spec |
| `pages/finanzas/weekly-summary.vue` | shadow | `shadow-white/5` | Consistent shadow token | Non-standard shadow |

---

## 3. TYPOGRAPHY INCONSISTENCIES

### VISUALLY JARRING

| Finding | Details |
|---------|---------|
| **Headings NOT using Nunito** | Zero instances of `font-nunito` in any Grupos or Finanzas component. All headings render in DM Sans (body font). Brand spec requires Nunito 700-800 for headings. |
| **`font-display` = Poppins, not Nunito** | `tailwind.config.js:68` — `AppHeader.vue:6` uses `font-display` which resolves to Poppins. Brand says headings = Nunito. |

### INCONSISTENT

| File | Current | Should Be |
|------|---------|-----------|
| `pages/grupos/index.vue` | `text-2xl font-bold` (DM Sans) | `text-2xl font-bold font-nunito` |
| `pages/finanzas/index.vue` | `text-2xl font-bold` (DM Sans) | `text-2xl font-bold font-nunito` |
| `pages/finanzas/summary.vue` | `text-lg font-semibold` section headers | `text-lg font-bold font-nunito` |
| `pages/finanzas/categories.vue` | `text-2xl font-bold` | `text-2xl font-bold font-nunito` |
| All card titles | `font-semibold` (600) | `font-bold` (700) per brand manual weight range |

### Font Size Scale Comparison

| Element | Grupos | Finanzas | Consistent? |
|---------|--------|----------|-------------|
| Page title | `text-2xl` | `text-2xl` | Yes |
| Section header | `text-lg font-semibold` | `text-lg font-semibold` | Yes |
| Card title | `text-sm font-medium` | `font-medium` / `font-semibold` | Mixed |
| Body text | `text-sm` | `text-sm` | Yes |
| Meta/label | `text-xs` | `text-xs` | Yes |
| Amounts | `font-mono tabular-nums` | `font-bold` (no mono) | **No** |

---

## 4. COMPONENT STYLE DIFFERENCES

### Cards

| Property | Grupos (ExpenseItem) | Finanzas (one-time cards) | Match? |
|----------|---------------------|---------------------------|--------|
| Background | `bg-white dark:bg-gray-800` | `bg-ttc-surface` | No |
| Border | `border-gray-100 dark:border-gray-700` | `border-gray-600` | No |
| Radius | `rounded-xl` | `rounded-xl` | Yes |
| Shadow | `shadow-sm` | `shadow-sm shadow-white/5` | Partial |
| Padding | `p-4` | `p-4` | Yes |

### Buttons (Primary)

| Property | Grupos | Finanzas | Match? |
|----------|--------|----------|--------|
| Color | `bg-blue-600 hover:bg-blue-700` | `bg-primary hover:bg-primary/80` | No |
| Radius | `rounded-lg` | `rounded-lg` | Yes |
| Padding | `px-4 py-2` | `px-5 py-2.5` or `px-6 py-2.5` | No |

### Modals

| Property | Grupos (ExpenseModal) | Finanzas (shared Modal) | Match? |
|----------|----------------------|-------------------------|--------|
| Implementation | Custom inline | Shared `Modal.vue` component | No |
| Background | `bg-white dark:bg-gray-800` | `bg-white dark:bg-gray-800` | Yes |
| Mobile shape | `rounded-t-2xl` | `rounded-t-2xl` | Yes |
| Desktop shape | `rounded-t-2xl` (no change) | `md:rounded-xl` | **No** |

### Form Inputs

| Property | Grupos (CreateGroupModal) | Finanzas (ManagePayment) | Match? |
|----------|--------------------------|--------------------------|--------|
| Background | `bg-gray-50 dark:bg-gray-700` | `bg-gray-700` (dark-only) | No |
| Border | `border-gray-300 dark:border-gray-600` | `border-gray-600` | No |
| Radius | `rounded-lg` (8px) | `rounded-md` (6px) | No |
| Focus ring | `focus:ring-blue-500` | `focus:ring-primary` | Different |

### Loading States

| Section | Pattern |
|---------|---------|
| Grupos | Inline spinner (`animate-spin` icon) |
| Finanzas | `skeleton-shimmer` CSS animation + occasional spinners |

### Empty States

| Section | Pattern |
|---------|---------|
| Grupos (GroupList) | Dashed border box + text + single button |
| Finanzas (one-time) | Large rounded icon circle + title + description + CTA button |

---

## 5. SPACING & LAYOUT

### Page Container

| Property | Grupos | Finanzas |
|----------|--------|----------|
| Max width | **None** (full width) | `max-w-7xl` (1280px) |
| Horizontal padding | `p-4` (varies) | `px-4 sm:px-6` |
| Bottom padding | None specified | `pb-20 md:pb-0` |
| Layout wrapper | `default.vue` (bare `<slot />`) | `finanzas.vue` (structured) |

---

## 6. DARK/LIGHT MODE

### CRITICAL: Theme Mechanism Conflict

`tailwind.config.js:9` sets `darkMode: 'class'` (expects `.dark` class on `<html>`), but `main.css` defines light theme via `[data-theme="light"]` (data attribute).

### Components That ONLY Work in Dark Mode

| File | Evidence |
|------|----------|
| `pages/finanzas/summary.vue` | `bg-gray-800`, `text-white`, `text-gray-400` everywhere |
| `pages/finanzas/weekly-summary.vue` | `bg-gray-800`, `bg-gray-700/50`, `text-white` |
| `pages/finanzas/categories.vue` | `bg-gray-700`, `border-gray-600`, `text-gray-400` |
| `pages/finanzas/index.vue` | `bg-gray-700`, `hover:bg-gray-700/50` |
| `pages/finanzas/one-time.vue` | `bg-gray-800`, `bg-gray-700`, `text-gray-100` |

---

## Implementation Plan (Ordered by Impact)

### Phase 1: Unify Color System (Highest Impact)
1. Update `tailwind.config.js` — Replace primary scale, add success/warning/danger tokens
2. Extend CSS variables in `main.css` — Add --color-success, --color-warning, --color-danger
3. Migrate Finanzas pages to CSS variable tokens
4. Migrate Grupos components to CSS variable tokens
5. Fix shared components (AppHeader, FinanzasBottomNav, ConfirmDialog)

### Phase 1.5: Extend Theme System App-Wide (COMPLETED)

**Context:** Phase 1 migrated components to `ttc-*` tokens, but the theme toggle only existed on the landing page. This phase makes the toggle available throughout the app and hardens the theme mechanism.

**What was done:**
1. **Audited theme composable** (`composables/useTheme.js`) — confirmed it already syncs both `.dark` class and `data-theme` attribute on `<html>`. Persistence via `localStorage('ttc-theme')`, defaults to dark.
2. **Added flash prevention** — inline `<head>` script in `nuxt.config.ts` reads localStorage and applies theme before Vue mounts. Set default `htmlAttrs` to `class: 'dark'` and `data-theme: 'dark'`.
3. **Verified CSS token coverage** — all 18 `ttc-*` tokens confirmed defined in both `:root` (dark) and `[data-theme="light"]`. 100% coverage, no gaps.
4. **Extended toggle UI:**
   - Added `<ThemeToggle />` to `AppHeader.vue` (Grupos desktop nav)
   - Added `<ThemeToggle />` to `FinanzasNav.vue` (Finanzas desktop nav)
   - Bottom navs skipped (no room with 4 tabs + FAB)
   - Fixed remaining `dark:` pairs in `FinanzasNav.vue` scoped styles and `FinanzasBottomNav.vue`
5. **Flagged light-mode breakage** — ~120 remaining hardcoded gray instances across 15 files (see below)

**Files still breaking in light mode (Phase 3 scope):**

| File | Severity | Instances |
|------|----------|-----------|
| `PaymentsManagePayment.vue` | HIGH | ~25 — dark-only form inputs |
| `RecurrentsManagePayment.vue` | HIGH | ~18 — dark-only form inputs |
| `profile.vue` | HIGH | ~40 — cards, forms, labels |
| `join.vue` | HIGH | ~20 — join flow UI |
| `PaymentsDetails.vue` | MEDIUM | ~5 — skeleton, table header |
| `RecurrentsDetails.vue` | MEDIUM | ~5 — table header, labels |
| `PaymentInfoModal.vue` | MEDIUM | ~10 — dark: pairs |
| `PaymentsTemplateList.vue` | LOW | 1 — swipe delete bg |
| `ConfirmDialogue.vue` | LOW | 1 — text-gray-400 |
| `privacy.vue` | LOW | 3 — static page text |
| `report.vue` | LOW | chart colors + print styles |
| `LogoutButton.vue` | LOW | dark: pair |
| `AmountDisplay.vue` | LOW | dark: pair |
| `CategoryIcon.vue` | LOW | dark: pair |
| `SettlementItem.vue` | LOW | disabled state |

### Phase 2: Fix Typography (High Impact)
6. Add `font-nunito` to all page headings
7. Remap `font-display` from Poppins to Nunito
8. Add `font-mono tabular-nums` to Finanzas amounts

### Phase 3: Unify Component Patterns (Medium Impact)
9. Migrate Grupos modals to shared Modal.vue
10. Standardize form inputs
11. Standardize buttons
12. Standardize loading states
13. Standardize empty states

### Phase 4: Layout Consistency (Medium Impact)
14. Add layout wrapper for Grupos
15. Ensure bottom nav padding

### Phase 5: Polish (Low Impact)
16. Standardize shadows
17. Replace rounded-lg/xl with rounded-card/btn tokens
18. Verify theme composable syncs data-theme and .dark class
