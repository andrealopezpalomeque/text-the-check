# Architecture & Code Quality Audit

**Date**: 2026-02-13
**Scope**: `/web` (Nuxt 3 frontend) and `/server` (Express.js backend)

---

## 1. Folder Structure

### /web - Nuxt 3 Frontend
```
web/
  components/       # Grouped by domain (payments, recurrents, settings, shared UI)
  composables/      # Vue composition utilities (4 files)
  interfaces/       # TypeScript type definitions (2 files)
  layouts/          # 3 layouts (default, landing, contact-us)
  middleware/       # Single auth middleware
  pages/            # Route pages (~15 pages including settings subpages)
  plugins/          # Empty directory
  stores/           # Pinia stores (7 stores)
  utils/            # Firebase wrapper, formatting, ODM system
    odm/            # Custom Firestore ODM layer
      schemas/      # 6 schema files
  scripts/          # Database migration scripts (3 files + test)
  public/           # PWA assets, service worker
```

### /server - Express.js Backend
```
server/
  handlers/         # GeminiHandler.js (AI wrapper)
  scripts/          # Cron scripts (reminders, weekly summary, test)
  webhooks/         # WhatsApp webhook (Express server)
  instrument.js     # Sentry initialization
```

### Assessment

- **Web structure**: Reasonably organized. Components grouped by domain. The `utils/odm/` abstraction is a good pattern for Firestore access.
- **Server structure**: Minimal but functional. Single-file-per-concern approach works for this scale.
- **Merge readiness**: Moderate. See detailed findings below.

---

## 2. Business Logic Separation

### 🟠 HIGH - Server: All business logic in route handlers (monolith file)

**File**: `server/webhooks/wp_webhook.js` (1488 lines)
**Issue**: The entire WhatsApp webhook server is a single file containing route handlers, command handlers, message parsing, media processing, AI integration, category lookup, recipient history matching, and WhatsApp API calls. No service layer exists.

**Impact on merge**: Adding new features (like group expense handling) would mean further bloating this already large file.

**Suggested fix**: Extract into service modules:
- `services/expenseService.js` - expense parsing, creation, category matching
- `services/whatsappService.js` - WhatsApp API calls, media download
- `services/accountLinkService.js` - link/unlink logic
- `services/analyticsService.js` - resumen, fijos, analisis commands

### 🟡 MEDIUM - Web: Pinia stores handle business logic well

**Files**: `web/stores/*.ts`
**Assessment**: Stores properly delegate database operations to the ODM schema layer. This is a clean separation:
- Stores = state management + coordination
- ODM schemas = database operations + validation
- Composables = reusable UI-adjacent logic

Good pattern that would transfer well to a domain-folder structure.

---

## 3. State Management (Pinia Stores)

### Current stores:
| Store | Domain | Lines | Purpose |
|-------|--------|-------|---------|
| `payment.ts` | Payments | 413 | One-time payment CRUD |
| `recurrent.ts` | Payments | 577 | Recurring payment management with 6-month processing |
| `category.ts` | Shared | 253 | Expense category CRUD |
| `notification.ts` | Infra | 313 | FCM token management |
| `whatsapp.ts` | Integration | 213 | WhatsApp account linking |
| `template.ts` | Payments | 171 | Payment quick-entry templates |
| `weeklySummary.ts` | Analytics | 111 | Weekly summary display |

### 🟡 MEDIUM - Stores are domain-organized but flat

**Issue**: All 7 stores sit in a flat `stores/` directory. For the merge with viaje-grupo (which will add stores for groups, group expenses, balances, settlements), this will become crowded.

**Suggested migration to domain-folder structure**:
```
stores/
  shared/           # category.ts, notification.ts
  finanzas/         # payment.ts, recurrent.ts, template.ts, weeklySummary.ts
  integraciones/    # whatsapp.ts
  grupos/           # (from viaje-grupo: groups.ts, groupExpenses.ts, balances.ts)
```

### 🟡 MEDIUM - recurrent.ts mixes ODM and direct Firestore calls

**File**: `web/stores/recurrent.ts:330,413,479`
**Issue**: Most store actions use `recurrentSchema` and `paymentSchema` (ODM), but `togglePaymentStatus()` (line 330), `addNewPaymentInstance()` (line 413), and `deleteRecurrentPayment()` (line 479) use direct `updateDoc`, `addDoc`, and raw Firestore queries.

**Suggested fix**: Migrate these three methods to use the ODM's `paymentSchema.create()`, `paymentSchema.update()`, and `paymentSchema.delete()` for consistency.

---

## 4. TypeScript Usage

### 🟠 HIGH - Server is entirely vanilla JavaScript

**Files**: All files in `server/` are `.js` with no TypeScript
**Impact**: The server has no type safety. Function parameters are untyped, Firestore documents are untyped, and API responses are untyped. This increases the risk of runtime errors during merge.

**Key concern for merge**: The viaje-grupo project likely has its own patterns. If the server needs to handle both personal and group expenses, untyped code makes refactoring error-prone.

**Suggested fix (pre-merge)**: Convert server to TypeScript. Start with:
1. Add `tsconfig.json` to server
2. Rename files to `.ts`
3. Add interfaces for Firestore documents (`Payment`, `Recurrent`, `WhatsappLink`, etc.)
4. Type function parameters

### 🟠 HIGH - Excessive `any` types in web codebase (~45 instances)

**Key offenders**:

| File | Count | Worst cases |
|------|-------|-------------|
| `utils/odm/schema.ts` | 12 | `data: any` on `create()`, `update()`, `validate()`, `prepareForSave()` |
| `stores/recurrent.ts` | 6 | `createdAt: any`, `paidDate: any`, `date: any`, `error: any` |
| `stores/payment.ts` | 5 | `paidDate: any`, `createdAt: any`, `dueDate: any`, `queryOptions: any` |
| `utils/odm/types.ts` | 4 | `default?: any`, `value?: any`, `[key: string]: any` |
| `utils/odm/validator.ts` | 4 | `value: any`, `data: any`, `result: any` |
| `composables/notificationsService.ts` | 3 | `payment: any`, `recurrentStore: any` |
| `stores/template.ts` | 2 | `createdAt: any`, `cleanData: any` |

**Root cause**: Firestore timestamps (`createdAt`, `paidDate`, `dueDate`) are typed as `any` because they can be `Timestamp`, `Date`, `null`, or `FieldValue`. The ODM layer also uses `any` extensively for generic operations.

**Suggested fix**:
- Create a union type: `type FirestoreDate = Timestamp | Date | FieldValue | null`
- Type the ODM generics: `Schema<T extends DocumentData>`
- Replace `payment: any` in composables with proper interfaces

### 🟡 MEDIUM - 5x `@ts-ignore` in useToast.ts

**File**: `web/composables/useToast.ts:35,41,43,52,54`
**Issue**: Multiple `@ts-ignore` directives suppressing type errors in toast library integration.

**Suggested fix**: Use proper vue3-toastify types or `@ts-expect-error` with explanations.

### 🟢 LOW - Unused Timestamp import

**File**: `web/stores/template.ts:2`
**Issue**: `Timestamp` is imported from `firebase/firestore` but never used in the file.

---

## 5. Dead Code & Unused Code

### 🟠 HIGH - Duplicate `Payment` interface definitions

**Files**:
- `web/interfaces/index.ts:2` - Legacy `Payment` interface (has `payment_id`, `timePeriod`)
- `web/stores/payment.ts:10` - Current `Payment` interface (has `categoryId`, `source`, `recipient`)

**Issue**: Two completely different `Payment` interfaces exist. The one in `interfaces/index.ts` is the legacy version that matches the old schema. The one in `stores/payment.ts` matches the current `payment2` collection.

**Also in `interfaces/index.ts`**:
- `TrackerList`, `Tracker`, `General` interfaces (lines 16-25) - reference the deprecated `tracker` collection
- `SortType`, `SortFields`, `SortOptions` enums (lines 34-47) - may still be used in `paymentUtils.ts`

**Suggested fix**:
1. Move the current `Payment` interface from `stores/payment.ts` to `interfaces/payment.ts` (shared definition)
2. Remove legacy interfaces (`Tracker`, `TrackerList`, `General`) or move them to a `legacy/` folder
3. Audit if `SortType`/`SortFields` are still used; if so, keep them

### 🟡 MEDIUM - Disabled blog pages still in repo

**Files**: `web/pages/blog/index.vue.disable`, `stay-financially-fit.vue.disable`, `why-paytrackr.vue.disable`
**Issue**: Three disabled files (renamed with `.disable` suffix) clutter the repo.

**Suggested fix**: Remove or move to a separate branch. They add noise during merge.

### 🟡 MEDIUM - Legacy `stores/index.ts` referenced but doesn't exist

**File**: `web/CLAUDE.md:68`
**Issue**: CLAUDE.md references `stores/index.ts` as "Legacy store (being phased out)" but the file no longer exists. The documentation is stale.

**Suggested fix**: Update `web/CLAUDE.md` to remove the reference.

### 🟡 MEDIUM - Empty `plugins/` directory

**File**: `web/plugins/`
**Issue**: Directory exists but contains no files. Leftover from project setup.

**Suggested fix**: Remove the empty directory or add a `.gitkeep` if it's intentionally reserved.

### 🟡 MEDIUM - Migration scripts in web package

**Files**: `web/scripts/migrate-*.js`, `web/scripts/wp-business-test.js`
**Issue**: Database migration scripts and a WhatsApp API test script live in the web package. These are one-time-use scripts that add clutter.

**Suggested fix**: Move completed migration scripts to a `scripts/archive/` or remove them. Keep `wp-business-test.js` in the server package where it belongs.

### 🟡 MEDIUM - Legacy category utilities in utils/index.ts

**File**: `web/utils/index.ts:29-83`
**Issue**: `CATEGORY_COLORS` map and `getCategoryClasses()` (marked `@deprecated`), `getCategoryClassesFromColor()` (marked `@deprecated`), `getCategoryColor()` are legacy support for the old string-based category system. The app now uses dynamic categories from `expenseCategories` collection.

**Suggested fix**: Verify no components still use the string-based functions, then remove.

### 🟡 MEDIUM - `validatePayment()` uses legacy schema

**File**: `web/utils/index.ts:1-19`
**Issue**: `validatePayment()` validates against the old payment schema (`timePeriod`, MM/DD/YYYY `dueDate` format). The current payment system uses the ODM validator. This function may be dead code.

**Suggested fix**: Search for usages; if none, remove.

### 🟢 LOW - Unused imports

**Files**:
- `web/stores/template.ts:2` - `Timestamp` imported but unused
- `web/stores/category.ts:2` - `serverTimestamp` imported but unused
- `web/stores/payment.ts:2` - `Timestamp` imported but unused (only `serverTimestamp` is used)

---

## 6. Error Handling

### 🟡 MEDIUM - Inconsistent error patterns across web stores

**Pattern observed**: All stores follow a try/catch pattern with `console.error` + setting `this.error` string. This is consistent. However:

1. **No centralized error handler**: Each store independently logs and sets error state. There's no Sentry integration on the frontend (only on the server).
2. **Error strings are user-facing**: Error messages like `"Error al crear el pago"` are displayed directly. Good for UX but lose diagnostic detail.
3. **Some actions swallow errors**: `togglePaymentStatus` in `recurrent.ts` returns `false` on failure but the calling component may not show the error.

**Suggested fix**: Consider adding a Sentry SDK to the web app, or at minimum a global error logging utility.

### 🟡 MEDIUM - Server error handling is better (Sentry) but verbose

**File**: `server/webhooks/wp_webhook.js:111-119`
**Assessment**: The `logError()` helper is good -- it logs to console and reports to Sentry. Used consistently throughout the webhook handler.

**Concern**: The cron scripts (`send-reminders.js`, `send-weekly-summary.js`) duplicate Firebase initialization and error handling. This is a pattern that would benefit from shared initialization.

### 🟢 LOW - `contact-us.vue` bare `console.error`

**File**: `web/pages/contact-us.vue:79`
**Issue**: Error is caught with bare `console.error(error)` with no user feedback.

---

## 7. Hardcoded Values

### 🟠 HIGH - Firebase config values hardcoded in nuxt.config.ts

**File**: `web/nuxt.config.ts:52,54-56`
```typescript
firebaseAuthDomain: "pay-tracker-7a5a6.firebaseapp.com",  // hardcoded
firebaseStorageBucket: "pay-tracker-7a5a6.appspot.com",    // hardcoded
firebaseMessagingSenderId: "16390920244",                   // hardcoded
firebaseAppId: "1:16390920244:web:adc5a4919d9dd457705261", // hardcoded
```
**Issue**: While `firebaseApiKey` and `firebaseProjectId` come from env vars, four other Firebase config values are hardcoded. This means:
1. Cannot easily switch Firebase projects for staging/testing
2. The `messagingSenderId` and `appId` are committed to source code

**Suggested fix**: Move all Firebase config to environment variables:
```
FIREBASE_AUTH_DOMAIN
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

### 🟡 MEDIUM - Hardcoded Firebase project ID fallback in server

**Files**:
- `server/webhooks/wp_webhook.js:22`
- `server/scripts/send-reminders.js:19`
- `server/scripts/send-weekly-summary.js:16`

**Pattern**: `process.env.FIREBASE_PROJECT_ID || 'pay-tracker-7a5a6'`

**Issue**: Fallback to hardcoded project ID. If `FIREBASE_PROJECT_ID` is not set, the server silently uses the default. For merge, this means the viaje-grupo server could accidentally write to the pay-trackr database.

**Suggested fix**: Make `FIREBASE_PROJECT_ID` required (throw on missing), remove fallback.

### 🟡 MEDIUM - Hardcoded WhatsApp verify token fallback

**File**: `server/webhooks/wp_webhook.js:12`
```javascript
const VERIFY_TOKEN = process.env.WP_VERIFY_TOKEN || 'myself_testing';
```
**Issue**: Falls back to a weak default token if env var is missing.

**Suggested fix**: Require the env var, fail startup if missing.

### 🟡 MEDIUM - Hardcoded Graph API version

**Files**:
- `server/webhooks/wp_webhook.js:1003,1445` - `v21.0`
- `server/handlers/GeminiHandler.js:7` - `v1beta`

**Issue**: API versions are hardcoded in URL strings. When WhatsApp or Gemini update their APIs, every URL must be found and updated.

**Suggested fix**: Extract API versions to constants at the top of the file or to env vars.

### 🟡 MEDIUM - Hardcoded site URL in useSeo.ts

**File**: `web/composables/useSeo.ts:8`
```typescript
const SITE_URL = 'https://paytrackr.wiseutils.com'
```
**Issue**: Production URL is hardcoded. Won't work for staging or the merged app.

**Suggested fix**: Use `useRuntimeConfig().public.siteUrl` from env var.

### 🟡 MEDIUM - Hardcoded Google Site Verification

**File**: `web/nuxt.config.ts:145`
```typescript
content: "E0U6Yf1iG222FwlRLisvf7JLYZLZQnT8CLJ3QKo4tjQ"
```
**Issue**: Google verification code hardcoded in config. This is specific to the current domain.

### 🟢 LOW - Hardcoded contact email fallback

**File**: `web/nuxt.config.ts:49`
```typescript
contactEmail: process.env.CONTACT_EMAIL || 'contact@wiseutils.com',
```
**Issue**: Minor -- email fallback is hardcoded but at least configurable via env var.

---

## 8. Merge Blockers & Compatibility Issues

### 🔴 CRITICAL - firebase-admin and firebase-functions in web package.json

**File**: `web/package.json:34-35`
```json
"firebase-admin": "^12.0.0",
"firebase-functions": "^4.6.0",
```
**Issue**: These are SERVER-SIDE packages that should NOT be in the frontend package. `firebase-admin` includes Node.js-only dependencies and credentials handling. `firebase-functions` is for Cloud Functions deployment. Having them in the web bundle:
1. Bloats the client bundle
2. May cause build warnings or errors
3. Creates confusion about where server code lives

**Likely leftover**: From when the web app may have had Firebase Functions or scripts that were later moved to `/server`.

**Suggested fix**: Remove both packages from `web/package.json`. If migration scripts need them, they should have their own `package.json` or use the server's dependencies.

### 🔴 CRITICAL - Duplicate Firebase initialization across 3 server files

**Files**:
- `server/webhooks/wp_webhook.js:20-35`
- `server/scripts/send-reminders.js:17-31`
- `server/scripts/send-weekly-summary.js:14-28`

**Issue**: The exact same Firebase Admin initialization code is copy-pasted in 3 files. Each file independently checks `admin.apps.length`, decodes the service account, and calls `admin.initializeApp()`.

**Impact on merge**: Adding more scripts or services means more duplication. The viaje-grupo server code would need yet another copy.

**Suggested fix**: Extract to a shared module:
```javascript
// server/lib/firebase.js
export const { db, messaging } = initializeFirebase();
```

### 🟠 HIGH - Firestore collection name conflicts with viaje-grupo

**PayTrackr collections**:
| Collection | Purpose |
|-----------|---------|
| `payment2` | One-time + recurrent payment instances |
| `recurrent` | Recurring payment templates |
| `expenseCategories` | User categories |
| `whatsappLinks` | WhatsApp account linking |
| `fcmTokens` | Push notification tokens |
| `weeklySummaries` | Weekly summary data |
| `paymentTemplates` | Quick-entry templates |
| `contactUs` | Contact form submissions |

**Likely viaje-grupo collections**: `expenses`, `groups`, `payments`, `balances`

**Potential conflicts**:
- `payment2` vs `payments` (viaje-grupo) - Similar names, different structures
- `expenses` (viaje-grupo) vs `payment2` (paytrackr) - Same concept, different names

**Suggested fix**:
- Namespace collections: `pt_payments`, `pt_recurrents` OR
- Use subcollections under a domain: `paytrackr/payments`, `grupos/expenses`
- At minimum, document a collection naming convention before merge

### 🟠 HIGH - No shared types between web and server

**Issue**: The web and server packages define their own data structures independently. For example:
- Web has `Payment` interface in `stores/payment.ts`
- Server has no types at all (vanilla JS)
- Both write to the same `payment2` collection with overlapping but not identical field expectations

**Impact on merge**: Risk of schema drift. If the web adds a new field, the server won't know about it.

**Suggested fix**: Create a shared `types/` or `shared/` package with Firestore document interfaces that both web and server import.

### 🟡 MEDIUM - Mixed ODM and direct Firestore patterns in stores

**Files**: `web/stores/recurrent.ts:330,413,479`, `web/stores/whatsapp.ts:175`, `web/pages/contact-us.vue:71`
**Issue**: Some operations bypass the ODM layer and use direct Firestore calls (`addDoc`, `updateDoc`, `collection`). This means:
1. Validation is skipped
2. `userId` scoping may be inconsistent
3. Timestamps may be added differently

**Suggested fix**: Standardize on ODM for all Firestore operations. Add methods to schemas as needed.

### 🟡 MEDIUM - Inconsistent page naming (routes)

**Pages**: `/fijos`, `/one-time`, `/summary`, `/weekly-summary`, `/settings/*`
**Issue**: Routes mix Spanish (`fijos`) and English (`one-time`, `summary`, `weekly-summary`). For the merged app, need to decide on a consistent URL language.

The CLAUDE.md mentions the UI is Spanish-only, so Spanish routes make more sense.

**Suggested fix**: Standardize on Spanish routes OR English routes, but not both.

### 🟡 MEDIUM - `composables/paymentUtils.ts` uses legacy types

**File**: `web/composables/paymentUtils.ts:3`
**Issue**: Uses `PaymentList`, `SortOptions`, `Payment` from the legacy `interfaces/index.ts` which has a different `Payment` type than the one used in stores.

**Suggested fix**: Update to use the current `Payment` interface from the stores.

### 🟡 MEDIUM - No test infrastructure

**Issue**: Neither web nor server has any test files, test configuration, or test dependencies. No `jest`, `vitest`, `cypress`, or any testing framework is installed.

**Impact on merge**: No way to verify correctness of merged code automatically.

**Suggested fix (pre-merge)**: Add at minimum Vitest for unit tests on stores and utility functions.

### 🟢 LOW - dotenv in web package.json

**File**: `web/package.json:32`
```json
"dotenv": "^17.2.3",
```
**Issue**: Nuxt 3 handles environment variables natively via `runtimeConfig`. The `dotenv` package in the web app is likely unused or only used by migration scripts.

---

## Summary

### Pre-Merge Priority Matrix

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 CRITICAL | 2 | Remove firebase-admin from web; Extract shared Firebase init in server |
| 🟠 HIGH | 5 | Server is vanilla JS; Excessive `any` types; Duplicate Payment interfaces; Collection name conflicts; No shared types |
| 🟡 MEDIUM | 17 | Flat store structure; Mixed ODM/direct patterns; Hardcoded config values; Dead code; No tests; etc. |
| 🟢 LOW | 4 | Unused imports; dotenv in web; Contact form error; Empty plugins dir |

### Top 5 Actions Before Merge

1. **Remove `firebase-admin` and `firebase-functions` from `web/package.json`** - These are server packages in the client.
2. **Extract shared Firebase init in server** - Stop copy-pasting initialization across 3 files.
3. **Define a collection naming convention** - Prevent collisions with viaje-grupo collections.
4. **Create shared TypeScript interfaces for Firestore documents** - Both packages need to agree on data shapes.
5. **Clean up dead code** - Remove legacy interfaces, disabled blog pages, deprecated utilities, and stale CLAUDE.md references.
