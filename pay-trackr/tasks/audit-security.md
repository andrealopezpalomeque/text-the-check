# Security & Secrets Audit - PayTrackr

**Date:** 2026-02-13
**Auditor:** Security Subagent
**Scope:** Full codebase (`/web` + `/server`) - secrets, auth, Firestore rules, API endpoints, PII

---

## 1. Leaked / Hardcoded Credentials

### 1a. Sentry DSN Hardcoded in Service Worker
- **Severity:** HIGH
- **File:** `web/public/firebase-messaging-sw.js:9`
- **Finding:** Sentry DSN is hardcoded as a string literal:
  ```js
  const SENTRY_DSN = 'https://ca4d274b77449c12c943bc986c31cc36@o4510864892624896.ingest.us.sentry.io/4510864895508480';
  ```
  This exposes the Sentry project key in a publicly-accessible file. While Sentry DSNs are considered semi-public (only used for sending events), anyone can send fake/spam error events to this project, potentially filling quotas or injecting misleading data.
- **Fix:** Use Sentry's `allowedDomains` feature or set up rate limiting in Sentry's project settings. Alternatively, remove Sentry from the SW and rely on the main app's Sentry instance. If keeping it, consider using environment variables injected at build time instead of hardcoding.

### 1b. Firebase Config Values Hardcoded in `nuxt.config.ts`
- **Severity:** LOW
- **File:** `web/nuxt.config.ts:52-56`
- **Finding:** Several Firebase config values are hardcoded rather than sourced from environment variables:
  ```ts
  firebaseAuthDomain: "pay-tracker-7a5a6.firebaseapp.com",
  firebaseStorageBucket: "pay-tracker-7a5a6.appspot.com",
  firebaseMessagingSenderId: "16390920244",
  firebaseAppId: "1:16390920244:web:adc5a4919d9dd457705261",
  ```
  Firebase client-side config is designed to be public, but hardcoding these makes it harder to maintain separate dev/staging/prod configurations.
- **Fix:** Move these to environment variables for consistency, even though they're not secrets per se.

### 1c. Default WhatsApp Verify Token Fallback
- **Severity:** HIGH
- **File:** `server/webhooks/wp_webhook.js:12`
- **Finding:** The webhook verification token has a hardcoded fallback:
  ```js
  const VERIFY_TOKEN = process.env.WP_VERIFY_TOKEN || 'myself_testing';
  ```
  If `WP_VERIFY_TOKEN` is not set in production, the webhook verification endpoint accepts `myself_testing` as a valid token. Any attacker who finds this default can register their own webhook URL or send crafted verification requests.
- **Fix:** Remove the fallback. If the env var is not set, the server should refuse to start or log a critical warning. Example:
  ```js
  const VERIFY_TOKEN = process.env.WP_VERIFY_TOKEN;
  if (!VERIFY_TOKEN) throw new Error('WP_VERIFY_TOKEN must be set');
  ```

### 1d. Sentry `sendDefaultPii: true` Enabled
- **Severity:** MEDIUM
- **File:** `server/instrument.js:5`
- **Finding:** `sendDefaultPii: true` instructs Sentry to attach personally identifiable information (IP addresses, cookies, user data) to error reports. For a personal finance app, this means financial data could leak into Sentry error events.
- **Fix:** Set `sendDefaultPii: false` (or remove the line since `false` is the default). If you need user context in Sentry, use `Sentry.setUser()` with only the user ID (no email, no financial data).

### 1e. Google Site Verification Token in HTML
- **Severity:** INFO
- **File:** `web/nuxt.config.ts:145`
- **Finding:** `E0U6Yf1iG222FwlRLisvf7JLYZLZQnT8CLJ3QKo4tjQ` - This is a Google Search Console verification token. Not a security risk per se, but confirms ownership of the domain if someone is doing reconnaissance.
- **Fix:** No action needed. Standard practice.

---

## 2. Firestore Security Rules

### 2a. No Firestore Security Rules File Found
- **Severity:** CRITICAL (PRE-MERGE BLOCKER)
- **Files checked:** `**/firestore.rules`, `**/*.rules`, `web/firebase.json`
- **Finding:** There is **no `firestore.rules` file** anywhere in the repository. The `firebase.json` only configures hosting, not Firestore. This means either:
  1. Rules are configured directly in the Firebase Console (not version-controlled), or
  2. The database is using the default permissive rules (`allow read, write: if true`)

  For a **personal finance application**, this is the most critical finding. Without proper rules, any authenticated user could potentially read/write ANY other user's financial data by crafting Firestore queries directly (bypassing the app's UI).
- **Impact:** Complete data breach of all users' financial information.
- **Fix:**
  1. Export current rules from Firebase Console immediately
  2. Create a `firestore.rules` file in the repo with rules like:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /payment2/{docId} {
           allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
           allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         }
         match /recurrent/{docId} {
           allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
           allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         }
         // ... similar for all collections
       }
     }
     ```
  3. Deploy rules via `firebase deploy --only firestore:rules`
  4. Add rules deployment to CI/CD

---

## 3. API Endpoint Authentication

### 3a. WhatsApp Webhook POST Endpoint - No Request Signature Validation
- **Severity:** HIGH
- **File:** `server/webhooks/wp_webhook.js:148`
- **Finding:** The `POST /webhook` endpoint does **not validate the `X-Hub-Signature-256` header** from Meta/WhatsApp. The WhatsApp Business API sends an HMAC-SHA256 signature with every webhook payload. Without verifying it, the endpoint accepts forged requests from anyone.

  An attacker could:
  - Send fake expense messages on behalf of any linked phone number
  - Trigger the `VINCULAR` flow with a known code to link to another user's account
  - Invoke `ANALISIS` or `RESUMEN` for any linked phone number to retrieve financial data
- **Fix:** Validate the `X-Hub-Signature-256` header using the app secret:
  ```js
  import crypto from 'crypto';

  function verifyWebhookSignature(req, res, buf) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return res.sendStatus(401);
    const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(buf).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.sendStatus(401);
    }
  }

  app.use(express.json({ verify: verifyWebhookSignature }));
  ```

### 3b. No Rate Limiting on Webhook Endpoint
- **Severity:** MEDIUM
- **File:** `server/webhooks/wp_webhook.js` (entire server)
- **Finding:** No rate limiting middleware (e.g., `express-rate-limit`) is configured. The server is vulnerable to abuse - repeated requests could trigger excessive Firestore reads/writes and Gemini API calls (which cost money).
- **Fix:** Add `express-rate-limit` middleware, especially for the webhook POST endpoint.

### 3c. No CORS or Helmet Middleware
- **Severity:** LOW
- **File:** `server/webhooks/wp_webhook.js` (entire server)
- **Finding:** No `helmet` or `cors` middleware. While the server only serves webhook endpoints (not browser-facing), adding `helmet` is a low-cost defense-in-depth measure.
- **Fix:** `npm install helmet && app.use(helmet())` - quick win for security headers.

---

## 4. Input Validation

### 4a. WhatsApp Message Text Not Sanitized Before Firestore Write
- **Severity:** MEDIUM
- **File:** `server/webhooks/wp_webhook.js:867-887`
- **Finding:** The `title` from `parseExpenseMessage()` is written directly to Firestore without sanitization. While Firestore itself is not vulnerable to injection (it's not SQL), the title is later rendered in the Vue frontend. If the frontend renders it using `v-html` (rather than `v-text` or mustache interpolation), this becomes an XSS vector.

  The `parseExpenseMessage()` function at line 919 does basic parsing but does not sanitize HTML or special characters. A crafted WhatsApp message like `$100 <img src=x onerror=alert(1)> #otros` would store the HTML in Firestore.
- **Fix:** Sanitize the `title` and `description` fields before writing to Firestore:
  ```js
  function sanitize(str) { return str.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }
  ```
  Also verify the Vue frontend uses `{{ }}` (not `v-html`) when rendering these fields.

### 4b. Gemini AI Response Parsed Without Strict Validation
- **Severity:** MEDIUM
- **File:** `server/handlers/GeminiHandler.js:88-95`, `142-149`, `196-203`
- **Finding:** AI responses are cleaned with a basic regex (`replace(/```json\n?/g, '')`) and then `JSON.parse()`'d. The parsed object is used directly for field values like `amount`, `recipientName`, `recipientCBU`, etc. If the AI hallucinates or is prompt-injected (via a crafted image/audio), malicious values could be written to Firestore.

  Specifically, `transferData.amount` is passed through `parseFloat()` (good), but `recipientName`, `recipientCBU`, `recipientAlias`, `recipientBank`, `concept` are stored as-is without type/length validation.
- **Fix:** Validate each field from the AI response:
  - Ensure `amount` is a positive number
  - Ensure string fields are strings with a max length (e.g., 200 chars)
  - Reject objects/arrays in unexpected positions
  - Add a schema validation layer for AI responses

### 4c. Phone Number Used as Firestore Document ID Without Validation
- **Severity:** LOW
- **File:** `server/webhooks/wp_webhook.js:311`
- **Finding:** Phone number from WhatsApp is used directly as a Firestore document ID:
  ```js
  await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phoneNumber).set({...})
  ```
  Firestore document IDs have restrictions (no `/`, max 1500 bytes). WhatsApp phone numbers should always be numeric, but this is not validated. A malformed phone number could cause unexpected behavior.
- **Fix:** Validate that `phoneNumber` matches expected format (e.g., `/^\d{10,15}$/`).

---

## 5. Committed Secrets / .gitignore

### 5a. .gitignore Configuration - Generally Good
- **Severity:** INFO
- **File:** `.gitignore`
- **Finding:** The `.gitignore` properly excludes:
  - `.env` and `.env.*` files (with `!.env.example` exception)
  - `service-account.json`
  - `**/scripts/*.json` and `**/scripts/*.txt`
  - `.firebase` directory

  No `.env` files or service account files were found in the working tree. Git history check found no previously committed secrets.
- **Fix:** No action needed. Consider also adding `*.pem`, `*.key`, and `**/credentials*` patterns as defense-in-depth.

### 5b. `package-lock.json` Not in `.gitignore` but Untracked
- **Severity:** INFO
- **Finding:** `package-lock.json` shows as untracked in git status. The `web/yarn.lock` is gitignored but there's no mention of the root-level `package-lock.json`. This is a housekeeping item, not a security issue.

---

## 6. WhatsApp Webhook Security

### 6a. No Signature Verification (Duplicate of 3a)
- **Severity:** HIGH
- See finding 3a above.

### 6b. Verification Token Weakness
- **Severity:** MEDIUM
- **File:** `server/webhooks/wp_webhook.js:12,131-144`
- **Finding:** The GET `/webhook` verification only checks `hub.verify_token` against a static token. This is standard for Meta webhook verification, but the token should be cryptographically random (not `myself_testing`). The GET endpoint also returns the `hub.challenge` value directly.
- **Fix:** Ensure production uses a strong, random token. The challenge echo-back is required by Meta's protocol, so that's correct.

### 6c. Linking Code Brute-Force Risk
- **Severity:** MEDIUM
- **File:** `server/webhooks/wp_webhook.js:261-336`, `web/utils/odm/schemas/whatsappLinkSchema.ts:37-43`
- **Finding:** The linking code is 6 characters from a 31-character alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), giving ~887 million combinations. The code is valid for 10 minutes. Without rate limiting on the `VINCULAR` command (via WhatsApp), an attacker who knows a code was recently generated could attempt brute force. However, this is somewhat mitigated by WhatsApp's own rate limits on message sending.
- **Fix:** Low risk due to WhatsApp rate limits, but consider:
  - Adding a max-attempts counter per phone number in Firestore
  - Reducing code validity to 5 minutes
  - Invalidating code after 3 failed attempts

---

## 7. PII & Data Storage Concerns

### 7a. Phone Numbers Stored in Plain Text
- **Severity:** MEDIUM
- **Collection:** `whatsappLinks` (phone number as document ID)
- **Finding:** Phone numbers are stored as plain text in Firestore and used as document IDs. Phone numbers are PII under GDPR and Argentine data protection law (Ley 25.326). If the database is compromised, phone numbers are immediately exposed.
- **Fix:** For a personal project this is acceptable, but for production consider hashing phone numbers for document IDs while storing the number encrypted in a field.

### 7b. Banking Information Stored from Transfer Receipts
- **Severity:** HIGH (PRE-MERGE)
- **File:** `server/webhooks/wp_webhook.js:1094-1100`
- **Finding:** When users send transfer receipt images/PDFs, the following banking PII is extracted and stored in Firestore:
  ```js
  const recipient = {
    name: transferData.recipientName || null,
    cbu: transferData.recipientCBU || null,      // Bank account number!
    alias: transferData.recipientAlias || null,
    bank: transferData.recipientBank || null
  };
  ```
  CBU (Clave Bancaria Uniforme) is a 22-digit Argentine bank account identifier. Storing this in Firestore means:
  - If Firestore rules are misconfigured (see finding 2a), any user could access other users' banking details
  - The data persists indefinitely without a retention policy
- **Fix:**
  1. First priority: Fix Firestore security rules (finding 2a)
  2. Consider whether storing the full CBU is necessary - truncating to last 4 digits may suffice
  3. Add a data retention policy and cleanup mechanism
  4. Document what PII is collected (privacy policy)

### 7c. Audio Transcriptions Stored
- **Severity:** LOW
- **File:** `server/webhooks/wp_webhook.js:1264`
- **Finding:** Audio transcriptions from Gemini are stored in `audioTranscription` field. These could contain sensitive information the user mentioned verbally.
- **Fix:** Consider not persisting transcriptions after payment creation, or adding a TTL/cleanup.

### 7d. User Financial Data Sent to Gemini API
- **Severity:** MEDIUM
- **File:** `server/webhooks/wp_webhook.js:800-811`, `server/handlers/GeminiHandler.js:229-261`
- **Finding:** For the `ANALISIS` command, 3 months of payment data (amounts, categories, recurring payment details) are sent to Google's Gemini API. For weekly summaries, aggregate stats are sent. This means user financial data leaves the Firebase ecosystem and goes to Google's AI service.
- **Fix:** Document this in the privacy policy. Consider adding a user opt-in toggle for AI features. Review Google's Gemini API data usage/retention policies.

---

## 8. Server Infrastructure

### 8a. GitHub Actions Workflows - Missing SENTRY_DSN
- **Severity:** LOW
- **Files:** `.github/workflows/send-notifications.yml`, `.github/workflows/send-weekly-summary.yml`
- **Finding:** Neither workflow passes `SENTRY_DSN` as an environment variable, but the server code imports `@sentry/node` and calls `Sentry.captureException()`. Without the DSN, Sentry silently does nothing - errors in cron jobs go unreported.
- **Fix:** Add `SENTRY_DSN: ${{ secrets.SENTRY_DSN }}` to both workflow env blocks.

### 8b. Weekly Summary Full-Scans All Recurrents
- **Severity:** LOW
- **File:** `server/scripts/send-weekly-summary.js:83`
- **Finding:** `await db.collection('recurrent').get()` fetches ALL recurrent templates across ALL users. This is a full collection scan with no userId filter. Currently it's a small dataset, but as users grow, this becomes a cost and performance concern - and it means the cron script has access to all users' data by design.
- **Fix:** This is acceptable for a cron script running with admin credentials, but note that the admin SDK bypasses security rules by design. No immediate security fix needed.

### 8c. Test Notification Script Sends to ALL Tokens
- **Severity:** LOW
- **File:** `server/scripts/test-notifications.js:42-44`
- **Finding:** The test script queries all enabled FCM tokens regardless of userId and sends test notifications to everyone. This is a testing tool, not a production concern, but could accidentally spam all users.
- **Fix:** Add a safeguard - require an explicit user ID or `--confirm-all` flag.

---

## Summary by Severity

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 1 | 2a (No Firestore rules in repo) |
| HIGH | 4 | 1c (Default verify token), 3a/6a (No webhook signature), 1a (Sentry DSN hardcoded), 7b (Banking PII storage) |
| MEDIUM | 6 | 1d (sendDefaultPii), 3b (No rate limiting), 4a (Unsanitized input), 4b (AI response validation), 6c (Linking brute force), 7a (Phone numbers plain text), 7d (Data sent to Gemini) |
| LOW | 6 | 1b (Firebase config hardcoded), 3c (No helmet), 4c (Phone as doc ID), 7c (Transcriptions stored), 8a (Missing SENTRY_DSN), 8b/8c (Script concerns) |

## Top 3 Priorities Before Merge

1. **Verify and version-control Firestore security rules** (2a) - This is the single most important fix. Without confirmed rules, the entire financial dataset is potentially exposed.
2. **Add WhatsApp webhook signature validation** (3a) - Without this, anyone can forge webhook requests and create payments in any linked user's account.
3. **Remove default verify token fallback** (1c) - Quick fix that eliminates a credential weakness.
