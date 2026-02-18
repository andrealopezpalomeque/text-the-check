# Frontend Audit Report - PayTrackr Web

**Date**: 2026-02-13
**Reviewer**: Frontend Reviewer (Claude)
**Scope**: `/web` - Nuxt 3 (Vue 3) PWA frontend

---

## 1. Page/Component Patterns & Composition API Consistency

### 1.1 Composition API Usage

All pages and components consistently use Vue 3 Composition API via `<script setup>`. No Options API legacy code was found. This is a clean, modern codebase.

However, there are inconsistencies in TypeScript adoption:

- **`web/pages/settings/notifications.vue:150`** uses `<script setup lang="ts">` (TypeScript)
- **`web/components/NotificationManager.vue:37`** uses `<script setup lang="ts">` (TypeScript)
- All other pages and components use plain `<script setup>` (JavaScript)

**Finding**: Mixed TypeScript/JavaScript in `<script setup>` blocks across components.
**Tag**: `LOW`
**Suggested Fix**: Decide on a consistent approach. Either migrate all to `lang="ts"` or keep all as JS. Current CLAUDE.md says "TypeScript throughout" but most Vue files are JS-only.

### 1.2 Import Patterns

All icon imports use the `unplugin-icons` pattern consistently (`~icons/mdi/check`). Utility imports are consistent (`~/utils`, `~/utils/firebase`).

### 1.3 Pinia Store Usage Pattern

The stores use **Options API** style Pinia (`defineStore` with `state/getters/actions` object) rather than the **Setup Store** pattern (composition-style). This is technically fine and supported, but contrasts with the claim of "Composition API patterns" in CLAUDE.md.

**Finding**: Pinia stores (`web/stores/recurrent.ts`, `web/stores/payment.ts`, `web/stores/category.ts`) use Options API store syntax.
**Tag**: `LOW`
**Suggested Fix**: Not a bug. Both patterns are fully supported. Just note the inconsistency with the "Composition API throughout" philosophy.

---

## 2. CRUD Operations Review

### 2.1 Loading States

**All major pages implement loading skeletons** - this is well done:
- `web/pages/fijos.vue:9-28` - Skeleton for header, table, and mobile cards
- `web/pages/one-time.vue:35-49` - Skeleton for header and payment cards
- `web/pages/summary.vue:20-49` - Skeleton for charts and stats
- `web/pages/weekly-summary.vue:10-27` - Skeleton for weekly summary cards
- `web/pages/settings/categories.vue:131-133` - Skeleton for categories list

**Finding**: Loading states are comprehensive and well-implemented across all pages.
**Tag**: `LOW` (positive finding)

### 2.2 Error Handling

**Finding**: Error handling is generally good with toast notifications for failures. All CRUD operations in stores return boolean success values and set `store.error`. Pages display toast errors on failure.

However, there is an inconsistency:

- **`web/pages/settings/notifications.vue:160,174,186`** imports `toast` directly from `vue3-toastify` instead of using the `useToast` composable.
- **`web/components/NotificationManager.vue:40,79,81`** also imports `toast` directly.

**Finding**: Two files bypass the `useToast` composable and import `toast` from `vue3-toastify` directly.
**Tag**: `MEDIUM`
**File**: `web/pages/settings/notifications.vue:160`, `web/components/NotificationManager.vue:40`
**Suggested Fix**: Use `useToast()` consistently everywhere. Direct `toast` imports skip position/autoClose defaults set in `useToast`.

### 2.3 Success Feedback

All CRUD operations provide toast success/error messages. The pattern is consistent:
- Create: "Pago creado correctamente" / "Categoria creada correctamente"
- Update: "Pago actualizado correctamente"
- Delete: "Pago eliminado correctamente"
- Toggle: "Pago marcado como pagado/no pagado"

**Finding**: Success feedback is consistent and well-implemented.
**Tag**: `LOW` (positive finding)

### 2.4 Optimistic Updates vs Refetch

The codebase uses a **hybrid approach**:
- Toggle payment status: Optimistic local state update + server call (good pattern)
- Create/delete: Server call first, then update local state (safe pattern)
- Search/sort: Client-side on already-fetched data (good for performance)

**Finding**: The optimistic update pattern for toggles is well-implemented with loading spinners per-item (`togglingPayment` ref tracks which item is being toggled).
**Tag**: `LOW` (positive finding)

### 2.5 `var` Usage in Summary Page

**Finding**: `web/pages/summary.vue:277-278` uses `var` instead of `let`/`const` for chart instances.
**Tag**: `MEDIUM`
**File**: `web/pages/summary.vue:277-278`
```javascript
var monthlyTrendsChart = null;
var categoryPieChart = null;
```
**Suggested Fix**: Change to `let monthlyTrendsChart = null; let categoryPieChart = null;`

---

## 3. PWA Implementation Review

### 3.1 Manifest Configuration

**File**: `web/nuxt.config.ts:63-92`

The manifest is properly configured with:
- `name`, `short_name`, `description` set
- `theme_color` and `background_color` set to `#27292D`
- `display: "standalone"` and `orientation: "portrait"` set
- Icons include 192x192, 512x512, and a maskable 512x512 icon

**Finding**: Manifest description is in English ("Track and manage your recurring and one-time payments") while the entire UI is in Spanish.
**Tag**: `MEDIUM`
**File**: `web/nuxt.config.ts:68`
**Suggested Fix**: Change to Spanish: `"Seguí y gestioná tus pagos recurrentes y únicos"`

### 3.2 Service Worker & Cache Strategies

**File**: `web/nuxt.config.ts:93-126`

Configuration:
- `registerType: "autoUpdate"` - auto-updates SW in background
- `navigateFallback: null` - correct for hybrid SSR/SPA app
- `globPatterns` covers JS, CSS, PNG, SVG, ICO, fonts
- Runtime caching for Google Fonts with `CacheFirst` strategy (365 days)
- `navigateFallbackDenylist` excludes `firebase-messaging-sw.js`

**Finding**: No runtime caching strategy for Firestore API calls. The app will not work offline for reading cached data.
**Tag**: `HIGH`
**File**: `web/nuxt.config.ts:93-126`
**Suggested Fix**: CLAUDE.md claims "Offline Access: Core functionality works without internet" but there is no Firestore offline persistence enabled and no SW caching for API responses. Either add Firestore offline persistence (`enablePersistence`) or update the marketing claims. For a personal finance app, Firestore's built-in offline persistence would be the simplest solution.

### 3.3 Update Prompts

- `periodicSyncForUpdates: 20` checks for SW updates every 20 minutes
- `installPrompt: true` enables install prompt

**Finding**: No visible "New version available, click to update" UI component. The `autoUpdate` type silently updates, which could cause issues if users have the app open during a deployment.
**Tag**: `LOW`
**Suggested Fix**: Consider adding a "New version available" toast/banner using `@vite-pwa/nuxt`'s `useRegisterSW` composable for a better UX. With `autoUpdate` type, this is optional but recommended.

---

## 4. Mobile Responsiveness

### 4.1 General Responsive Design

The app follows a **mobile-first** approach with responsive breakpoints using Tailwind's `md:` and `lg:` prefixes. Key patterns:

- **`web/pages/fijos.vue`**: Table view (`hidden md:block`) for desktop, card view (`md:hidden`) for mobile. 6 months shown on desktop, 3 on mobile via `monthsToShow` computed.
- **`web/pages/one-time.vue`**: Grid layout with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **`web/pages/summary.vue`**: Grid layout with `grid-cols-1 lg:grid-cols-2`
- **`web/pages/index.vue`**: Full responsive landing page with `md:flex-row` layouts

**Finding**: Mobile responsiveness is well-implemented across all major pages.
**Tag**: `LOW` (positive finding)

### 4.2 Viewport Meta

**File**: `web/nuxt.config.ts:148-149`

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**Finding**: `maximum-scale=1.0, user-scalable=no` prevents pinch-to-zoom. This is an accessibility concern (WCAG 1.4.4 Resize Text). Some users need to zoom in for readability.
**Tag**: `HIGH`
**File**: `web/nuxt.config.ts:149`
**Suggested Fix**: Change to `width=device-width, initial-scale=1.0` without zoom restrictions. If the concern is form input zoom on iOS, use `font-size: 16px` on inputs instead.

### 4.3 Small Screen Navigation

**File**: `web/layouts/default.vue:8-24`

The main navigation uses `overflow-x-auto` for horizontal scrolling on small screens. There's also a `@media (max-width: 380px)` fallback that wraps tabs.

**Finding**: Navigation tabs at `max-width: 380px` switch to `flex-wrap justify-center` which could look cluttered with 5 tabs. The "Configuracion" tab also appears in both the dropdown menu (TheHeader) and the nav tabs (default layout), creating duplicate navigation paths.
**Tag**: `LOW`
**Suggested Fix**: Consider hiding "Configuracion" from the main nav on mobile since it's already in the user dropdown menu.

---

## 5. Auth Guards

### 5.1 Middleware Configuration

**File**: `web/middleware/auth.ts`

The auth middleware:
1. Skips `/welcome` path and server-side execution
2. Allows authenticated users to access any page
3. Redirects `/contact-us` to `/welcome` with a redirect query
4. Redirects all other unauthenticated users to `/`

### 5.2 Page-Level Middleware

Pages with `definePageMeta({ middleware: ["auth"] })`:
- `web/pages/fijos.vue:311`
- `web/pages/one-time.vue:266`
- `web/pages/summary.vue:234`
- `web/pages/weekly-summary.vue:241`
- `web/pages/settings/categories.vue:187`
- `web/pages/settings/notifications.vue:163`
- `web/pages/settings/whatsapp.vue:172`
- `web/pages/contact-us.vue:31`

Pages WITHOUT auth middleware (correctly public):
- `web/pages/index.vue` (landing page)
- `web/pages/welcome.vue` (login page, uses `layout: false`)
- `web/pages/faq.vue` (public FAQ)
- `web/pages/privacy-policy.vue` (public legal)
- `web/pages/term-of-service.vue` (public legal)
- `web/pages/404.vue` (error page)

**Finding**: All protected routes have auth middleware. All public routes are correctly unprotected.
**Tag**: `LOW` (positive finding)

### 5.3 Auth Guard for Route Rules

**File**: `web/nuxt.config.ts:27-45`

The `routeRules` disable SSR (`ssr: false`) for all auth-protected pages and enable prerender for public pages. This is correct - it prevents server-side rendering from failing when Firebase auth context is unavailable.

**Finding**: Route rule for `/edit/**` and `/new-payment` and `/history` at `nuxt.config.ts:42-44` reference routes that do not exist as pages. These are dead route rules.
**Tag**: `MEDIUM`
**File**: `web/nuxt.config.ts:42-44`
**Suggested Fix**: Remove unused route rules for `/edit/**`, `/history`, and `/new-payment` to avoid confusion.

---

## 6. Component Coupling & Migration Concerns

### 6.1 Tightly Coupled to PayTrackr Logic

The following components are deeply coupled to PayTrackr-specific domain logic and would be difficult to migrate to a different app:

- **`web/components/recurrents/*`** - All three components are specific to the recurring payment domain model (months grid, payment instances, due date logic)
- **`web/components/payments/*`** - Coupled to payment2 collection schema, WhatsApp review flow, template system
- **`web/components/NotificationManager.vue`** - Coupled to FCM token registration and PayTrackr notification store

### 6.2 Reusable Components (Migration-Friendly)

These components are generic and could be reused in any project:

- **`web/components/Modal.vue`** - Generic modal with Teleport, slots, keyboard handling
- **`web/components/ConfirmDialogue.vue`** - Generic confirmation dialog
- **`web/components/Filters.vue`** - Generic search + sort filter bar (partially coupled via icon/filter names)
- **`web/components/Loader.vue`** - Generic loader
- **`web/components/Tooltip.vue`** - Generic tooltip
- **`web/components/TheHeader.vue`** - Layout header (partially coupled to Firebase auth)
- **`web/components/TheFooter.vue`** - Layout footer

### 6.3 Duplicated Category Helper Functions

**Finding**: The functions `getDisplayCategoryColor()` and `getDisplayCategoryName()` are duplicated across 6+ files:
- `web/pages/fijos.vue:324-332`
- `web/pages/one-time.vue:278-286`
- `web/pages/summary.vue:250-268`
- `web/pages/weekly-summary.vue:269-272`
- `web/components/recurrents/RecurrentsDetails.vue:174-182`
- `web/components/payments/PaymentsDetails.vue:223-231`

**Tag**: `HIGH`
**Suggested Fix**: Extract these into a composable (e.g., `composables/useCategory.ts`) that wraps the `categoryStore` getters. This would eliminate ~60 lines of duplicated code and ensure consistency.

### 6.4 Duplicated Amount Conversion Functions

**Finding**: The amount conversion functions (`normalizeAmount`, `parseAmount`, `formatAmountForInput`) are duplicated between:
- `web/components/recurrents/RecurrentsManagePayment.vue:259-281`
- `web/components/payments/PaymentsManagePayment.vue:493-515`

**Tag**: `MEDIUM`
**Suggested Fix**: Extract into `composables/paymentUtils.ts` (which already exists but doesn't contain these). These are critical for the Argentine locale decimal handling.

---

## 7. Additional Findings

### 7.1 Contact Us Page - Direct Firestore Write

**Finding**: `web/pages/contact-us.vue:71` writes directly to Firestore (`addDoc(collection(db, "contactUs"), ...)`) without going through a Pinia store or schema layer. This bypasses the ODM pattern used everywhere else.
**Tag**: `MEDIUM`
**File**: `web/pages/contact-us.vue:46-83`
**Suggested Fix**: Create a `contactSchema.ts` or at minimum use the base schema pattern for consistency. The current code also stores the raw `contactUs` ref value which could include extra Vue reactivity metadata.

### 7.2 Contact Us Page - Stale Styling

**Finding**: `web/pages/contact-us.vue` uses raw pixel values (`gap-[0.571rem]`, `px-[1.429rem]`) instead of Tailwind utility classes, inconsistent with the rest of the codebase.
**Tag**: `LOW`
**File**: `web/pages/contact-us.vue:2-3`
**Suggested Fix**: Refactor to use standard Tailwind spacing (e.g., `gap-2`, `px-6`) for consistency.

### 7.3 TheHeader User Avatar - Missing Fallback

**Finding**: `web/components/TheHeader.vue:11` renders `user.photoURL` directly. If a Google account doesn't have a profile photo, this will be `null` and show a broken image.
**Tag**: `MEDIUM`
**File**: `web/components/TheHeader.vue:11`
**Suggested Fix**: Add a fallback avatar (initials circle or default avatar SVG) for when `photoURL` is null.

### 7.4 TheHeader - onClickOutside Applied Before Element Exists

**Finding**: `web/components/TheHeader.vue:61` calls `onClickOutside(dropdownMenu, ...)` at the top level of `<script setup>`, but `dropdownMenu` is only rendered when `showMenu` is true (via `v-if`). When `showMenu` is false, `dropdownMenu.value` is `null`, so `onClickOutside` may not bind correctly or may fire immediately.
**Tag**: `MEDIUM`
**File**: `web/components/TheHeader.vue:61`
**Suggested Fix**: Either use `v-show` instead of `v-if` for the dropdown, or conditionally set up `onClickOutside` inside a `watch` on `showMenu`.

### 7.5 Unused Imports

**Finding**: `web/pages/one-time.vue:251` imports `MdiCalendarMonth` but it is never used in the template (the summary section uses `MdiCalculator` instead).
**Tag**: `LOW`
**File**: `web/pages/one-time.vue:251`
**Suggested Fix**: Remove unused import.

### 7.6 `isPaid` Default in PaymentsManagePayment

**Finding**: In `web/components/payments/PaymentsManagePayment.vue:604`, when editing a payment, `isPaid` is set as `payment.isPaid || true`. The `|| true` means isPaid will ALWAYS be true when editing, even if the payment is unpaid. This is a bug.
**Tag**: `CRITICAL`
**File**: `web/components/payments/PaymentsManagePayment.vue:604`
```javascript
isPaid: payment.isPaid || true,  // BUG: always evaluates to true
```
**Suggested Fix**: Change to `isPaid: payment.isPaid ?? false` or simply `isPaid: payment.isPaid` (which defaults to `undefined`/falsy if not set). The `|| true` operator makes it impossible to edit an unpaid payment's status via the form.

### 7.7 Faq Page - v-html XSS Concern

**Finding**: `web/pages/faq.vue:19` uses `v-html` to render FAQ answers. The content is hardcoded in the component (not from user input or database), so there is no actual XSS risk. However, if FAQ content ever comes from a CMS or database, this would be a vulnerability.
**Tag**: `LOW`
**File**: `web/pages/faq.vue:19`
**Suggested Fix**: No action needed currently since content is hardcoded. Add a comment noting this is safe only because content is static.

### 7.8 No Global Error Boundary

**Finding**: There is no global error boundary or error page handler for unexpected runtime errors. Nuxt 3 supports `error.vue` for this purpose.
**Tag**: `MEDIUM`
**Suggested Fix**: Create a `web/error.vue` component that catches unhandled errors and shows a user-friendly error screen with a "Volver al inicio" button.

### 7.9 `body.modal-open` vs `body.modal-opened` CSS Class Mismatch

**Finding**: `web/assets/css/main.css:90` defines `:global(body.modal-open)` but `web/components/Modal.vue:55,66` adds/removes class `modal-opened`. These class names don't match, so the body overflow:hidden rule for modals is never applied.
**Tag**: `HIGH`
**File**: `web/assets/css/main.css:90` and `web/components/Modal.vue:55,66`
**Suggested Fix**: Either change the CSS to `body.modal-opened` or change the JS to `body.classList.add('modal-open')`. This means the page body can scroll behind open modals, which is a UX issue.

---

## Summary Table

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 1 | `isPaid: payment.isPaid \|\| true` bug always sets edited payments as paid |
| HIGH | 4 | No offline persistence despite PWA claims; pinch-to-zoom disabled; duplicated category helpers across 6 files; modal body scroll not prevented |
| MEDIUM | 7 | Inconsistent toast imports; `var` usage; English PWA manifest; dead route rules; duplicated amount functions; no avatar fallback; onClickOutside timing; no global error boundary |
| LOW | 9 | Mixed TS/JS; good loading states; good responsive design; good auth guards; unused imports; stale styling on contact page; Pinia Options API style |

### Top 5 Priority Fixes

1. **CRITICAL**: Fix `isPaid || true` bug in `PaymentsManagePayment.vue:604` - payments can never be edited as unpaid
2. **HIGH**: Fix modal body class mismatch (`modal-open` vs `modal-opened`) so page doesn't scroll behind modals
3. **HIGH**: Extract duplicated category helpers into a shared composable
4. **HIGH**: Address viewport zoom restriction for accessibility
5. **HIGH**: Enable Firestore offline persistence or clarify offline capability limitations
