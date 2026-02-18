# Infrastructure & Deployment Audit

**Reviewer**: Infrastructure Reviewer
**Date**: 2026-02-13
**Scope**: Firebase config, Firestore indexes, Render deployment, ngrok setup, env variable handling, build pipeline, CI/CD, scripts folder

---

## 🔴 CRITICAL

### INFRA-01: Real Secrets in `.env` Files on Disk
- **Files**: `.env` (lines 9-29, 42), `server/.env` (lines 7-17, 25), `client/.env` (lines 1-6)
- **Description**: While `.env` files are correctly in `.gitignore` and NOT tracked by git (confirmed via `git ls-files`), the actual files on disk contain:
  - Firebase service account private key (full RSA key)
  - WhatsApp API token
  - WhatsApp app secret
  - Gemini API key
  - 16 real user phone numbers
- **Risk**: If the repo is ever accidentally pushed with `.gitignore` removed, or if the machine is compromised, all secrets are exposed. The root `.env` and `server/.env` contain identical secrets — redundant duplication increases exposure surface.
- **Fix**: Consolidate to `server/.env` only for server secrets and `client/.env` for client config. Remove the root `.env`.

### INFRA-02: `server/.env` Contains Stray Curl Command with Credentials
- **File**: `server/.env:30-36`
  ```
  curl -X POST "https://graph.facebook.com/v21.0/906522075885946/register" \
    -H "Authorization: Bearer EAA9535wgq..." \
    -H "Content-Type: application/json" \
    -d '{"messaging_product": "whatsapp", "pin": "123456"}'
  ```
- **Description**: This is NOT valid .env syntax. `dotenv` will silently ignore these lines, but they contain a hardcoded WhatsApp API token in plaintext and a PIN ("123456"). This appears to be a debugging artifact pasted directly into the .env file.
- **Fix**: Remove the curl command from `server/.env` immediately.

### INFRA-03: `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true` Set in Both Env Files
- **Files**: `.env:42`, `server/.env:22`
- **Description**: While the code at `server/src/routes/whatsapp.js:96-111` has a proper safeguard (only skips in `NODE_ENV=development`, blocks and logs error if in production), having this flag default to "true" is dangerous. If someone deploys and forgets to set `NODE_ENV=production`, the webhook signature verification bypass will cause errors but the pattern is dangerous.
- **Fix**: Remove from both env files. Only set explicitly when needed during local development. Add to `.env.example` as `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=false`.

### INFRA-04: Three `.env` Files with Duplicated/Divergent Secrets
- **Files**: `.env`, `server/.env`, `client/.env`
- **Description**: The root `.env` and `server/.env` contain largely the same secrets but with differences:
  - Root `.env` uses `FIREBASE_API_KEY` naming; `client/.env` uses `NUXT_PUBLIC_FIREBASE_API_KEY`
  - Root `.env` lacks `GEMINI_API_KEY`; `server/.env` has it
  - Root `.env` lacks the curl command; `server/.env` has it
  - `server/.env` has `AI_ENABLED`, `AI_CONFIDENCE_THRESHOLD`, `AI_TIMEOUT_MS`; root `.env` does not
  - `nuxt.config.ts` reads from `process.env.FIREBASE_API_KEY` (non-prefixed), while `client/.env` uses `NUXT_PUBLIC_FIREBASE_API_KEY` (prefixed) — confusing dual-path
- **Fix**: Standardize: use only `NUXT_PUBLIC_*` prefix in `client/.env`, remove the root `.env` entirely. Server uses only `server/.env`.

---

## 🟠 HIGH

### INFRA-05: Scripts Can Run Against Production Firestore with No Guardrails
- **Files**:
  - `scripts/add-test-expenses.js` — writes test expenses to Firestore
  - `scripts/test-settlements.js` — deletes and recreates data in `demo-group`
  - `scripts/check-data.js` — reads all collections
  - `server/scripts/seedUsers.ts:1-19` — **DESTRUCTIVE: deletes ALL users and groups**
  - `server/scripts/seedDemoExpenses.ts` — writes to Firestore
  - `server/scripts/checkSettlements.ts` — reads from Firestore
  - `server/scripts/resetActiveGroupId.ts` — modifies user data
  - `server/scripts/updateUserEmail.ts` — modifies user data
  - `server/scripts/updateGroupNames.ts` — modifies group data
- **Description**: All scripts use `server/.env` which points to the PRODUCTION Firestore project (`viaje-grupo`). There is no environment separation. Running `node scripts/test-settlements.js clear` or `npx tsx scripts/seedUsers.ts` will modify/delete REAL production data. `seedUsers.ts` has a confirmation prompt ("Type DELETE ALL") which is good, but other scripts have no safeguard.
- **Fix**:
  1. Add a `NODE_ENV` check at the top of each script: refuse to run if `NODE_ENV=production`
  2. Add a confirmation prompt for any write/delete operations
  3. Consider using a separate Firebase project for dev/staging
  4. Move legacy `scripts/` (root-level) to `server/scripts/` for consistency

### INFRA-06: CORS is Wide Open
- **File**: `server/src/index.js:25`
- **Description**: `app.use(cors())` with no origin restriction. Any origin can make requests to the API.
- **Fix**: Configure CORS with specific allowed origins:
  ```js
  app.use(cors({ origin: ['https://textthecheck.app', 'http://localhost:3000'] }))
  ```

### INFRA-07: No CI/CD Pipeline Exists
- **Description**: No `.github/workflows/` or any CI configuration found. There is no automated linting, type checking (`typecheck` script exists but isn't automated), testing (no test framework installed), build verification, or deploy automation. Any push to main could include broken code.
- **Fix**: Add a minimal GitHub Actions workflow:
  ```yaml
  on: [push, pull_request]
  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: npm install
        - run: npm run typecheck
        - run: npm run build
  ```

---

## 🟡 MEDIUM

### INFRA-08: Server Build Script is Fragile — Manual `cp` for JS Files
- **File**: `server/package.json:10`
  ```json
  "build": "tsc && mkdir -p dist/routes && cp src/*.js dist/ && cp src/routes/*.js dist/routes/"
  ```
- **Description**: The server has a mix of `.ts` and `.js` files. `tsc` compiles `.ts` files to `dist/`, but `.js` files must be manually copied. If new `.js` files are added in new subdirectories, the build command must be manually updated.
- **Fix**: Either convert all `.js` files to `.ts` (preferred), use a bundler like `tsup`, or use `tsc --allowJs`.

### INFRA-09: `nuxt.config.ts` Reads Non-Prefixed Env Vars for runtimeConfig
- **File**: `client/nuxt.config.ts:59-67`
- **Description**: The config has explicit `process.env.FIREBASE_API_KEY` fallbacks, but `client/.env` uses `NUXT_PUBLIC_FIREBASE_API_KEY`. Nuxt 3 auto-maps `NUXT_PUBLIC_*` to `runtimeConfig.public.*`, creating ambiguity about which env var takes effect.
- **Fix**: Remove the explicit `process.env.*` assignments and let Nuxt's automatic `NUXT_PUBLIC_*` mapping handle it.

### INFRA-10: Firestore Indexes — Verified Match Actual Queries
- **File**: `firestore.indexes.json`
- **Description**: Defined indexes:
  1. `expenses` (userId + timestamp desc)
  2. `expenses` (groupId + timestamp desc)
  3. `payments` (groupId + createdAt desc)
- **Status**: All compound queries in code match defined indexes. No missing indexes detected. **This is a positive finding.**

### INFRA-11: Missing `client/.env.example`
- **Description**: New developers setting up the client won't know what env vars are needed. Root `.env.example` and `server/.env.example` exist, but no `client/.env.example`.
- **Fix**: Create `client/.env.example` with placeholder values for all `NUXT_PUBLIC_*` vars.

### INFRA-12: Root `.env.example` Mixes Client and Server Vars
- **File**: `.env.example`
- **Description**: Contains both client Firebase config AND server-side secrets. Since the project uses separate `client/.env` and `server/.env`, the root `.env.example` is confusing.
- **Fix**: Remove root `.env.example`. Keep only `client/.env.example` and `server/.env.example`.

---

## 🟢 LOW

### INFRA-13: Render Cold Start May Delay Webhook Responses
- **File**: `server/src/routes/health.js`
- **Description**: The health endpoint exists (good for Render health checks), but Render free-tier services spin down after inactivity. WhatsApp expects webhook responses within ~5 seconds. Cold start could exceed this.
- **Fix**: Ensure Render is configured with a health check on `/api/health`. Consider upgrading to paid plan for always-on service, or add a cron job pinging the health endpoint every 5 minutes.

### INFRA-14: ngrok Script Has No Domain Pinning
- **File**: `server/scripts/ngrok.mjs`
- **Description**: The script starts ngrok with `ngrok http <port>`, generating a random subdomain each time. WhatsApp webhook URL must be updated every restart.
- **Fix**: Use `--domain=your-fixed-domain.ngrok-free.app` for a consistent URL during development.

### INFRA-15: Hardcoded Firestore Document IDs in Scripts
- **Files**: `scripts/add-test-expenses.js:20-24`, `scripts/test-settlements.js:21-24`
- **Description**: Contain hardcoded Firestore document IDs like `mW2rp5h0qeSvojlVoaLr`. If the database is reseeded, these IDs will be stale.
- **Fix**: Have scripts look up users by name/phone instead of hardcoded IDs.

### INFRA-16: Root-Level `scripts/` Folder Contains Legacy CommonJS Scripts
- **Files**: `scripts/check-data.js`, `scripts/add-test-expenses.js`, `scripts/test-settlements.js`
- **Description**: These use `require()` syntax (CommonJS) while the rest of the project uses ESM. They duplicate functionality now available in the better-structured `server/scripts/` (TypeScript, idempotent, with confirmation prompts).
- **Fix**: Delete the root `/scripts/` folder. The `server/scripts/` versions are superior replacements.

---

## 🔵 PRE-MERGE

### INFRA-PM1: Remove Stray Curl Command from `server/.env`
See INFRA-02. Must be cleaned before any migration/deployment.

### INFRA-PM2: Consolidate Env Files
See INFRA-04. Remove root `.env`, standardize on `client/.env` + `server/.env` only.

### INFRA-PM3: Remove `WHATSAPP_SKIP_SIGNATURE_VERIFICATION=true` from Env Files
See INFRA-03. Should not be a default.

### INFRA-PM4: Ensure `server/.env.example` Documents All Required Vars
The `server/.env.example` is missing:
- `GEMINI_API_KEY`
- `AI_ENABLED`
- `AI_CONFIDENCE_THRESHOLD`
- `AI_TIMEOUT_MS`
- `WHATSAPP_SKIP_SIGNATURE_VERIFICATION`

---

## Positives

- `.gitignore` is comprehensive and well-structured — .env files are NOT in git
- Firestore rules are thorough with proper validation functions
- Firestore indexes match actual compound queries (no missing indexes)
- Health check endpoint exists for Render
- Signature verification has production safeguard (blocks + logs if flag is on in prod)
- `seedUsers.ts` has destructive operation confirmation prompt
- Workspaces are properly configured in root `package.json`
- `server/scripts/` TypeScript scripts are well-structured and idempotent

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 4 |
| 🟠 HIGH | 3 |
| 🟡 MEDIUM | 5 |
| 🟢 LOW | 4 |
| 🔵 PRE-MERGE | 4 |
| **Total** | **20** |
