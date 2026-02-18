# PayTrackr Pre-Merge Audit Report

**Date**: 2026-02-13
**Purpose**: Comprehensive codebase audit before merging with "Text the Check" (group trip expense tracker)
**Reviewers**: Security, Architecture, Business Logic, Frontend, Infrastructure (5 parallel agents)

---

## PRE-MERGE BLOCKERS

These items **MUST** be resolved before migrating to the unified repo. Attempting to merge without addressing these will cause integration failures, security exposure, or significant rework.

### B1. No Firestore Security Rules in Version Control
- **Severity**: CRITICAL
- **Source**: Security, Infrastructure
- **Files checked**: `**/firestore.rules`, `**/*.rules`, `web/firebase.json`
- **Issue**: No `firestore.rules` file exists anywhere in the repository. Rules are either configured only in the Firebase Console (not version-controlled) or using default permissive rules. For a **personal finance application storing banking details (CBU numbers)**, this means any authenticated user could potentially read/write ANY other user's financial data.
- **Fix**:
  1. Export current rules from Firebase Console immediately
  2. Create `firestore.rules` with per-user ownership checks (`request.auth.uid == resource.data.userId`)
  3. Add to `firebase.json`: `"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }`
  4. Deploy via `firebase deploy --only firestore:rules`

### B2. `firebase-admin` and `firebase-functions` in Web Frontend Dependencies
- **Severity**: CRITICAL
- **Source**: Architecture, Infrastructure
- **File**: `web/package.json:34-35`
- **Issue**: Server-side-only packages (`firebase-admin` includes the entire Google Cloud SDK) are in the frontend `dependencies`. They bloat the client bundle and will cause issues in the merged project's build pipeline.
- **Fix**: Remove both from `web/package.json`. Move migration scripts to `server/` or give them their own `package.json`.

### B3. Firestore Collection Name Conflicts
- **Severity**: PRE-MERGE
- **Source**: Architecture, Business Logic
- **PayTrackr collections**: `payment2`, `recurrent`, `expenseCategories`, `whatsappLinks`, `fcmTokens`, `weeklySummaries`, `paymentTemplates`, `contactUs`
- **Likely TtC collections**: `expenses`, `groups`, `payments`, `balances`
- **Conflicts**: `payment2` vs `payments` (same concept, different names); `fcmTokens` (likely same name); `expenseCategories` vs `categories`
- **Fix**: Namespace PayTrackr collections (e.g., `pt_payments`, `pt_categories`) OR migrate to subcollections under `users/{userId}/` (also eliminates per-query `userId` filtering and enables cleaner security rules).

### B4. Server is Entirely Vanilla JavaScript (No TypeScript)
- **Severity**: PRE-MERGE
- **Source**: Architecture
- **Files**: All files in `server/` are `.js`
- **Issue**: The merged project will be TypeScript. The server has no type safety -- function parameters are untyped, Firestore documents are untyped. Refactoring untyped code for a merge is error-prone.
- **Fix**: Convert server to TypeScript before merge. Add `tsconfig.json`, rename files, add interfaces for Firestore documents.

### B5. No Shared Types Between Web and Server
- **Severity**: PRE-MERGE
- **Source**: Architecture
- **Issue**: Web has `Payment` interface in `stores/payment.ts`; server has no types. Both write to the same `payment2` collection. Schema drift risk is high during merge.
- **Fix**: Create a shared `types/` package with Firestore document interfaces that both web and server import.

### B6. Duplicate Firebase Initialization Across 3 Server Files
- **Severity**: PRE-MERGE
- **Source**: Architecture
- **Files**: `server/webhooks/wp_webhook.js:20-35`, `server/scripts/send-reminders.js:17-31`, `server/scripts/send-weekly-summary.js:14-28`
- **Issue**: Identical Firebase Admin initialization copy-pasted 3 times. Adding more scripts for the merged app means more duplication.
- **Fix**: Extract to `server/lib/firebase.js` exporting `{ db, messaging }`.

### B7. No `.env.example` Files
- **Severity**: PRE-MERGE
- **Source**: Infrastructure
- **Issue**: No documentation of required environment variables beyond reading source code. The "Text the Check" team cannot set up the project without reverse-engineering env var requirements.
- **Fix**: Create `web/.env.example` and `server/.env.example` listing all required variables with placeholder values.

---

## CRITICAL FINDINGS

### C1. `isPaid || true` Bug - Payments Always Marked as Paid When Editing
- **Severity**: CRITICAL
- **Source**: Frontend
- **File**: `web/components/payments/PaymentsManagePayment.vue:604`
```javascript
isPaid: payment.isPaid || true,  // BUG: always evaluates to true
```
- **Issue**: The `||` operator means this expression ALWAYS returns `true`. Users cannot edit a payment and keep it as unpaid. This is an active data corruption bug.
- **Fix**: Change to `isPaid: payment.isPaid ?? false` or `isPaid: payment.isPaid`.

### C2. Non-Atomic Recurrent Payment Deletion
- **Severity**: CRITICAL
- **Source**: Business Logic
- **File**: `web/stores/recurrent.ts:465-516`
- **Issue**: `deleteRecurrentPayment()` deletes child `payment2` instances via `Promise.all()` then deletes the `recurrent` template. If the process fails mid-way, orphaned data is left behind (instances without a template, or a template with missing instances).
- **Fix**: Use Firestore `writeBatch()` to atomically delete all instances + template in a single commit.

### C3. No CI/CD Pipeline for Web Frontend
- **Severity**: CRITICAL
- **Source**: Infrastructure
- **Issue**: No GitHub Actions workflow for building, testing, or deploying the web app. Deployment is manual via `npm run deploy`. This will not scale in a multi-developer merged project.
- **Fix**: Create `.github/workflows/deploy-web.yml` triggered on push to `main` that runs lint, build, and Firebase deploy.

---

## HIGH SEVERITY FINDINGS

### H1. WhatsApp Webhook - No Request Signature Validation
- **Severity**: HIGH
- **Source**: Security
- **File**: `server/webhooks/wp_webhook.js:148`
- **Issue**: The POST `/webhook` endpoint does NOT validate the `X-Hub-Signature-256` header from Meta/WhatsApp. An attacker could send fake expense messages, trigger the `VINCULAR` flow, or invoke `ANALISIS` to retrieve financial data for any linked phone number.
- **Fix**: Validate the signature using `crypto.createHmac('sha256', APP_SECRET)` with `crypto.timingSafeEqual`.

### H2. Default WhatsApp Verify Token Fallback
- **Severity**: HIGH
- **Source**: Security
- **File**: `server/webhooks/wp_webhook.js:12`
```javascript
const VERIFY_TOKEN = process.env.WP_VERIFY_TOKEN || 'myself_testing';
```
- **Issue**: If `WP_VERIFY_TOKEN` is not set in production, anyone who guesses `myself_testing` can verify webhook requests.
- **Fix**: Remove the fallback. Throw on startup if the env var is missing.

### H3. Banking PII (CBU) Stored Without Protection
- **Severity**: HIGH
- **Source**: Security
- **File**: `server/webhooks/wp_webhook.js:1094-1100`
- **Issue**: When users send transfer receipt images, full CBU (22-digit Argentine bank account number), recipient name, alias, and bank are stored in Firestore as plain text. Combined with B1 (no security rules), this data is potentially exposed.
- **Fix**: First fix B1. Then consider whether storing full CBU is necessary (truncate to last 4 digits). Add a data retention policy.

### H4. Excessive `any` Types (~45 instances)
- **Severity**: HIGH
- **Source**: Architecture
- **Key offenders**: `utils/odm/schema.ts` (12), `stores/recurrent.ts` (6), `stores/payment.ts` (5), `utils/odm/types.ts` (4)
- **Root cause**: Firestore timestamps typed as `any` because they can be `Timestamp | Date | FieldValue | null`.
- **Fix**: Create union type `FirestoreDate = Timestamp | Date | FieldValue | null`. Type the ODM generics: `Schema<T extends DocumentData>`.

### H5. Duplicate `Payment` Interface Definitions
- **Severity**: HIGH
- **Source**: Architecture
- **Files**: `web/interfaces/index.ts:2` (legacy), `web/stores/payment.ts:10` (current)
- **Issue**: Two completely different `Payment` interfaces. The legacy one references deprecated fields (`payment_id`, `timePeriod`).
- **Fix**: Consolidate into a single source of truth. Remove legacy interfaces.

### H6. No Transactions Used Anywhere
- **Severity**: HIGH
- **Source**: Business Logic
- **Issue**: Zero Firestore transactions (`runTransaction`) in the entire codebase. Every multi-document operation uses independent writes. This is acceptable for single-user but will cause data consistency issues for group expenses in the merged app.
- **Fix**: Introduce `runTransaction` or `writeBatch` for multi-document operations.

### H7. No Offline Persistence Despite PWA Claims
- **Severity**: HIGH
- **Source**: Frontend
- **File**: `web/nuxt.config.ts:93-126`
- **Issue**: No Firestore offline persistence enabled and no service worker caching for API responses. The PWA claims "offline access" but the app cannot function offline.
- **Fix**: Enable Firestore offline persistence (`enablePersistence`) or update marketing claims.

### H8. Accessibility - Pinch-to-Zoom Disabled
- **Severity**: HIGH
- **Source**: Frontend, Infrastructure
- **File**: `web/nuxt.config.ts:149`
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```
- **Issue**: Prevents pinch-to-zoom, violating WCAG 1.4.4. Flagged by Lighthouse.
- **Fix**: Remove `maximum-scale=1.0, user-scalable=no`.

### H9. Duplicated Category Helper Functions (6+ files)
- **Severity**: HIGH
- **Source**: Frontend
- **Files**: `web/pages/fijos.vue:324-332`, `web/pages/one-time.vue:278-286`, `web/pages/summary.vue:250-268`, `web/pages/weekly-summary.vue:269-272`, `web/components/recurrents/RecurrentsDetails.vue:174-182`, `web/components/payments/PaymentsDetails.vue:223-231`
- **Issue**: `getDisplayCategoryColor()` and `getDisplayCategoryName()` duplicated across 6+ files (~60 lines of repeated code).
- **Fix**: Extract into `composables/useCategory.ts`.

### H10. Modal Body CSS Class Mismatch
- **Severity**: HIGH
- **Source**: Frontend
- **Files**: `web/assets/css/main.css:90` (`body.modal-open`) vs `web/components/Modal.vue:55,66` (`modal-opened`)
- **Issue**: CSS defines `body.modal-open` but JS adds `body.modal-opened`. The page body can scroll behind open modals.
- **Fix**: Align the class names.

### H11. No SPA Rewrite Rule in Firebase Hosting
- **Severity**: HIGH
- **Source**: Infrastructure
- **File**: `web/firebase.json`
- **Issue**: Deep-linked URLs (`/fijos`, `/summary`) may return 404 on Firebase Hosting because there's no rewrite rule for SPA fallback.
- **Fix**: Add `"rewrites": [{ "source": "**", "destination": "/200.html" }]`.

### H12. No Automated Testing
- **Severity**: HIGH
- **Source**: Architecture, Infrastructure
- **Issue**: No test files, no test framework (`vitest`, `jest`, `cypress`), no test scripts, no PR checks.
- **Fix**: Add Vitest for unit tests on stores and utilities. Add a PR check workflow.

### H13. Server Deployment is Undocumented
- **Severity**: HIGH
- **Source**: Infrastructure
- **Issue**: No Dockerfile, Procfile, Cloud Run config, or deployment manifest for the Express webhook server. It's unclear how it runs in production.
- **Fix**: Document deployment or add deployment config (Dockerfile for Cloud Run, etc.).

---

## MEDIUM SEVERITY FINDINGS

| # | Finding | File(s) | Source |
|---|---------|---------|-------|
| M1 | `sendDefaultPii: true` sends PII to Sentry | `server/instrument.js:5` | Security |
| M2 | No rate limiting on webhook endpoint | `server/webhooks/wp_webhook.js` | Security |
| M3 | WhatsApp message text not sanitized before Firestore write | `server/webhooks/wp_webhook.js:867-887` | Security |
| M4 | Gemini AI response parsed without strict validation | `server/handlers/GeminiHandler.js:88-95` | Security |
| M5 | Phone numbers stored as plain text PII | `whatsappLinks` collection | Security |
| M6 | User financial data sent to Gemini API (privacy concern) | `server/webhooks/wp_webhook.js:800-811` | Security |
| M7 | WhatsApp linking code brute-force risk | `server/webhooks/wp_webhook.js:261-336` | Security |
| M8 | Pinia stores flat structure (will be crowded after merge) | `web/stores/` | Architecture |
| M9 | Mixed ODM and direct Firestore calls in stores | `web/stores/recurrent.ts:330,413,479` | Architecture |
| M10 | Hardcoded Firebase project ID fallbacks in server | `server/webhooks/wp_webhook.js:22` | Architecture |
| M11 | Hardcoded WhatsApp API version (`v21.0`) | `server/webhooks/wp_webhook.js:1003,1445` | Architecture |
| M12 | Hardcoded site URL in `useSeo.ts` | `web/composables/useSeo.ts:8` | Architecture |
| M13 | Inconsistent route naming (Spanish/English mix) | `/fijos`, `/one-time`, `/summary` | Architecture |
| M14 | 5x `@ts-ignore` in useToast.ts | `web/composables/useToast.ts:35,41,43,52,54` | Architecture |
| M15 | Dead code: disabled blog pages | `web/pages/blog/*.vue.disable` | Architecture |
| M16 | Dead code: legacy category utilities | `web/utils/index.ts:29-83` | Architecture |
| M17 | Dead code: legacy `validatePayment()` function | `web/utils/index.ts:1-19` | Architecture |
| M18 | Dead code: stale CLAUDE.md reference to `stores/index.ts` | `web/CLAUDE.md:68` | Architecture |
| M19 | `recurrent.dueDateDay` stored as string, not number | `web/utils/odm/schemas/recurrentSchema.ts:35-37` | Business Logic |
| M20 | Month key collision at year boundary in `processData()` | `web/stores/recurrent.ts:236-244` | Business Logic |
| M21 | Default category seeding not idempotent | `web/stores/category.ts:96-131` | Business Logic |
| M22 | Template `incrementUsage` bypasses ownership check | `web/utils/odm/schemas/templateSchema.ts:62-81` | Business Logic |
| M23 | Floating-point arithmetic for all money calculations | Multiple files | Business Logic |
| M24 | Amount validation allows zero | `web/utils/odm/schemas/paymentSchema.ts:37` | Business Logic |
| M25 | Stale local state with no real-time listeners | All stores | Business Logic |
| M26 | AI JSON parsing fragile (no retry, no structured output) | `server/handlers/GeminiHandler.js:88-95` | Business Logic |
| M27 | Inconsistent toast imports (bypass `useToast` composable) | `web/pages/settings/notifications.vue:160` | Frontend |
| M28 | `var` usage instead of `let`/`const` | `web/pages/summary.vue:277-278` | Frontend |
| M29 | PWA manifest description in English (UI is Spanish) | `web/nuxt.config.ts:68` | Frontend |
| M30 | Dead route rules for non-existent pages | `web/nuxt.config.ts:42-44` | Frontend |
| M31 | Duplicated amount conversion functions | Two `ManagePayment` components | Frontend |
| M32 | Missing avatar fallback for `user.photoURL` | `web/components/TheHeader.vue:11` | Frontend |
| M33 | `onClickOutside` called before dropdown element exists | `web/components/TheHeader.vue:61` | Frontend |
| M34 | No global error boundary (`error.vue`) | Web app | Frontend |
| M35 | Contact Us page bypasses ODM (direct Firestore write) | `web/pages/contact-us.vue:71` | Frontend |
| M36 | Missing security headers in Firebase Hosting | `web/firebase.json` | Infrastructure |
| M37 | No caching headers for static assets | `web/firebase.json` | Infrastructure |
| M38 | SENTRY_DSN not passed to GitHub Actions cron scripts | `.github/workflows/*.yml` | Infrastructure |
| M39 | GH Actions runs `node` directly instead of `npm run` scripts | `.github/workflows/send-notifications.yml:57` | Infrastructure |
| M40 | No Apple-specific PWA meta tags | `web/nuxt.config.ts` | Infrastructure |
| M41 | Outdated dependencies (Nuxt 3.10, Vue 3.4, Firebase 10.8) | `web/package.json` | Infrastructure |
| M42 | `eqeqeq: off` in ESLint config | `.eslintrc:15` | Infrastructure |
| M43 | ESLint uses Vue 2 rules (`plugin:vue/essential`) | `.eslintrc` | Infrastructure |
| M44 | Orphaned root `package-lock.json` with empty packages | Root directory | Infrastructure |
| M45 | No monorepo tooling (npm workspaces etc.) | Root directory | Infrastructure |

---

## LOW SEVERITY FINDINGS

| # | Finding | File(s) | Source |
|---|---------|---------|-------|
| L1 | Firebase config values hardcoded (not secrets, just inconvenient) | `web/nuxt.config.ts:52-56` | Security |
| L2 | No `helmet` or `cors` middleware | Server | Security |
| L3 | Phone number used as Firestore doc ID without format validation | `server/webhooks/wp_webhook.js:311` | Security |
| L4 | Audio transcriptions stored (may contain sensitive info) | `server/webhooks/wp_webhook.js:1264` | Security |
| L5 | Sentry DSN missing from GH Actions workflows | `.github/workflows/*.yml` | Security |
| L6 | Unused `Timestamp` import | `web/stores/template.ts:2` | Architecture |
| L7 | Unused `serverTimestamp` import | `web/stores/category.ts:2` | Architecture |
| L8 | Empty `plugins/` directory | `web/plugins/` | Architecture |
| L9 | Migration scripts in wrong package | `web/scripts/` | Architecture |
| L10 | `dotenv` in web package (Nuxt handles env natively) | `web/package.json:32` | Architecture |
| L11 | Contact Us page bare `console.error` | `web/pages/contact-us.vue:79` | Architecture |
| L12 | GeminiHandler uses raw `fetch` instead of official SDK | `server/handlers/GeminiHandler.js` | Business Logic |
| L13 | FCM timezone conversion uses fragile `toLocaleString` pattern | `server/scripts/send-reminders.js:47` | Business Logic |
| L14 | Mixed TypeScript/JavaScript in Vue `<script setup>` blocks | Various components | Frontend |
| L15 | Pinia stores use Options API syntax (not Composition) | All stores | Frontend |
| L16 | Unused `MdiCalendarMonth` import | `web/pages/one-time.vue:251` | Frontend |
| L17 | Contact Us page uses raw pixel values instead of Tailwind utilities | `web/pages/contact-us.vue:2-3` | Frontend |
| L18 | Navigation tab duplication (Configuracion in nav + dropdown) | `web/layouts/default.vue` | Frontend |
| L19 | No "New version available" UI for PWA updates | Web app | Frontend |
| L20 | Single Firebase project alias (no staging) | `web/.firebaserc` | Infrastructure |
| L21 | No lint/type-check scripts in package.json | `web/package.json` | Infrastructure |

---

## STATISTICS

| Severity | Count |
|----------|-------|
| Pre-Merge Blockers | 7 |
| Critical | 3 |
| High | 13 |
| Medium | 45 |
| Low | 21 |
| **Total findings** | **89** |

## POSITIVE FINDINGS

The audit also identified several well-implemented areas:
- Loading skeletons on all major pages
- Consistent CRUD success/error feedback with toast notifications
- Mobile-first responsive design with proper Tailwind breakpoints
- Auth guards correctly applied on all protected routes
- Clean ODM abstraction layer for Firestore access
- GeminiHandler reasonably well-abstracted and reusable
- FCM push notification system is complete and robust
- WhatsApp command system well-organized with clear user flows
- Good `.gitignore` configuration (no secrets committed)

---

## RECOMMENDED ACTION PLAN

### Phase 1: Before Merge (Blockers)
1. Export and version-control Firestore security rules (B1)
2. Remove `firebase-admin`/`firebase-functions` from web deps (B2)
3. Define collection naming convention and namespace collections (B3)
4. Create `.env.example` files for both packages (B7)
5. Extract shared Firebase init in server (B6)
6. Fix `isPaid || true` bug (C1)

### Phase 2: Before Merge (High Priority)
7. Add WhatsApp webhook signature validation (H1)
8. Remove default verify token fallback (H2)
9. Fix non-atomic recurrent deletion with `writeBatch` (C2)
10. Fix modal CSS class mismatch (H10)
11. Extract duplicated category helpers into composable (H9)
12. Add SPA rewrite rule to `firebase.json` (H11)
13. Fix viewport zoom restriction (H8)

### Phase 3: During Merge
14. Convert server to TypeScript (B4)
15. Create shared types package (B5)
16. Set up CI/CD pipeline for web (C3)
17. Add test framework (H12)
18. Clean up dead code (M15-M18)
19. Consolidate duplicate `Payment` interfaces (H5)
20. Document server deployment (H13)

### Phase 4: Post-Merge Improvements
21. Add Firestore transactions for multi-document ops (H6)
22. Enable Firestore offline persistence (H7)
23. Fix floating-point money arithmetic (M23)
24. Add real-time listeners for multi-device sync (M25)
25. Reduce `any` types (H4)
26. Add rate limiting, helmet, security headers (M2, M36)
