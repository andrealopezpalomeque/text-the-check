# Frontend Audit

**Reviewer**: Frontend Reviewer
**Date**: 2026-02-13
**Scope**: Pages, components, expense CRUD, auth middleware, Tailwind config, PDF/Excel export, mobile responsiveness, large components

---

## 🔴 CRITICAL

### FE-01: No Authorization Check on Expense Delete/Edit — Any User Can Modify Any Expense
- **Files**: `client/components/expense/ExpenseItem.vue:26-39`, `client/pages/index.vue:341-351`
- **Description**: The edit and delete buttons on every expense are visible to ALL users, not just the expense creator. There is no `v-if="expense.userId === currentUserId"` guard. Any authenticated user can edit or delete any other user's expenses. The `handleDeleteExpense` and `handleEditExpense` functions do not check ownership either.
- **Impact**: Any group member can delete or modify any expense, which could lead to data loss or disputes.
- **Fix**: Add `v-if="expense.userId === currentUserId"` (or similar ownership check) to the edit/delete buttons in `ExpenseItem.vue`. Also validate ownership server-side via Firestore security rules.

### FE-02: No Firestore Security Rules Enforcement on Client — Direct Firestore Writes
- **Files**: `client/stores/useExpenseStore.ts:172-213`, `client/stores/usePaymentStore.ts:143-176`, `client/stores/useUserStore.ts:378-398`
- **Description**: All Firestore mutations (addExpense, deleteExpense, updateExpense, addPayment, updateUserPaymentInfo) are done directly from the client via the Firebase JS SDK. Without proper Firestore security rules, any authenticated user could write arbitrary data to any collection.
- **Impact**: Data integrity depends entirely on Firestore security rules. If rules are misconfigured, any user can modify any document.
- **Fix**: This is a server-side concern, but the client should at minimum verify ownership before attempting mutations. Cross-reference with security audit for Firestore rules.

---

## 🟠 HIGH

### FE-03: Report Page Not in Route Rules — Missing Prerender Configuration
- **File**: `client/nuxt.config.ts:73-77`
- **Description**: The `/report` page is not included in `routeRules`. Pages `/`, `/login`, and `/profile` all have `prerender: false`, but `/report` is missing. This could cause issues with static generation / SPA fallback behavior.
- **Fix**: Add `'/report': { prerender: false }` to the `routeRules` object.

### FE-04: Hardcoded Exchange Rates in Expense Modal
- **File**: `client/components/expense/ExpenseModal.vue:207-211`
- **Description**: Exchange rates are hardcoded as `USD: 1300, EUR: 1400, BRL: 260`. These will become stale quickly. Users see "Aprox." preview text but the actual amount stored is calculated with these rates, meaning the ARS amount in Firestore is based on outdated rates.
- **Impact**: Financial accuracy is compromised for any non-ARS expense.
- **Fix**: Either fetch live exchange rates from an API, or store the original amount + currency and do conversions at display time (the `originalAmount`/`originalCurrency` fields already exist for this purpose).

### FE-05: `isDataReady` Flickers Back to `false` on Any Store Loading State Change
- **File**: `client/pages/index.vue:160-176`
- **Description**: The `watchEffect` sets `isDataReady = false` whenever any dependent store's loading state changes. When a user adds an expense or payment (which briefly sets loading=true), the entire dashboard will flash the loading spinner.
- **Impact**: Poor UX with flickering loading states during normal use.
- **Fix**: Only set `isDataReady` to `false` on group changes, not on every store state transition.

### FE-06: Payment Recording Has No Authorization Guard
- **File**: `client/components/settlement/SettlementItem.vue:416-458`
- **Description**: The `confirmPayment` function allows any authenticated user to record a payment between ANY two users. There's no check that the current user is the debtor (fromUserId). A user could fraudulently record that someone else paid their debt.
- **Impact**: Financial records could be manipulated.
- **Fix**: Add a check that `firestoreUser.value.id === props.settlement.fromUserId` or that the user is an admin before allowing payment recording.

---

## 🟡 MEDIUM

### FE-07: Duplicated Settlement Calculation — `settlements` and `directSettlements` Are Identical
- **File**: `client/pages/index.vue:189-204`
- **Description**: `settlements` (line 189) and `directSettlements` (line 199) compute the exact same value. Both also duplicate the `void paymentStore.payments.length` reactive dependency hack. This is wasteful and confusing.
- **Fix**: Remove one and use a single computed property.

### FE-08: `void paymentStore.payments.length` Reactive Dependency Hack
- **Files**: `client/pages/index.vue:185-186,191-192,201-202,208-209,257-258`, `client/pages/report.vue:601-603`
- **Description**: Multiple computed properties use `void paymentStore.payments.length` and `void expenseStore.expenses.length` as a hack to force reactive dependency tracking. If someone removes a `void` line, the computed property silently breaks.
- **Fix**: Convert `calculateBalances()`, `calculateSettlements()`, and `calculateSimplifiedSettlements()` to Pinia getters instead of actions, so Vue automatically tracks dependencies.

### FE-09: `ExpenseCategory` Type Missing 'shopping'
- **File**: `client/types/index.ts:52`
- **Description**: The `ExpenseCategory` type is defined as `'food' | 'transport' | 'accommodation' | 'entertainment' | 'general'` but the UI in `ExpenseModal.vue:106` has a "shopping" category option, and `CategoryIcon.vue` handles it. The type doesn't include `'shopping'`.
- **Fix**: Add `'shopping'` to the `ExpenseCategory` type union.

### FE-10: Balance Breakdown Not a Computed Property — Recalculates on Every Render
- **File**: `client/components/balance/BalanceList.vue:41-90`
- **Description**: `getBalanceBreakdown(userId)` is called directly in the template as a method. It iterates over ALL expenses for EACH user. With N users and M expenses, this is O(N*M) on every render. Not memoized.
- **Fix**: Compute the breakdowns once in a single computed property and pass pre-computed data.

### FE-11: `window.location.href` Used for Navigation Instead of `navigateTo`
- **Files**: `client/middleware/auth.ts:27`, `client/app.vue:60,77`
- **Description**: Several places use `window.location.href = '/login'` for redirecting, which causes a full page reload instead of client-side navigation.
- **Fix**: Consider if `navigateTo('/login')` would work. If there's a specific SSR/hydration reason for hard navigations, document it clearly.

### FE-12: ExpenseModal Does Not Pre-Select All Participants for New Expenses
- **File**: `client/components/expense/ExpenseModal.vue:243-245`
- **Description**: When creating a new expense, participants start empty. For a group trip tracker where most expenses are shared by everyone, this creates unnecessary friction.
- **Fix**: Consider adding a "Select All" button or pre-selecting all members by default.

### FE-13: No Error Handling UI for Failed Payment Recording
- **File**: `client/components/settlement/SettlementItem.vue:453-456`
- **Description**: When `confirmPayment()` catches an error, it only logs to console. No user-facing error message shown.
- **Fix**: Add an error state and display it to the user.

### FE-14: Large Component — `index.vue` Dashboard Page (358 Lines)
- **File**: `client/pages/index.vue`
- **Description**: The main dashboard page contains all tab logic, settlement calculations, delete confirmation, payment modal, and activity filtering. Exceeds the 200-line threshold.
- **Fix**: Extract settlement logic into a composable, extract delete confirmation into a composable, split tabs into sub-components.

### FE-15: Large Component — `report.vue` Report Page (739 Lines)
- **File**: `client/pages/report.vue`
- **Description**: The largest file in the codebase at 739 lines. Contains all statistics calculations, chart rendering, date formatting, and 7 report sections.
- **Fix**: Extract each report section into its own component. Extract stat calculations into a `useReportStats` composable.

### FE-16: Large Component — `SettlementItem.vue` (524 Lines)
- **File**: `client/components/settlement/SettlementItem.vue`
- **Description**: Handles expense breakdown, payment info display, payment confirmation, expense selection, and success/error states all in one file.
- **Fix**: Extract `PaymentConfirmation` and `ExpenseBreakdown` into separate sub-components.

---

## 🟢 LOW

### FE-17: Inconsistent `getUserInitials()` — Triplicated Implementation
- **File**: `client/pages/profile.vue:309-316`
- **Description**: `getUserInitials()` is implemented locally in `profile.vue`, duplicating similar logic in `UserAvatar.vue` and `useUserStore.ts`. Three different implementations of the same function.
- **Fix**: Use a single shared `getUserInitials` utility.

### FE-18: Dark Mode Toggle Not Implemented
- **File**: `client/tailwind.config.ts:11`
- **Description**: Tailwind is configured with `darkMode: 'class'`, and all components consistently include dark mode classes. However, there's no UI toggle for switching between light/dark mode and no system preference detection.
- **Fix**: Either add `darkMode: 'media'` for automatic system preference detection, or add a dark mode toggle.

### FE-19: PDF Export Uses `window.print()` Only
- **File**: `client/pages/report.vue:677-679`
- **Description**: The "Export PDF" button just calls `window.print()`. On mobile browsers, `window.print()` behavior varies significantly.
- **Fix**: For better mobile experience, consider `html2pdf.js` or `jspdf`. Current approach works for desktop.

### FE-20: No Keyboard Trap Prevention on Modals
- **Files**: `client/components/expense/ExpenseModal.vue`, `client/components/ui/ConfirmDialog.vue`, `client/components/profile/PaymentInfoModal.vue`
- **Description**: Modals don't trap focus within themselves. Users can tab to elements behind the modal backdrop. No `Escape` key handler to close modals.
- **Fix**: Add focus trapping (e.g., `@vueuse/core`'s `useFocusTrap`) and `@keydown.escape` handlers.

### FE-21: Missing `aria-label` Attributes on Interactive Elements
- **Files**: Multiple components
- **Description**: Icon-only buttons (like edit/delete in `ExpenseItem.vue`) have `title` attributes but no `aria-label`, reducing accessibility for screen readers.
- **Fix**: Add `aria-label` attributes to all interactive elements lacking visible text.

### FE-22: Tailwind `darkMode: 'class'` but No Class Toggle Mechanism
- **File**: `client/tailwind.config.ts:11`
- **Description**: Dark mode is set to `class` strategy, meaning a `.dark` class must be added to `<html>`. No code does this. All `dark:` classes will never activate.
- **Fix**: Either switch to `darkMode: 'media'` for automatic system preference, or implement a class toggle mechanism.

---

## Positives

- Consistent component organization with clear folder structure (`ui/`, `balance/`, `expense/`, `settlement/`, etc.)
- Good use of Tailwind design tokens (`positive`, `negative`, `primary` colors)
- All pages properly use `middleware: ['auth']` and `ssr: false`
- Proper loading states and ClientOnly wrappers throughout
- Good safe-area handling for iOS devices
- Clean separation between stores (expense, payment, user, group)
- Consistent Spanish language throughout the UI
- Well-structured Pinia stores with proper listener cleanup
- Real-time Firestore listeners with proper unsubscribe on cleanup

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH | 4 |
| 🟡 MEDIUM | 10 |
| 🟢 LOW | 6 |
| **Total** | **22** |
