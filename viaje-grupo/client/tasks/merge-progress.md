# Merge Progress: viaje-grupo + pay-trackr → Single /client Frontend

## Phase 1: Restructure viaje-grupo pages & components ✅
- [x] Move `pages/index.vue` → `pages/grupos/index.vue`
- [x] Move `pages/report.vue` → `pages/grupos/report.vue`
- [x] Move balance, expense, group, settlement, navigation components → `components/grupos/`
- [x] Move stores → `stores/grupos/`
- [x] Create new `pages/index.vue` (mode-based redirect)
- [x] Update BottomNav route paths (`/` → `/grupos`)
- [x] Update useNavigationState route paths
- [x] Update AppHeader report links
- [x] Update login.vue, setup.vue, join.vue redirects (`/` → `/grupos`)
- [x] Update middleware/auth.ts for new routes

## Phase 2: Merge deps & config ✅
- [x] Add `dayjs-nuxt`, `vue3-popper` to package.json
- [x] Add `dayjs-nuxt` module to nuxt.config.ts
- [x] Add finanzas route rules (`ssr: false`)
- [x] Configure dayjs Spanish locale

## Phase 3: Firebase unification ✅
- [x] Create `utils/finanzas/firebase.ts` (uses `getApp()` to reuse existing instance)

## Phase 4: Copy pay-trackr code ✅
- [x] Copy ODM layer (`utils/odm/`) with updated firebase imports
- [x] Copy types (`types/finanzas/category.ts`, `types/finanzas/index.ts`)
- [x] Copy composable (`composables/finanzas/paymentUtils.ts`)
- [x] Create finanzas toast composable (`composables/finanzas/useToast.ts`)
- [x] Create finanzas stores with unique IDs:
  - `stores/finanzas/usePaymentStore.ts` (id: `finanzas-payment`)
  - `stores/finanzas/useRecurrentStore.ts` (id: `finanzas-recurrent`)
  - `stores/finanzas/useCategoryStore.ts` (id: `finanzas-category`)
  - `stores/finanzas/useTemplateStore.ts` (id: `finanzas-template`)
  - `stores/finanzas/useWeeklySummaryStore.ts` (id: `finanzas-weekly-summary`)
- [x] Copy components (`components/finanzas/`)
- [x] Copy pages (`pages/finanzas/`)
- [x] Update all imports in copied files (stores, firebase, interfaces, utils, routes)
- [x] Create `composables/useAppMode.ts`
- [x] Create `layouts/finanzas.vue`
- [x] Create `components/finanzas/FinanzasNav.vue`

## Phase 5: Mode toggle in AppHeader ✅
- [x] Add "Finanzas" toggle button in AppHeader
- [x] Persisted via `useAppMode()` composable

## Phase 6: Update app.vue for dual-mode ✅
- [x] Wrap NuxtPage with NuxtLayout for layout support
- [x] Keep grupos data initialization logic
- [x] Auth watchers handle both mode routes

## Build Fix
- [x] Add `DEFAULT` key to `primary` color in `tailwind.config.ts` (fixes `@apply text-primary` in PaymentsManagePayment.vue)
- [x] Build passes successfully (`npx nuxt build` ✅)

## Known Issues / Future Work
- [ ] Pay-trackr components use pay-trackr's dark color scheme (bg-base, etc.) — visual inconsistencies expected
- [ ] FCM/push notifications skipped for now
- [ ] WhatsApp integration skipped
- [ ] Style unification pass needed
