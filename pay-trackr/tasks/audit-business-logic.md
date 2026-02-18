# Business Logic & Data Model Audit

**Auditor**: Business Logic & Data Model Agent
**Date**: 2026-02-13
**Scope**: Core flows, Firestore data model, race conditions, financial precision, AI abstraction, push notifications

---

## 1. Firestore Collection Schema

### Active Collections

| Collection | Document ID | Description | Key Fields |
|---|---|---|---|
| `payment2` | Auto-generated | All payments (one-time + recurrent instances) | `userId`, `title`, `amount`, `categoryId`, `isPaid`, `paidDate`, `recurrentId`, `paymentType`, `dueDate`, `createdAt`, `isWhatsapp`, `status`, `source`, `needsRevision`, `recipient`, `audioTranscription` |
| `recurrent` | Auto-generated | Recurring payment templates | `userId`, `title`, `amount`, `startDate`, `dueDateDay`, `endDate`, `timePeriod`, `categoryId`, `isCreditCard`, `creditCardId` |
| `expenseCategories` | Auto-generated | User-defined categories | `userId`, `name`, `color`, `deletedAt` (soft delete) |
| `whatsappLinks` | Phone number OR 6-char code | Account linking state | `status` (`pending`/`linked`), `userId`, `phoneNumber`, `contactName`, `linkedAt`/`createdAt` |
| `fcmTokens` | Auto-generated | Push notification tokens | `userId`, `token`, `deviceId`, `notificationsEnabled` |
| `paymentTemplates` | Auto-generated | Quick-entry templates | `userId`, `name`, `categoryId`, `description`, `usageCount` |
| `weeklySummaries` | `userId` (user ID as doc ID) | Weekly stats + AI insight | `userId`, `stats`, `aiInsight`, `createdAt` |

### Legacy Collections (deprecated)
- `payment` - Original v1 payment structure
- `tracker` - Monthly payment tracking

### Relationships
```
User (Firebase Auth UID)
  |-- payment2 (via userId)     -- recurrentId --> recurrent
  |-- recurrent (via userId)    -- categoryId --> expenseCategories
  |-- expenseCategories (via userId)
  |-- whatsappLinks (via userId, doc ID = phone or code)
  |-- fcmTokens (via userId)
  |-- paymentTemplates (via userId)
  |-- weeklySummaries (doc ID = userId)
```

---

## 2. Core Flow Analysis

### 2.1 Creating/Editing/Deleting Payments

**One-time payments** (`web/stores/payment.ts`):
- Create: `paymentSchema.create()` -> adds to `payment2` with `paymentType: 'one-time'`
- Update: `paymentSchema.update()` -> verifies userId ownership before update
- Delete: `paymentSchema.delete()` -> verifies userId ownership before delete
- Toggle status: Direct `updateDoc()` on `payment2/{id}` with `isPaid` + `paidDate`

**WhatsApp payments** (`server/webhooks/wp_webhook.js`):
- Text: `parseExpenseMessage()` -> `findCategoryId()` -> `db.collection('payment2').add()`
- Audio: Gemini transcription -> same payment creation path
- Image/PDF: Gemini OCR -> `processTransferData()` -> same payment creation path
- All WA payments set `isWhatsapp: true`, `status: 'pending'`, `source: 'whatsapp-*'`

### 2.2 Recurring Payments Lifecycle

**Template creation** (`web/stores/recurrent.ts:205`):
- Creates doc in `recurrent` collection with schedule info (`dueDateDay`, `startDate`, `endDate`, `timePeriod`)

**Instance generation** (`web/stores/recurrent.ts:353-431`):
- `addNewPaymentInstance()` creates a `payment2` doc with `paymentType: 'recurrent'` and `recurrentId` linking back
- Instances are created on-demand (user clicks) -- NOT automatically by a cron
- `processData()` builds a 6-month rolling view, showing "empty" cells for months without instances

**Deletion** (`web/stores/recurrent.ts:465-516`):
- Queries all `payment2` where `recurrentId == id`, deletes each, then deletes the `recurrent` template

### 2.3 Categories Management

**`web/stores/category.ts`** + **`web/utils/odm/schemas/categorySchema.ts`**:
- Auto-seeded from `DEFAULT_CATEGORIES` (17 categories) on first load if empty
- Soft delete via `deletedAt` timestamp
- Used by ID reference (`categoryId`) in `payment2` and `recurrent`

### 2.4 AI/Chatbot Expense Logging

**WhatsApp integration** (`server/webhooks/wp_webhook.js`):
- Account linking via 6-char codes stored in `whatsappLinks` with 10-min expiry
- Text parsing: `$<amount> <title> #<category> d:<description>`
- Audio: Gemini `transcribeAudio()` -> JSON extraction
- Image/PDF: Gemini `parseTransferImage()`/`parseTransferPDF()` -> JSON extraction
- Recipient history matching for auto-categorization of transfers
- Commands: `VINCULAR`, `DESVINCULAR`, `AYUDA`, `CATEGORIAS`, `RESUMEN`, `FIJOS`, `ANALISIS`

---

## 3. Findings

### 3.1 Race Conditions & Data Integrity

#### 🔴 CRITICAL: Recurrent payment deletion is not atomic
**File**: `web/stores/recurrent.ts:465-516`
**Issue**: `deleteRecurrentPayment()` deletes child `payment2` instances via `Promise.all()` then deletes the `recurrent` template. If the process fails mid-way (e.g., after deleting some instances but before deleting the template), the data is left in an inconsistent state -- orphaned template with missing instances, or orphaned instances with no template.
**Fix**: Use a Firestore `writeBatch()` to atomically delete all instances + the template in a single commit.

#### 🟠 HIGH: No transactions used anywhere in the codebase
**Files**: All stores and server scripts
**Issue**: The entire codebase uses zero Firestore transactions (`runTransaction`). Found in grep: only migration scripts use `writeBatch`. Every multi-document operation (create payment + update template, delete recurrent + instances, category seeding) is done with independent writes. This is acceptable for a single-user personal app but will be problematic in a multi-user "Text the Check" group scenario.
**Fix**: For the merge, introduce `runTransaction` or `writeBatch` for operations that affect multiple documents, especially group expense splitting.

#### 🟡 MEDIUM: Default category seeding is not idempotent
**File**: `web/stores/category.ts:96-131`
**Issue**: `seedDefaultCategories()` creates 17 categories one-by-one with `categorySchema.create()`. If the process fails mid-way (network issue), a partial set of categories is created. Next load, `fetchCategories()` sees `categories.length > 0` and skips re-seeding, leaving the user with an incomplete set.
**Fix**: Use `writeBatch()` for atomic category seeding, or check for completeness rather than just existence.

#### 🟡 MEDIUM: Template `incrementUsage` bypasses ownership check
**File**: `web/utils/odm/schemas/templateSchema.ts:62-81`
**Issue**: `incrementUsage()` calls `updateDoc()` directly without verifying the document's `userId` matches the current user. While the ODM base `update()` method checks ownership, this method bypasses it.
**Fix**: Use the base `update()` method with the increment field, or add a `userId` check before `updateDoc`.

### 3.2 Financial Precision

#### 🟡 MEDIUM: Floating-point arithmetic used for all money calculations
**Files**: `web/stores/recurrent.ts:99-116`, `web/stores/payment.ts:68-95`, `server/webhooks/wp_webhook.js:501-523`, `server/scripts/send-weekly-summary.js:179-193`
**Issue**: All monetary amounts are stored as `number` (IEEE 754 float) in Firestore and all arithmetic uses standard `+` operator with `reduce()`. For Argentine pesos with centavos, this can produce floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). Currently, the formatters (`Intl.NumberFormat`) hide these errors in display, but they can accumulate in multi-month summary calculations.
**Example**: `web/stores/recurrent.ts:110`: `totals[month].paid += data.amount;` -- repeated additions of floats.
**Severity**: Medium because ARS amounts are typically rounded to integers (inflation makes centavos negligible), and display formatting masks precision errors. However, this will be problematic if supporting other currencies.
**Fix**: Either: (a) Store amounts as integers (centavos) and divide by 100 for display, or (b) use a library like `decimal.js` for summations. Option (a) is simpler and recommended.

#### 🟡 MEDIUM: Amount validation allows zero
**File**: `web/utils/odm/schemas/paymentSchema.ts:37` (`min: 0`)
**Issue**: The payment schema allows `amount: 0`, which is semantically meaningless for a payment. The WhatsApp parser correctly rejects `amount <= 0` (`wp_webhook.js:946`), but the web form could allow it.
**Fix**: Change to `min: 0.01` or add a custom validation check.

### 3.3 Data Model Concerns

#### 🔵 PRE-MERGE: Collection name conflicts with "Text the Check"
**Issue**: The following collection names are likely to conflict:
| PayTrackr Collection | Likely TtC Collection | Conflict Risk |
|---|---|---|
| `payment2` | `expenses`, `payments` | **HIGH** - both track expenses |
| `expenseCategories` | `categories` | **MEDIUM** - different naming |
| `whatsappLinks` | N/A | LOW - unique to PayTrackr |
| `fcmTokens` | `fcmTokens` | **HIGH** - likely same name |
| `weeklySummaries` | N/A | LOW - unique to PayTrackr |

**Recommendation**: Namespace PayTrackr collections (e.g., `pt_payments`, `pt_categories`) OR use subcollections under `users/{userId}/` for user-scoped data. This also removes the need for `where('userId', '==', ...)` in every query and enables proper Firestore security rules per-user.

#### 🔵 PRE-MERGE: `categoryId` references are string IDs, not enforced
**Files**: `payment2.categoryId`, `recurrent.categoryId`
**Issue**: Categories are referenced by string ID but there's no Firestore-level referential integrity. Deleting a category (soft delete) doesn't update existing payments/recurrents that reference it. The `getCategoryName` getter falls back to 'Otros' for missing IDs, which is functional but loses data.
**Recommendation**: On category deletion, offer to reassign payments to another category, or at minimum warn the user.

#### 🔵 PRE-MERGE: `whatsappLinks` uses mixed document ID strategy
**File**: `server/webhooks/wp_webhook.js:311`, `web/utils/odm/schemas/whatsappLinkSchema.ts:57`
**Issue**: Pending codes use the 6-char code as doc ID. Linked accounts use the phone number as doc ID. Both live in the same collection with a `status` field to distinguish. This works but makes it impossible to use the ODM's `buildUserQuery()` for pending codes (since they have `userId` but no phone number as ID yet), and creates a naming collision risk.
**Recommendation**: This is fine for the current single-user app but should be split into `whatsappPendingCodes` and `whatsappLinkedAccounts` for clarity in a multi-user merge.

#### 🟡 MEDIUM: `recurrent.dueDateDay` stored as string, not number
**File**: `web/utils/odm/schemas/recurrentSchema.ts:35-37`
**Issue**: `dueDateDay` is stored as a string (e.g., `"15"`) and converted with `parseInt()` in multiple places (`recurrent.ts:322,396`, `send-reminders.js:91`). The server queries with `where('dueDateDay', 'in', dueDays)` where `dueDays` are strings like `[String(todayDay)]`. This works but is fragile -- a value stored as `"05"` vs `"5"` would break matching.
**Fix**: Store as number, or ensure consistent formatting (no leading zeros).

### 3.4 AI/Chatbot Abstraction

#### 🟢 LOW: GeminiHandler is reasonably well-abstracted
**File**: `server/handlers/GeminiHandler.js`
**Assessment**: The AI integration is decoupled through a handler class with clear methods: `transcribeAudio`, `parseTransferImage`, `parseTransferPDF`, `categorizeExpense`, `getFinancialAnalysis`, `getWeeklyInsight`. The handler can be reused for the merged app.
**Minor issue**: The handler uses raw `fetch()` against the Gemini REST API rather than the official `@google/generative-ai` SDK, which would provide better error handling, streaming support, and type safety.
**Improvement**: Migrate to the official SDK for production robustness.

#### 🟡 MEDIUM: AI JSON parsing is fragile
**File**: `server/handlers/GeminiHandler.js:88-95, 142-149`
**Issue**: The handler parses Gemini's response by stripping markdown code fences and calling `JSON.parse()`. If Gemini returns malformed JSON (which LLMs occasionally do), the function returns `null` and the user gets a generic error. There's no retry logic or structured output enforcement.
**Fix**: Use Gemini's structured output mode (JSON mode / response schema) to enforce valid JSON responses, or add retry with a clearer prompt on parse failure.

### 3.5 Push Notifications

#### 🟢 LOW: FCM implementation is complete and robust
**Files**: `server/scripts/send-reminders.js`, `server/scripts/send-weekly-summary.js`, `web/stores/notification.ts`, `web/utils/odm/schemas/fcmTokenSchema.ts`
**Assessment**: The push notification system is well-implemented:
- Token registration with device deduplication
- Invalid token cleanup on send failure (`messaging/invalid-registration-token`)
- Foreground message listener with toast notifications
- Morning/evening notification modes
- Weekly summary with AI insight
- GitHub Actions cron for scheduling

**Minor issues**:
1. `send-reminders.js:47`: Date timezone conversion uses `new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))` which is a known fragile pattern (depends on locale formatting). Recommend using a proper timezone library (e.g., `date-fns-tz`).
2. `send-weekly-summary.js:83`: Full collection scan of `recurrent` (no user filter) -- works for small scale but won't scale if multiple users exist. The scan is intentional (comment on line 80-81 explains why), but it reads ALL users' data.

### 3.6 Additional Observations

#### 🟡 MEDIUM: Stale local state after concurrent modifications
**Files**: All stores (`payment.ts`, `recurrent.ts`, `category.ts`)
**Issue**: Stores use local state caching with manual updates (e.g., `this.payments[index] = {...}` after Firestore write). If the same user has the app open in multiple tabs/devices, local state becomes stale. There are no real-time listeners (except WhatsApp link status) -- data is fetched once and cached.
**Impact**: Low for single-user, but a concern for any multi-device scenario or the merged multi-user app.
**Fix**: Use VueFire's real-time bindings or periodic refresh for critical data.

#### 🟢 LOW: Payment schema `categoryId` still named `category` in some legacy references
**Files**: `web/interfaces/index.ts:9` (uses `categoryId`), `web/CLAUDE.md:98` (documents as `category: string`)
**Issue**: The CLAUDE.md documentation says the field is `category` but the actual schema uses `categoryId`. The legacy `Payment` interface in `interfaces/index.ts` also uses `categoryId`. This is just a documentation mismatch.

#### 🟡 MEDIUM: `processData()` month key collision for same-month-different-year
**File**: `web/stores/recurrent.ts:236-244`
**Issue**: Months are keyed by abbreviated month name (e.g., `"Feb"`) via `date.format("MMM")`. If the 6-month rolling window spans a year boundary, two different "Feb" entries (Feb 2025 and Feb 2026) would collide on the same key. The matching logic at line 301-303 checks year, but the `months` object uses only the month abbreviation as key, so the second year's data would overwrite the first.
**Fix**: Use `YYYY-MMM` as the key (e.g., `"2026-Feb"`) to avoid collisions.

---

## 4. Summary

| Severity | Count | Key Items |
|---|---|---|
| 🔴 CRITICAL | 1 | Non-atomic recurrent deletion |
| 🟠 HIGH | 1 | No transactions anywhere |
| 🟡 MEDIUM | 7 | Float arithmetic, fragile AI parsing, stale state, month key collision, dueDateDay as string, amount min=0, template incrementUsage |
| 🟢 LOW | 3 | AI abstraction good, FCM robust, doc mismatch |
| 🔵 PRE-MERGE | 3 | Collection name conflicts, categoryId references, whatsappLinks mixed IDs |

### Top 3 Pre-Merge Priorities
1. **Namespace collections** to avoid conflicts with Text the Check
2. **Add Firestore transactions** for multi-document operations (critical for group expenses)
3. **Fix month key collision** in `processData()` to prevent data loss at year boundaries
