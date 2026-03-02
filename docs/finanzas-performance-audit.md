# Performance & Navigation Audit: Grupos vs Finanzas

> **Date:** March 1, 2026
> **Author:** Claude Code (pair session with Andrea)
> **Purpose:** Document root causes of Finanzas loading/navigation glitchiness and track implementation phases.

---

## The Root Cause (TL;DR)

Grupos and Finanzas use fundamentally different data architectures, which is the source of all Finanzas glitchiness:

| Aspect | Grupos | Finanzas |
|---|---|---|
| **Init point** | `app.vue` — centralized, runs once on auth | Each page's `onMounted` — decentralized, runs every visit |
| **Firestore pattern** | `onSnapshot()` real-time listeners | `getDocs()` one-shot queries |
| **Data lifecycle** | Always in memory via persistent listeners | Fetched fresh (or stale-cached) per page |
| **Navigation feel** | Instant — data already loaded | Slow — fetch on every mount, skeleton flash |
| **Cleanup** | `stopListeners()` called on logout/unmount | `clearState()` exists but **never called** |

---

## 1. Data Fetching Patterns

### Side-by-Side Comparison

| Aspect | Grupos `index.vue` | Grupos `report.vue` | Finanzas `index.vue` | Finanzas `summary.vue` | Finanzas `one-time.vue` | Finanzas `weekly-summary.vue` | Finanzas `categories.vue` |
|---|---|---|---|---|---|---|---|
| **Fetch location** | `app.vue` (parent) | None (reads store) | `onMounted` | `onMounted` | `onMounted` | `onMounted` | `onMounted` |
| **Re-fetch trigger** | Never (real-time) | Never | Month change | Never | Month change | Never | Never |
| **Cache strategy** | Real-time listeners keep store current | Reads pre-loaded store | Store + `isLoaded` flag | Store cache | Store + `lastFilters` | Store cache | Store + `isLoaded` flag |
| **Firestore pattern** | `onSnapshot` (persistent) | Inherited | `getDocs` (one-shot) | `getDocs` (one-shot) | `getDocs` (one-shot) | `getDocs` (one-shot) | `getDocs` (one-shot) |
| **Parallelization** | Sequential in `app.vue` (could improve) | N/A | `Promise.all` (good) | Partial (recurrent calls sequential) | Sequential (bad) | Partial (`fetchCategories` before `Promise.all`) | Single fetch |

### Key Issue: Every Finanzas page fetches on mount

When navigating between Finanzas tabs, each page:
1. Mounts → shows skeleton shimmer
2. Calls store `fetch*()` methods
3. Awaits Firestore response (200-800ms)
4. Renders data

This creates **skeleton flash on every tab switch**, even for data loaded 2 seconds ago on another tab. Grupos never has this problem because data is pre-loaded via persistent listeners in `app.vue`.

---

## 2. Store Architecture

### Grupos Stores — Well-managed lifecycle

| Store | Listener Type | Init Point | Cleanup | Cache |
|---|---|---|---|---|
| `useGroupStore` | `onSnapshot` (1 group doc) | `app.vue` auth watch | `clearGroups()` on logout | localStorage + Pinia |
| `useExpenseStore` | `onSnapshot` (collection) | `app.vue` `initializeData()` | `stopListeners()` on logout/unmount | Pinia (real-time) |
| `usePaymentStore` | `onSnapshot` (collection) | `app.vue` `initializeData()` | `stopListeners()` on logout/unmount | Pinia (real-time) |
| `useUserStore` | None (`getDocs`) | `app.vue` `initializeData()` | Implicit (data replaced) | Pinia |

### Finanzas Stores — Missing lifecycle management (pre-fix)

| Store | Listener Type | Init Point | Cleanup | Cache | Issue |
|---|---|---|---|---|---|
| `useCategoryStore` | None (`getDocs`) | Per-page `onMounted` | **`clearState()` NEVER called** | `isLoaded` flag | Stale after logout |
| `usePaymentStore` | None (`getDocs`) | Per-page `onMounted` | **`clearState()` NEVER called** | `isLoaded` + `lastFilters` | Stale data with different filters |
| `useRecurrentStore` | None (`getDocs`) | Per-page `onMounted` | **`clearState()` NEVER called** | `isLoaded` + `lastFetchedMonthsBack` | Flawed cache logic |
| `useTemplateStore` | None (`getDocs`) | Per-page `onMounted` | **`clearState()` NEVER called** | **None — refetches every time** | Wasteful |
| `useWeeklySummaryStore` | None (`getDocs`) | Per-page `onMounted` | **`clearState()` NEVER called** | `isLoaded` flag | Stale summary data |

### Critical Issue: `useRecurrentStore` cache logic

```ts
// The >= check is superset caching — 6 months cached serves a 3-month request
if (!forceRefresh && this.isLoaded && this.lastFetchedMonthsBack >= monthsBack) {
  // This is actually correct behavior — larger cached range serves smaller requests
}
```

However, `fetchRecurrentPayments()` only checked `this.recurrentPayments.length > 0` without checking `isLoaded`, meaning a failed partial load could prevent re-fetching.

### Critical Issue: `clearState()` never called on logout

All 5 Finanzas stores have a `clearState()` method that was **never invoked**. When user A logs out and user B logs in, user B sees **user A's cached data** until the `isLoaded` guard is bypassed.

---

## 3. Loading State Management

| Page | Loading Type | Flash Risk | Rating |
|---|---|---|---|
| Grupos `index.vue` | Full-page spinner | None — blocks until ALL stores ready | Good |
| Grupos `report.vue` | Full-page spinner | None — data already loaded | Good |
| Finanzas `index.vue` | Skeleton shimmer | **Flashes on every tab switch** | Problem |
| Finanzas `summary.vue` | Skeleton shimmer | **Flashes on every tab switch** | Problem |
| Finanzas `one-time.vue` | Skeleton shimmer | **Flashes on every tab switch** | Problem |
| Finanzas `weekly-summary.vue` | Skeleton shimmer | **Flashes on every tab switch** | Problem |
| Finanzas `categories.vue` | Skeleton shimmer | Minimal (single fast fetch) | OK |

---

## 4. Navigation & Route Transitions

### Layout Differences

| Section | Layout | Components | keepAlive (pre-fix) |
|---|---|---|---|
| Grupos | `default.vue` | Just `<slot />` | None |
| Finanzas | `finanzas.vue` | `<FinanzasNav />` + `<slot />` + `<FinanzasBottomNav />` | None |

### Critical Issue: No `keepAlive` on Finanzas pages

When switching between Finanzas tabs, each page is **fully destroyed and recreated**. This triggers:
1. Component unmount (all local state lost)
2. Component mount (new instance created)
3. `onMounted` fires → fetches data again
4. Skeleton flash → data render

### Navigation State Differences

| Aspect | Grupos | Finanzas |
|---|---|---|
| **Tab management** | `useNavigationState` composable with URL sync (`?tab=grupo`) | Separate routes (`/finanzas/`, `/finanzas/summary`, etc.) |
| **Tab switch cost** | Cheap — just toggles UI, no route change | Expensive — full route change, component destroy/create |
| **Modal state** | In composable, survives tab switches | In composable, but lost on route change |

---

## 5. Firestore Listener Lifecycle

### Grupos: Clean listener management

```
Auth → app.vue initializeData()
  → expenseStore.initializeListeners(groupId)  [onSnapshot — PERSISTENT]
  → paymentStore.initializeListeners(groupId)   [onSnapshot — PERSISTENT]
  → userStore.fetchUsers(members)               [getDocs — ONE-SHOT]

Group switch → app.vue watch
  → old listeners unsubscribed
  → new listeners created

Logout → app.vue watch
  → expenseStore.stopListeners()
  → paymentStore.stopListeners()
  → groupStore.clearGroups()
```

### Finanzas: No listeners at all (pre-fix)

```
Page mount → onMounted
  → store.fetchSomething()  [getDocs — ONE-SHOT, every time]

Page unmount → nothing happens
  → store data persists in Pinia (good)
  → but isLoaded flags persist too (can cause stale data)

Logout → NOTHING happens
  → clearState() NEVER called
  → old user's data persists in store
```

---

## 6. Middleware & Auth Guards

| Middleware | Runs on | Does it fetch? | Issue |
|---|---|---|---|
| `auth.ts` | Every route change | No (reads `useAuth()` state) | Runs redundantly with `app.vue` watch |

No middleware triggers data fetching — this is not a source of the Finanzas slowness.

---

## Implementation Plan & Status

### Phase 1: Centralized Init + KeepAlive + Cleanup — DONE

> **Status: IMPLEMENTED (March 2, 2026)**
> **Commit: pending**

| Change | File(s) | Status |
|---|---|---|
| 1.1 Harden `fetchRecurrentPayments()` cache guard — add `isLoaded` check | `stores/finanzas/useRecurrentStore.ts` | Done |
| 1.2 Centralize Finanzas data initialization in `app.vue` | `app.vue` | Done |
| 1.3 Call `clearState()` on all 5 Finanzas stores on logout | `app.vue` | Done |
| 1.4 Add `keepalive: true` to all 5 Finanzas pages | `pages/finanzas/*.vue` (5 files) | Done |
| 1.5 Fast-path `onMounted` on `index.vue` — skip fetch if data pre-loaded | `pages/finanzas/index.vue` | Done |
| 1.6 Fast-path `onMounted` on `categories.vue` — skip fetch if loaded | `pages/finanzas/categories.vue` | Done |
| 1.7 Remove redundant `categoryStore.fetchCategories()` from pages | `summary.vue`, `one-time.vue`, `weekly-summary.vue` | Done |
| 1.8 Fix keyboard listener for KeepAlive (`onActivated`/`onDeactivated`) | `pages/finanzas/one-time.vue` | Done |

**What Phase 1 achieves:**
- No more skeleton flash when switching Finanzas tabs (KeepAlive preserves components)
- Data is pre-loaded on login, so first visit to any Finanzas page is instant
- Logout properly clears all Finanzas state (no user data leaks)
- Keyboard shortcut ('N' for new payment) properly managed across KeepAlive lifecycle

**What Phase 1 does NOT pre-fetch (by design):**
- `finPaymentStore` — different pages need different date range + paymentType filters. Pre-fetching one filter set would be overwritten by the next page. KeepAlive handles repeat visits.
- `finTemplateStore` — only used in payment creation modals, not page rendering.

---

### Phase 2: Eliminate Unnecessary Re-fetches — NOT STARTED

| Change | File(s) | Status |
|---|---|---|
| 2.1 Fix `usePaymentStore` filter staleness — reset `lastFilters` properly | `stores/finanzas/usePaymentStore.ts` | Not started |
| 2.2 Add `isLoaded` guard to `useTemplateStore` | `stores/finanzas/useTemplateStore.ts` | Not started |
| 2.3 Parallelize sequential fetches in summary.vue, one-time.vue | `pages/finanzas/summary.vue`, `one-time.vue` | Partially done (summary already uses Promise.all; one-time still sequential) |

**Expected impact:** ~200-400ms faster on pages that still fetch (month navigation, filter changes).

---

### Phase 3: Polish — NOT STARTED

| Change | File(s) | Status |
|---|---|---|
| 3.1 Optimize expensive computed properties (e.g., `getMonthlyTotals`) | `stores/finanzas/useRecurrentStore.ts` | Not started |
| 3.2 Add category ID-indexed Map for O(1) lookups | `stores/finanzas/useCategoryStore.ts` | Not started |
| 3.3 Parallelize Grupos store init in `app.vue` | `app.vue` | Not started |
| 3.4 Consider Chart.js `onActivated` resize handler for summary.vue | `pages/finanzas/summary.vue` | Not started (monitor for issues first) |

**Expected impact:** Micro-optimizations — smoother feel, fewer unnecessary recomputations. Lower priority.

---

## Risks & Monitoring

| Risk | Mitigation | Status |
|---|---|---|
| Chart.js canvases in summary.vue after KeepAlive reactivation | Charts stay in DOM — KeepAlive preserves entire DOM tree. If resize issues appear, add `onActivated` resize call. | Monitor |
| Stale data in cached pages | Watchers on Pinia store refs (e.g., `watch(getProcessedRecurrents)`) already handle this — Pinia is a shared singleton. | Covered |
| Cross-layout navigation (finanzas → grupos → finanzas) loses KeepAlive cache | Expected — NuxtPage's KeepAlive is scoped to layout lifecycle. Pre-fetched Pinia store data survives, so re-mount is fast. | By design |
| `onActivated`/`onMounted` double-firing keyboard listener on first mount | DOM spec: `addEventListener` with same function ref is idempotent — no duplicate listeners. | Covered |
