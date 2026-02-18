# Pre-Merge Audit — Final Synthesized Report

**Project**: Text The Check (group trip expense tracker)
**Date**: 2026-02-13
**Reviewers**: 5 (Security, Architecture, Business Logic, Frontend, Infrastructure)
**Total Unique Findings**: 65 (deduplicated across reviewers)

---

## PRE-MERGE BLOCKERS

These **must** be resolved before migrating to the new repo. Ordered by risk.

### PMB-1. Firestore Rules: Zero Cross-Group Data Isolation
- **Severity**: 🔴 CRITICAL
- **Sources**: SEC-03, ARCH-05, FE-02
- **File**: `firestore.rules:153-172`
- **Description**: Every authenticated user can read ALL expenses, payments, users, and groups across the entire system. Any logged-in user can also **update or delete ANY expense** (rules lines 165, 171). The rules check `isAuthenticated()` but never check group membership.
- **Fix**: Add group-membership validation to all read/write rules. For expenses/payments, verify user belongs to the expense's `groupId`. For groups, verify membership. For users, restrict to same-group members.

### PMB-2. AI-Parsed Payments Save Without User Confirmation
- **Severity**: 🔴 CRITICAL
- **Source**: BIZ-01
- **File**: `server/src/routes/whatsapp.js:931-1022`
- **Description**: AI-parsed **expenses** go through a confirm/deny flow (user must reply "si"). AI-parsed **payments** skip this entirely and write directly to Firestore. A misinterpreted "le pagué" message could record a wrong payment, corrupt balances, and send a false notification.
- **Fix**: Add the same pending confirmation flow for payments as exists for expenses.

### PMB-3. Webhook Signature Verification: Non-Constant-Time + Bypass Flag Active
- **Severity**: 🔴 CRITICAL
- **Sources**: SEC-01, SEC-02, BIZ-02, INFRA-03
- **Files**: `whatsapp.js:146`, `.env:42`, `server/.env:22`
- **Description**: Two compounding issues:
  - Uses `!==` instead of `crypto.timingSafeEqual()` despite the comment claiming constant-time comparison.
  - `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true` is set in both env files. If `NODE_ENV` is unset, verification is bypassed entirely.
- **Fix**: (a) Use `crypto.timingSafeEqual()`. (b) Remove the skip flag from all .env files. (c) Default to `false` in `.env.example`.

### PMB-4. Balance Calculation Duplicated Across 3 Locations with Different Rounding
- **Severity**: 🔴 CRITICAL
- **Sources**: ARCH-02, BIZ-04
- **Files**: `commandService.ts:147-220` (no rounding), `useUserStore.ts:95-170` (`Math.round()`), `useUserStore.ts:199-313` (separate settlements)
- **Description**: Users see different numbers on WhatsApp vs the dashboard. Over many split expenses with non-divisible amounts, floating-point drift accumulates.
- **Fix**: Unify into a single shared calculation. At minimum, add `Math.round()` to the server version.

### PMB-5. `whatsapp.js` — 1065-Line Untyped JavaScript God File
- **Severity**: 🔴 CRITICAL
- **Sources**: ARCH-01, ARCH-03
- **File**: `server/src/routes/whatsapp.js`
- **Description**: The single most important file (all webhook logic, expense processing, payment handling, AI integration, state machines) is **plain JavaScript with zero type safety**. Any refactoring during migration is dangerous without types.
- **Fix**: Convert to TypeScript before migration. Break into `webhookController.ts` + domain-specific handlers.

### PMB-6. Frontend: No Ownership Checks on Expense/Payment Mutations
- **Severity**: 🔴 CRITICAL
- **Sources**: FE-01, FE-06
- **Files**: `ExpenseItem.vue:26-39`, `SettlementItem.vue:416-458`
- **Description**: Edit/delete buttons visible to ALL users (no `v-if` ownership guard). Any user can record a payment between ANY two people. Combined with PMB-1, any authenticated user can modify or delete anyone's financial data.
- **Fix**: Add client-side ownership checks AND fix Firestore rules (PMB-1).

### PMB-7. In-Memory Pending State Lost on Server Restart
- **Severity**: 🔴 CRITICAL
- **Sources**: ARCH-04, BIZ-03
- **File**: `commandService.ts:63-77`
- **Description**: 5 separate `Map` objects store pending expenses, AI confirmations, group selections, and message dedup. Server restart = silent data loss for users mid-flow.
- **Fix**: Move pending state to Firestore or Redis with TTL. At minimum, add error handling so users get a message when their pending data is gone.

### PMB-8. Stray Credentials in `server/.env` (Curl Command)
- **Severity**: 🔴 CRITICAL
- **Source**: INFRA-02
- **File**: `server/.env:30-36`
- **Description**: Contains a pasted `curl` command with a hardcoded WhatsApp API token and PIN `"123456"`.
- **Fix**: Remove immediately.

### PMB-9. Consolidate 3 Divergent `.env` Files
- **Severity**: 🟠 HIGH
- **Source**: INFRA-04
- **Files**: `.env`, `server/.env`, `client/.env`
- **Description**: Root `.env`, `server/.env`, and `client/.env` have overlapping, divergent secrets with different naming conventions.
- **Fix**: Delete root `.env`. Use only `client/.env` (NUXT_PUBLIC_ vars) and `server/.env` (server secrets). Create `client/.env.example`.

### PMB-10. Break Up Overloaded `useUserStore`
- **Severity**: 🟡 MEDIUM
- **Sources**: ARCH-12, FE-07, FE-08
- **File**: `client/stores/useUserStore.ts` (401 lines)
- **Description**: Mixes user CRUD with balance calculation, settlement algorithms, and payment info. The `void paymentStore.payments.length` reactivity hack (5+ occurrences) is fragile. Will be painful to migrate to domain-folder structure.
- **Fix**: Extract balance/settlement logic into a `useBalanceCalculator` composable or dedicated store. Convert methods to Pinia getters.

### PMB-11. Remove Dead Dependencies Before Merge
- **Severity**: 🟢 LOW
- **Sources**: ARCH-13, ARCH-15
- **File**: `client/package.json`
- **Description**: `vue3-toastify`, `chart.js`, `vue-chartjs` are listed but never imported.
- **Fix**: `npm uninstall vue3-toastify chart.js vue-chartjs`

---

## 🔴 CRITICAL (Non-Blocker)

| # | Finding | File | Source |
|---|---------|------|--------|
| C1 | Welcome message swallows user's first real message — expense silently lost | `whatsapp.js:349-356` | BIZ-07 |

**Fix**: After sending welcome, continue processing the message instead of `return`. Or tell the user to resend.

---

## 🟠 HIGH

| # | Finding | File | Source |
|---|---------|------|--------|
| H1 | CORS is fully open — `app.use(cors())` | `server/src/index.js:25` | SEC-04, INFRA-06 |
| H2 | AI prompt injection risk — raw WhatsApp text concatenated into Gemini prompt | `aiService.ts:120-121` | SEC-05 |
| H3 | Hardcoded exchange rates in client modal (USD:1300, EUR:1400, BRL:260) — stale | `ExpenseModal.vue:207-211` | FE-04 |
| H4 | `isDataReady` flickers on every store loading change, causing dashboard spinner flash | `index.vue:160-176` | FE-05 |
| H5 | `/report` page missing from `routeRules` | `nuxt.config.ts:73-77` | FE-03 |
| H6 | Race condition: balance reads expenses and payments non-transactionally | `commandService.ts:148-149` | BIZ-06 |
| H7 | Regex payment parser only matches `startsWith(keyword)` — natural variations fail | `messageParser.ts:204-210` | BIZ-05 |
| H8 | Hardcoded Gemini model `gemini-2.0-flash-exp` (experimental, may be deprecated) | `aiService.ts:109` | ARCH-07 |
| H9 | Hardcoded dashboard URL `https://textthecheck.app` — 19 occurrences in 3 files | Multiple server files | ARCH-08 |
| H10 | Duplicated categorization logic with divergent keyword lists | `whatsapp.js:1028` vs `messageParser.ts:53` | ARCH-06 |
| H11 | Scripts can run against production Firestore with no guardrails | `scripts/`, `server/scripts/` | INFRA-05 |
| H12 | No CI/CD pipeline — no linting, type checking, tests, or build verification | N/A | INFRA-07 |

---

## 🟡 MEDIUM

| # | Finding | File | Source |
|---|---------|------|--------|
| M1 | 8 `any` types in client code (catch blocks, expenseData) | Multiple | ARCH-09 |
| M2 | Stale exchange rate fallbacks (USD:850) ~14 months outdated | `exchangeRateService.ts:28-32` | ARCH-11, BIZ-10 |
| M3 | Duplicate toast libraries (`vue-toastification` + `vue3-toastify`) | `client/package.json:27-28` | ARCH-13 |
| M4 | Unused `getFirestore` import | `useFirebase.ts:1` | ARCH-14 |
| M5 | Unused export `SIMPLE_EXTRACTION_PROMPT` | `expenseExtraction.ts:426` | ARCH-10 |
| M6 | `ExpenseCategory` type missing 'shopping' | `client/types/index.ts:52` | FE-09 |
| M7 | `BalanceList.vue` O(N*M) recalculation on every render (not memoized) | `BalanceList.vue:41-90` | FE-10 |
| M8 | `window.location.href` for navigation causes full page reloads | `middleware/auth.ts:27`, `app.vue:60,77` | FE-11 |
| M9 | ExpenseModal doesn't pre-select participants (friction for "split with everyone") | `ExpenseModal.vue:243-245` | FE-12 |
| M10 | No user-facing error on failed payment recording | `SettlementItem.vue:453-456` | FE-13 |
| M11 | Dashboard page too large (358 lines) — needs decomposition | `pages/index.vue` | FE-14 |
| M12 | Report page too large (739 lines) — needs decomposition | `pages/report.vue` | FE-15 |
| M13 | SettlementItem too large (524 lines) — needs decomposition | `SettlementItem.vue` | FE-16 |
| M14 | AI `command` type result never acted on (falls through to regex) | `whatsapp.js:469-491` | BIZ-13 |
| M15 | No upper bound on expense amounts — AI hallucination could store $50M | `whatsapp.js:295-321` | BIZ-11 |
| M16 | "todos menos X y yo" combo not in AI prompt examples | `expenseExtraction.ts` | BIZ-09 |
| M17 | `originalInput` stores raw user messages readable by all authenticated users | `expenseService.ts:18` | SEC-09 |
| M18 | `rawBody` fallback to `JSON.stringify` weakens signature verification | `whatsapp.js:142` | SEC-11 |
| M19 | Server build script fragile — manual `cp` for mixed JS/TS | `server/package.json:10` | INFRA-08 |
| M20 | Ambiguous env var naming (`FIREBASE_API_KEY` vs `NUXT_PUBLIC_FIREBASE_API_KEY`) | `nuxt.config.ts:59-67` | INFRA-09 |
| M21 | Missing `client/.env.example` | N/A | INFRA-11 |
| M22 | Root `.env.example` mixes client and server vars | `.env.example` | INFRA-12 |

---

## 🟢 LOW

| # | Finding | File | Source |
|---|---------|------|--------|
| L1 | Phone number logging exposes PII | `whatsappService.ts:89` | SEC-12, BIZ-19 |
| L2 | Error handler leaks stack traces in dev mode | `index.js:66` | SEC-13 |
| L3 | Firebase client API key exposed (by design, but no App Check) | `nuxt.config.ts:61` | SEC-14 |
| L4 | Inconsistent error handling (some services throw, some return []) | Multiple server services | ARCH-18 |
| L5 | Server routes mix `.js` and `.ts` extensions | `server/src/` | ARCH-19 |
| L6 | WhatsApp API version `v18.0` hardcoded | `whatsappService.ts:91` | ARCH-20 |
| L7 | `index.vue` missing `lang="ts"` in script setup | `pages/index.vue:141` | ARCH-21 |
| L8 | Dark mode configured (`darkMode: 'class'`) but no toggle or system detection | `tailwind.config.ts:11` | FE-18, FE-22 |
| L9 | PDF export is just `window.print()` — limited on mobile | `report.vue:677-679` | FE-19 |
| L10 | No focus trapping or Escape key handler on modals | Multiple modals | FE-20 |
| L11 | Missing `aria-label` on icon-only buttons | Multiple components | FE-21 |
| L12 | Triplicated `getUserInitials()` implementation | `profile.vue`, `UserAvatar.vue`, `useUserStore.ts` | FE-17 |
| L13 | `/borrar` command redirects to dashboard — dead `deleteExpenseCommand` code | `commandService.ts:325-401` | BIZ-16 |
| L14 | `PendingAIExpense.unresolvedNames` field never set (vestigial) | `commandService.ts:53` | BIZ-17 |
| L15 | Regex fallback doesn't handle Argentine slang | `messageParser.ts:8-48` | BIZ-18 |
| L16 | Render cold start may delay webhook responses | `health.js` | INFRA-13 |
| L17 | ngrok has no domain pinning | `server/scripts/ngrok.mjs` | INFRA-14 |
| L18 | Hardcoded Firestore IDs in legacy scripts | `scripts/*.js` | INFRA-15 |
| L19 | Legacy CommonJS scripts in root `scripts/` folder | `scripts/` | INFRA-16 |

---

## Severity Summary

| Severity | Count |
|----------|-------|
| 🔵 PRE-MERGE BLOCKERS | 11 |
| 🔴 CRITICAL (other) | 1 |
| 🟠 HIGH | 12 |
| 🟡 MEDIUM | 22 |
| 🟢 LOW | 19 |
| **Total** | **65** |

---

## Suggested Fix Order (Sprint Plan)

### Day 1 — Security (PMB-1, PMB-3, PMB-6, PMB-8)
1. Fix Firestore rules with group-membership checks
2. Fix `crypto.timingSafeEqual` + remove skip flag
3. Add ownership checks on frontend mutations
4. Remove stray curl from server/.env

### Day 2 — Data Integrity (PMB-2, PMB-4, PMB-7, C1)
5. Add confirmation flow for AI payments
6. Unify balance calculation + fix rounding
7. Move pending state to Firestore/Redis (or add error handling)
8. Fix welcome message swallowing first expense

### Day 3 — Migration Prep (PMB-5, PMB-9, PMB-10, PMB-11)
9. Convert whatsapp.js to TypeScript + break up
10. Consolidate .env files
11. Refactor useUserStore into domain stores
12. Remove dead dependencies

### Day 4+ — High/Medium Items As Bandwidth Allows
- Restrict CORS (H1)
- Add CI/CD pipeline (H12)
- Fix hardcoded exchange rates (H3)
- Add production safeguards to scripts (H11)
- Fix `isDataReady` flicker (H4)
- Add `/report` to routeRules (H5)
- Extract hardcoded values to config (H8, H9)

---

## Cross-Reference Index

Each finding references its source audit file:
- `SEC-*` → [audit-security.md](./audit-security.md)
- `ARCH-*` → [audit-architecture.md](./audit-architecture.md)
- `BIZ-*` → [audit-business-logic.md](./audit-business-logic.md)
- `FE-*` → [audit-frontend.md](./audit-frontend.md)
- `INFRA-*` → [audit-infrastructure.md](./audit-infrastructure.md)
