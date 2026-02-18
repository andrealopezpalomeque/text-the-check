# Architecture & Code Quality Audit

**Reviewer**: Architecture Reviewer
**Date**: 2026-02-13
**Scope**: Monorepo structure, separation of concerns, Pinia stores, TypeScript usage, dead code, error handling, composables, AI abstraction, hardcoded values, merge blockers

---

## 🔴 CRITICAL

### ARCH-01: Server Entry Point is `.js` but Imports `.ts` Services — Mixed Language Boundaries
- **Files**: `server/src/index.js:1-85`, `server/src/routes/whatsapp.js`, `server/src/routes/health.js`
- **Description**: The server entry point (`index.js`) and route files are plain JavaScript, while all services are TypeScript. The route handler `whatsapp.js` is a 1065-line JS file with zero type safety, handling all core WhatsApp business logic. All the `handleTextMessage`, `handleAIExpense`, `handleAIPayment`, `handleExpenseMessage`, `handlePaymentMessage`, `saveConfirmedAIExpense`, `categorizeFromDescription`, `validateExpenseInput` functions are untyped.
- **Fix**: Convert `server/src/routes/whatsapp.js` to TypeScript. This file contains ~1065 lines of critical financial logic.

### ARCH-02: Balance Calculation Logic Duplicated Across 3 Locations
- **Files**:
  - `server/src/services/commandService.ts:147-220` (server-side `calculateGroupBalances`)
  - `client/stores/useUserStore.ts:95-170` (`calculateBalances`)
  - `client/stores/useUserStore.ts:199-313` (`calculateSettlements`)
- **Description**: The core balance/debt calculation algorithm is independently implemented in 3 places. If one gets a bug fix and the others don't, users will see different balances on WhatsApp vs. the dashboard. The server version also rounds differently (no rounding) vs. the client (uses `Math.round`).
- **Fix**: Extract shared balance calculation to a shared package or, at minimum, ensure both implementations are verified identical. Long-term, consider a single calculation endpoint.

---

## 🟠 HIGH

### ARCH-03: `whatsapp.js` Route is a 1065-Line God Function
- **File**: `server/src/routes/whatsapp.js:1-1066`
- **Description**: This single route file contains: webhook verification, message deduplication, authorization, state machines (pending group selection, pending expenses, pending AI confirmations), expense processing, payment processing, AI integration, categorization, and all response formatting orchestration. It imports from 8+ services.
- **Fix**: Extract to a `webhookController.ts` and break into a state machine pattern with clear handlers.

### ARCH-04: In-Memory State Management for Pending Operations
- **Files**:
  - `server/src/services/commandService.ts:63-77` (4 separate `Map` caches)
  - `server/src/routes/whatsapp.js:58` (`processedMessageIds` Map)
- **Description**: 5 separate in-memory Maps store critical user session state. If the server restarts or scales to multiple instances, all pending expenses, group selections, and message deduplication are lost. Users in the middle of confirming an AI expense would lose their data silently.
- **Fix**: For single-instance: acceptable short-term. For scaling: move to Redis or Firestore for pending state. Add logging when state is lost on restart.

### ARCH-05: No Firestore Security Scoping by Group Membership
- **File**: `firestore.rules:123-232`
- **Description**: All authenticated users can read ALL expenses, payments, users, and groups. The rules check `isAuthenticated()` but never verify group membership. Any logged-in user can read any group's financial data.
- **Fix**: Add group membership validation to Firestore rules.

### ARCH-06: Duplicated Categorization Logic
- **Files**:
  - `server/src/utils/messageParser.ts:53-92` (`categorizeExpense`)
  - `server/src/routes/whatsapp.js:1028-1064` (`categorizeFromDescription`)
- **Description**: Two independent category keyword maps. The `whatsapp.js` version has additional keywords (`birra`, `morfi`, `cabify`, `subte`, `depto`, `boliche`) that are missing from the `messageParser.ts` version.
- **Fix**: Extract to a single shared `categorizeExpense` function.

### ARCH-07: Hardcoded Model Name for Gemini AI
- **File**: `server/src/services/aiService.ts:109`
- **Description**: `model: 'gemini-2.0-flash-exp'` is hardcoded. This is an experimental model that may be deprecated without notice. Other AI config (timeout, confidence threshold) is properly env-configured but the model name is not.
- **Fix**: Add `GEMINI_MODEL` env var with fallback to a stable model like `gemini-1.5-flash`.

### ARCH-08: Hardcoded Dashboard URL Across Multiple Files
- **Files**: 19 occurrences of `https://textthecheck.app` across 3 server files
  - `server/src/services/whatsappService.ts` (7 occurrences)
  - `server/src/routes/whatsapp.js` (7 occurrences)
  - `server/src/services/commandService.ts` (5 occurrences)
- **Fix**: Extract to env var `DASHBOARD_URL` or a config constant.

---

## 🟡 MEDIUM

### ARCH-09: `any` Types in Client Code (8 Occurrences)
- **Files**:
  - `client/stores/useExpenseStore.ts:189` — `expenseData: any`
  - `client/stores/useGroupStore.ts:91` — `catch (err: any)`
  - `client/stores/useUserStore.ts:87,394` — `catch (err: any)`
  - `client/composables/useAuth.ts:179,224,242` — `catch (err: any)`
  - `server/src/services/whatsappService.ts:114` — `data: any`
- **Fix**: Replace `any` with proper types. For catch blocks, use `unknown` and narrow. For `expenseData`, define a proper interface.

### ARCH-10: Unused Export `SIMPLE_EXTRACTION_PROMPT`
- **File**: `server/src/prompts/expenseExtraction.ts:426-428`
- **Description**: Exported but never imported anywhere in the codebase.
- **Fix**: Remove if not planned for use.

### ARCH-11: Stale Exchange Rate Fallback Values
- **File**: `server/src/services/exchangeRateService.ts:28-32`
- **Description**: Static fallback rates `USD: 850, EUR: 925, BRL: 170` are hardcoded. These were reasonable at some point but will drift significantly over time and may lead to incorrect expense amounts when the API is down.
- **Fix**: Either update periodically or log a warning when fallback rates are used with a prominent "rates may be inaccurate" message to the user.

### ARCH-12: `useUserStore` is Overloaded — It's the "Everything" Store
- **File**: `client/stores/useUserStore.ts:1-401`
- **Description**: This store handles: user fetching, balance calculation, settlement calculation (2 algorithms), payment info updates, and getter helpers. The `calculateSettlements()` method alone is 115 lines with nested debt graph logic. This will be hard to migrate to a domain-folder structure.
- **Fix**: Extract `calculateBalances`, `calculateSettlements`, and `calculateSimplifiedSettlements` into a composable like `useBalanceCalculator` or a dedicated `useSettlementStore`.

### ARCH-13: Duplicate Toast Libraries in Client Dependencies
- **File**: `client/package.json:27-28`
- **Description**: Both `vue-toastification` (rc version) and `vue3-toastify` are listed as dependencies. Only one should be used.
- **Fix**: Remove the unused toast library.

### ARCH-14: Unused `getFirestore` Import
- **File**: `client/composables/useFirebase.ts:1`
- **Description**: `getFirestore` is imported from `firebase/firestore` but never used — the composable gets `$db` from `useNuxtApp()`.
- **Fix**: Remove the unused import.

### ARCH-15: `chart.js` and `vue-chartjs` Are Dependencies but Not Used
- **File**: `client/package.json:19,26`
- **Description**: Both packages are in dependencies but no component imports them. The report page uses a custom CSS bar chart instead.
- **Fix**: Remove unused packages.

### ARCH-16: Deprecated Comment Referencing Moved Function
- **File**: `server/src/utils/messageParser.ts:176`
- **Description**: A `@deprecated` JSDoc block references `convertToARS` that was moved to `exchangeRateService.ts`, but the function itself was already removed. The dangling comment is dead code.
- **Fix**: Remove the deprecated comment block.

### ARCH-17: `report.vue` Missing Explicit Imports for Utility Functions
- **File**: `client/pages/report.vue:83,275,289,etc.`
- **Description**: The `report.vue` script uses `formatCurrency` and `formatAmount` extensively but relies on Nuxt auto-imports. Since they're in `client/utils/`, Nuxt auto-import should resolve them, but explicit imports would make the dependencies clear for such a large file (~740 lines).
- **Fix**: Consider explicit imports for clarity in large pages.

---

## 🟢 LOW

### ARCH-18: Inconsistent Error Swallowing Pattern
- **Files**: Multiple server services
- **Description**: Some service functions silently return empty arrays on error (`getExpensesByGroup` returns `[]`), while others throw (`createExpense` throws). This is inconsistent — callers need to know which services may silently fail.
- **Fix**: Document the contract. Consider always throwing and letting callers decide.

### ARCH-19: Server Routes Mix `.js` and `.ts` Extensions
- **File**: `server/src/` directory
- **Description**: `index.js`, `routes/whatsapp.js`, `routes/health.js` are JS while everything else is TS. The build script has a `cp` hack to copy JS files.
- **Fix**: Convert all to TypeScript for consistency.

### ARCH-20: `v18.0` Hardcoded WhatsApp API Version
- **File**: `server/src/services/whatsappService.ts:91`
- **Description**: `https://graph.facebook.com/v18.0/...` — API version is hardcoded. Meta deprecates API versions.
- **Fix**: Move to env var `WHATSAPP_API_VERSION`.

### ARCH-21: Index Page `script setup` Lacks `lang="ts"`
- **File**: `client/pages/index.vue:141`
- **Description**: Uses `<script setup>` without `lang="ts"` despite the project having `typescript: { strict: true }` in nuxt config. The `report.vue` page correctly uses `<script setup lang="ts">`.
- **Fix**: Add `lang="ts"` for consistency.

---

## 🔵 PRE-MERGE

### ARCH-PM1: Convert `whatsapp.js` Route to TypeScript
This is the #1 migration blocker. The 1065-line route file has zero type safety for the most critical business logic. See ARCH-01.

### ARCH-PM2: Extract Balance Calculation Into Shared Code
Before merging, unify the client and server balance calculation to prevent divergent financial results. See ARCH-02.

### ARCH-PM3: Break Up `useUserStore`
The store mixing user CRUD with balance/settlement calculations will make the domain-folder migration painful. Extract settlement logic first. See ARCH-12.

### ARCH-PM4: Remove Dead Dependencies
Remove `vue3-toastify`, `chart.js`, `vue-chartjs` before merging to avoid confusion. See ARCH-13, ARCH-15.

### ARCH-PM5: Normalize Error Handling Patterns
Document or unify whether services throw or return defaults on error before any new consumers are added. See ARCH-18.

---

## Assessments

### Monorepo Structure
The npm workspaces setup is clean. Root `package.json` properly configures `client` and `server` workspaces with parallel dev scripts and coordinated build. No circular dependencies between workspaces.

### Pinia Stores
- `useExpenseStore`: Well-structured, single responsibility (expenses CRUD + listeners)
- `usePaymentStore`: Well-structured, mirrors expense store pattern
- `useGroupStore`: Well-structured, handles group selection + sync
- `useUserStore`: **OVERLOADED** — needs refactoring before migration (see ARCH-12)

### Composables
- `useAuth`: Well-scoped, good separation of Firebase Auth + Firestore linking
- `useFirebase`: Minimal wrapper, fine but has unused import (ARCH-14)
- `useNavigationState`: Well-scoped, handles tab state + URL sync
- `useToast`: Thin wrapper, clean

### AI Service
The Gemini AI service (`aiService.ts`) is reasonably well-abstracted with clean interfaces (`AIExpenseResult`, `AIPaymentResult`, etc.), proper timeout handling, and a validation layer. Main issues: hardcoded model name (ARCH-07) and tight coupling through the 419-line prompt file (acceptable for current scope).

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH | 6 |
| 🟡 MEDIUM | 9 |
| 🟢 LOW | 4 |
| 🔵 PRE-MERGE | 5 |
| **Total** | **26** |
