# WhatsApp Bot & Business Logic Audit

**Reviewer**: WhatsApp Bot Auditor
**Date**: 2026-02-13
**Scope**: Full expense flow, includesSender logic, "todos menos X" pattern, multi-group disambiguation, settlement/balance calculation, WhatsApp commands, welcome flow, currency conversion

---

## Full Expense Flow Trace

1. **WhatsApp message received** → `POST /api/whatsapp/webhook` (`server/src/routes/whatsapp.js:239`)
2. **Signature verification** → `verifyWebhookSignature()` (`whatsapp.js:96-153`)
3. **Payload processing** → `processWebhook()` (`whatsapp.js:256-289`)
4. **Text handler** → `handleTextMessage()` (`whatsapp.js:326-501`)
5. **Pending state checks** → AI expense confirmation, pending expense group selection, pending group selection
6. **Command check** → `isCommand()` bypasses AI (`commandService.ts:431-433`)
7. **Multi-group check** → If >1 group and no activeGroupId, store pending and prompt (`whatsapp.js:442-449`)
8. **AI parsing** → `parseMessageWithAI()` (`aiService.ts:100-154`) using Gemini 2.0 Flash
9. **Confidence gate** → >=0.7 uses AI result, <0.7 falls back to regex (`whatsapp.js:473-486`)
10. **Mention resolution** → `resolveMentionsWithTracking()` with Fuse.js fuzzy matching (`mentionService.ts:180-214`)
11. **Confirmation request** → Stored as pending AI expense, user must respond "si" (`whatsapp.js:892-924`)
12. **Save on confirm** → `saveConfirmedAIExpense()` → `createExpense()` to Firestore (`whatsapp.js:660-674`)
13. **Balance recalculation** → On-demand via `/balance` command or dashboard (`commandService.ts:147-220`)

---

## 🔴 CRITICAL

### BIZ-01: AI Payments Skip Confirmation Flow — No User Confirmation Before Saving
- **File**: `server/src/routes/whatsapp.js:931-1022`
- **Description**: AI-parsed expenses go through a confirmation flow (pending → user says "si" → save). However, AI-parsed **payments** (`handleAIPayment`) are saved **immediately** without any user confirmation. A misinterpreted message could record an incorrect payment (wrong person, wrong amount, wrong direction) directly to Firestore. Payments directly affect balances and trigger notifications to other users.
- **Impact**: Wrong payments could silently corrupt balances and confuse the recipient who gets a notification.
- **Fix**: Add the same pending confirmation flow for AI payments as exists for AI expenses. Store as pending, show confirmation request, wait for "si"/"no".

### BIZ-02: Webhook Signature Verification Uses Non-Constant-Time Comparison
- **File**: `server/src/routes/whatsapp.js:146`
- **Description**: The code uses `signatureHash !== expectedHash` (string comparison) instead of `crypto.timingSafeEqual()`. The comment on line 145 says "Constant-time comparison to prevent timing attacks" but the implementation does NOT use constant-time comparison. This is a timing attack vulnerability.
- **Fix**: Replace with `crypto.timingSafeEqual()` using Buffer comparison.

### BIZ-03: In-Memory Pending State — Data Loss on Server Restart
- **File**: `server/src/services/commandService.ts:66-77`
- **Description**: All pending states (group selections, pending expenses, pending AI expenses) are stored in JavaScript `Map`s in process memory. If the server restarts or redeploys while a user has a pending AI expense confirmation, their expense data is lost silently. The user said "si" but the pending data is gone.
- **Impact**: User sends expense, gets confirmation request, server restarts, user responds "si" — nothing happens, no error message. The expense is silently lost.
- **Fix**: Store pending AI expenses in Firestore (or Redis) with TTL. At minimum, if the pending state is lost, send a user-friendly error message.

---

## 🟠 HIGH

### BIZ-04: Floating-Point Accumulation in Balance Calculation — Server vs Client Divergence
- **Files**: `server/src/services/commandService.ts:183-190` vs `client/stores/useUserStore.ts:133-140`
- **Description**: Both server and client calculate `shareAmount = expense.amount / splitUserIds.length` and accumulate via `+=`. For non-evenly-divisible amounts (e.g., $100 / 3 = $33.333...), repeated floating-point additions accumulate error. The server uses raw floats for `/balance` output. The client applies `Math.round()` at the end (`useUserStore.ts:166`), but the server does NOT round (`commandService.ts:217`).
- **Impact**: Balance numbers shown on WhatsApp (`/balance`) will differ slightly from dashboard numbers.
- **Fix**: Round the final net values in `calculateGroupBalances()` on the server side, matching the client's `Math.round()`.

### BIZ-05: Regex Payment Parser Only Detects Messages Starting With Keywords
- **File**: `server/src/utils/messageParser.ts:204-210`, `253-260`
- **Description**: Both `parsePaymentMessage` and `isPaymentMessage` use `normalized.startsWith(keyword)`. This means "le pagué 5000 @Maria" works, but "5000 pagué @Maria" or "hoy pagué 5000 @Maria" would NOT match. When AI is disabled or falls back to regex, natural variations fail silently and get treated as expenses.
- **Impact**: With AI off or failing, payment messages that don't start with the exact keyword would be incorrectly parsed as expenses.
- **Fix**: Use `.includes(keyword)` or better regex patterns for the fallback parser.

### BIZ-06: Race Condition in Balance Calculation — No Transactional Reads
- **File**: `server/src/services/commandService.ts:148-149`
- **Description**: `calculateGroupBalances` reads expenses and payments as two separate Firestore queries. Between these two reads, a new expense or payment could be created, leading to an inconsistent snapshot.
- **Impact**: Rare but possible incorrect balance shown via `/balance` when concurrent writes happen.
- **Fix**: Use a Firestore transaction or read both collections in a batch to ensure consistency.

### BIZ-07: Welcome Message Swallows First Real Message
- **File**: `server/src/routes/whatsapp.js:349-356`
- **Description**: When a new user sends their first message, the welcome message is sent and then `return` is called, discarding whatever the user actually sent. If a user's first message is "500 taxi", that expense is lost.
- **Impact**: Every new user's first message is silently discarded.
- **Fix**: After sending the welcome, continue processing the message (remove the `return` on line 356). Or at minimum, inform the user their message wasn't processed.

---

## 🟡 MEDIUM

### BIZ-08: `includesSender` Logic — Edge Case With "con" + Self-Mention
- **File**: `server/src/routes/whatsapp.js:860-863`
- **Description**: The code adds sender to split if `includesSender && !resolvedSplitAmong.includes(user.id)`. This correctly avoids double-counting if the user mentions themselves AND uses "con". However, the behavior is entirely dependent on AI prompt interpretation which could vary.
- **Fix**: Consider server-side normalization: if `includesSender` is true, always ensure sender is in the list (idempotently), and if sender's name appears in `splitAmong`, remove it before the `includesSender` check.

### BIZ-09: "todos menos X" Pattern — No Handling of "menos yo" With Excluded Others
- **File**: `server/src/routes/whatsapp.js:807-849`
- **Description**: The code handles `excludeFromSplit` and `includesSender: false` separately. If a user sends "100 taxi para todos menos Juan y menos yo", the AI should return `excludeFromSplit: ["Juan"]` and `includesSender: false`. The server code handles this correctly. However, the AI prompt doesn't have a combined example.
- **Fix**: Add a combined example to the AI prompt: "100 taxi todos menos Juan y yo" → `excludeFromSplit: ["Juan"], includesSender: false`.

### BIZ-10: Exchange Rate Fallback Values Are Severely Outdated
- **File**: `server/src/services/exchangeRateService.ts:28-32`
- **Description**: Static fallback rates are hardcoded: `USD: 850, EUR: 925, BRL: 170`. These are from late 2024. The Argentine peso devalues rapidly; by Feb 2026, these could be off by 50%+.
- **Impact**: Expenses in USD/EUR/BRL could be recorded at wildly incorrect ARS amounts when the API is down and cache is empty.
- **Fix**: Update fallback rates. Better yet, show a warning when using fallback rates.

### BIZ-11: No Upper Bound on Expense Amounts
- **File**: `server/src/routes/whatsapp.js:295-321`
- **Description**: `validateExpenseInput` checks `amount > 0` but has no upper bound. A user could accidentally type "50000000 taxi" (50M) and it would be saved. With AI parsing slang, a Gemini hallucination could return an inflated amount.
- **Fix**: Add a reasonable upper bound with confirmation for large amounts.

### BIZ-12: Deduplication Cache Unbounded Growth Potential
- **File**: `server/src/routes/whatsapp.js:58-74`
- **Description**: The `processedMessageIds` Map cleans up messages older than 1 hour every 15 minutes. Under high load, this could hold tens of thousands of entries.
- **Fix**: Use a Map with a size limit (e.g., max 10,000 entries) or switch to Redis.

### BIZ-13: AI Command Type Result Is Never Acted Upon
- **File**: `server/src/routes/whatsapp.js:469-491`, `server/src/services/aiService.ts:37-41`
- **Description**: The AI can return `type: "command"` (e.g., if user types "quiero ver mi balance"), but the webhook handler doesn't have a case for `aiResult.type === 'command'`. These results fall through to regex fallback.
- **Fix**: Add handling for `aiResult.type === 'command'` that calls `handleCommand()`.

### BIZ-14: Client and Server Balance Calculations Could Diverge on Members List
- **File**: `server/src/services/commandService.ts:148` vs `client/stores/useUserStore.ts:96-103`
- **Description**: The server reads members from `getGroupMembers(groupId)`. The client uses `this.users` from the user store. If a member is added/removed between calculations, results could differ. Also, if a user is deleted but their ID is still in an expense's `splitAmong`, the server code silently falls back to "everyone" (`commandService.ts:175-177`).
- **Fix**: Define a clear policy for removed users in existing expenses. Document the edge case.

---

## 🟢 LOW

### BIZ-15: `categorizeFromDescription` Duplicated
- **Files**: `server/src/routes/whatsapp.js:1028-1064` vs `server/src/utils/messageParser.ts:53-92`
- **Description**: Two nearly identical category keyword lists. The `whatsapp.js` version has additional Argentine slang keywords.
- **Fix**: Extract to a shared utility function.

### BIZ-16: `/borrar` Command Redirects to Dashboard — Dead `deleteExpenseCommand` Code
- **Files**: `server/src/routes/whatsapp.js:551-554`, `server/src/services/commandService.ts:325-401`
- **Description**: The `/borrar` command just sends a message redirecting to the dashboard. But `commandService.ts` has a full `deleteExpenseCommand` implementation that's never called.
- **Fix**: Either wire up the delete command or remove the dead code.

### BIZ-17: `PendingAIExpense` Interface Has Vestigial `unresolvedNames` Field
- **File**: `server/src/services/commandService.ts:53`
- **Description**: The `PendingAIExpense.expense` interface includes `unresolvedNames: string[]` but when `setPendingAIExpense` is called, the field is never included. It's vestigial from before the "reject on unresolved" logic was added.
- **Fix**: Remove the `unresolvedNames` field from the interface.

### BIZ-18: Regex Parser Doesn't Support Argentine Slang
- **File**: `server/src/utils/messageParser.ts:8-48`
- **Description**: The regex fallback parser only matches `^(\d+)\s+(.+)$`. It doesn't understand "5 lucas", "5k", "mangos", or any Argentine slang the AI handles.
- **Fix**: Acceptable since AI is the primary parser. Document that regex fallback only handles basic "amount description" format.

### BIZ-19: Phone Number Logging Exposes PII
- **File**: `server/src/services/whatsappService.ts:89`
- **Description**: Full phone numbers logged in console output.
- **Fix**: Mask phone numbers in logs.

---

## 🔵 PRE-MERGE

### BIZ-PM1: AI Payments Must Have Confirmation Flow Before Migration
Same as BIZ-01. This is the highest priority pre-merge fix. Any AI-parsed payment goes directly to Firestore without user confirmation.

### BIZ-PM2: Server Balance Rounding Must Match Client
Same as BIZ-04. Before migration, ensure `/balance` output on WhatsApp matches the dashboard. Apply `Math.round()` to the server-side net calculations.

### BIZ-PM3: Update Fallback Exchange Rates
Same as BIZ-10. The fallback rates are ~14 months old. Update them to current values before going live.

### BIZ-PM4: Timing-Safe Signature Comparison
Same as BIZ-02. Fix the webhook signature verification to use `crypto.timingSafeEqual()` before production.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 4 |
| 🟡 MEDIUM | 7 |
| 🟢 LOW | 5 |
| 🔵 PRE-MERGE | 4 |
| **Total** | **23** |
