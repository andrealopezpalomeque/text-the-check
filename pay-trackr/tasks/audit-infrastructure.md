# Infrastructure & Deployment Audit

**Reviewer**: Infrastructure & Deployment Reviewer
**Date**: 2026-02-13
**Scope**: Firebase config, CI/CD, build scripts, env vars, PWA, dependencies, deployment architecture

---

## 1. Firebase Configuration

### `web/firebase.json`

```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "**/scripts/**"]
  }
}
```

**Findings:**

- **🟠 HIGH** - **No SPA rewrite rule configured** (`web/firebase.json:1-11`).
  Firebase Hosting for an SPA/hybrid Nuxt app needs a rewrite rule so that deep-linked URLs (e.g., `/fijos`, `/summary`) resolve correctly instead of returning 404. The `nuxt generate` output includes prerendered pages, but SPA-mode routes (`/fijos`, `/one-time`, etc.) need a fallback.
  **Fix**: Add `"rewrites": [{ "source": "**", "destination": "/200.html" }]` or `"/index.html"` depending on what Nuxt generate outputs. Verify the fallback file exists in `.output/public`.

- **🟡 MEDIUM** - **No custom headers for security** (`web/firebase.json`).
  No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Strict-Transport-Security` headers configured.
  **Fix**: Add a `"headers"` section to `firebase.json` with standard security headers.

- **🟡 MEDIUM** - **No caching headers for static assets** (`web/firebase.json`).
  Firebase Hosting defaults to reasonable caching, but hashed assets (JS/CSS from Nuxt build) could benefit from long `Cache-Control: max-age` headers, while HTML should have short TTLs.
  **Fix**: Add `"headers"` rules for `**/*.js` / `**/*.css` with `max-age=31536000, immutable` and for `**/*.html` with `max-age=0, must-revalidate`.

### `web/.firebaserc`

```json
{ "projects": { "default": "pay-tracker-7a5a6" } }
```

- **🟢 LOW** - Single project alias. No staging/preview environment configured. Acceptable for a personal project, but pre-merge with "Text the Check" should consider a staging alias.

---

## 2. Firestore Indexes

- **🟠 HIGH** - **No `firestore.indexes.json` file found anywhere in the repo**.
  Composite indexes are likely required for queries filtering on `userId` + sorting by `dueDate`, `createdAt`, etc. Without an indexes file, index configuration only exists in the Firebase Console and is not version-controlled.
  **Fix**: Export indexes from the Firebase Console via `firebase firestore:indexes > firestore.indexes.json` and commit the file. Add it to the `firebase.json` config so `firebase deploy` manages them.

- **🟠 HIGH** - **No `firestore.rules` file in the repository**.
  Security rules are a critical part of Firestore security. Without version-controlled rules, changes are only tracked in the Firebase Console and can be accidentally overwritten.
  **Fix**: Export current rules via `firebase firestore:rules` and commit them. Add `"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }` to `firebase.json`.

---

## 3. CI/CD Pipeline

### `.github/workflows/send-notifications.yml`

- **🟢 LOW** - Well-structured cron workflow. Uses `actions/checkout@v4` and `actions/setup-node@v4` (current). Node 20 is appropriate. `npm ci` is correct for CI. Manual `workflow_dispatch` trigger is a good practice.

- **🟡 MEDIUM** - **SENTRY_DSN not passed as env var to cron scripts** (`.github/workflows/send-notifications.yml:54-56`, `.github/workflows/send-weekly-summary.yml:33-35`).
  The server scripts import `instrument.js` which reads `process.env.SENTRY_DSN`, but neither workflow passes this secret. Sentry error tracking is silently disabled in GitHub Actions cron jobs.
  **Fix**: Add `SENTRY_DSN: ${{ secrets.SENTRY_DSN }}` to the `env` block in both workflow files.

- **🟡 MEDIUM** - **Cron scripts use `--import ./instrument.js` in `package.json` but GH Actions runs `node scripts/send-reminders.js` directly** (`.github/workflows/send-notifications.yml:57`).
  The workflow runs `node scripts/send-reminders.js` without the `--import ./instrument.js` flag, meaning Sentry instrumentation is not loaded in production cron runs even if SENTRY_DSN were set.
  **Fix**: Use `npm run reminders:morning` / `npm run reminders:evening` / `npm run weekly-summary` instead of raw `node` commands, or add the `--import` flag.

### Missing CI/CD

- **🔴 CRITICAL** - **No CI/CD pipeline for the web frontend**.
  There is no GitHub Actions workflow for building, testing, linting, or deploying the web app. Deployment happens manually via `npm run deploy` (`nuxt generate && firebase deploy`). This is fragile and error-prone.
  **Fix**: Create a `.github/workflows/deploy-web.yml` that runs on push to `main`, executes `nuxt generate`, and deploys to Firebase Hosting. Consider using `firebase-tools` GitHub Action or `firebase deploy --token`.

- **🟠 HIGH** - **No automated testing in any workflow**.
  Neither the existing cron workflows nor any other workflow runs tests, linting, or type-checking. No test framework is installed (no vitest, jest, cypress, playwright in any package.json).
  **Fix**: Pre-merge, consider adding at minimum a lint check (`eslint`) for the web package. Add a test framework post-merge.

- **🟠 HIGH** - **No branch protection or PR checks implied by workflows**.
  All workflows only run on `schedule` or `workflow_dispatch`. There are no `pull_request` or `push` triggered workflows, meaning PRs can be merged without any automated validation.
  **Fix**: Add a CI workflow triggered on `pull_request` with at least lint and build checks.

---

## 4. Build Scripts

### `web/package.json` Scripts

```json
{
  "build": "nuxt build",
  "dev": "nuxt dev",
  "generate": "nuxt generate",
  "deploy": "nuxt generate && firebase deploy",
  "preview": "nuxt preview",
  "postinstall": "nuxt prepare"
}
```

- **🟡 MEDIUM** - `deploy` script uses `nuxt generate` (static generation) but `nuxt.config.ts` defines `routeRules` with both `prerender: true` and `ssr: false`. This is a hybrid approach. Verify that `nuxt generate` correctly outputs SPA fallback pages for `ssr: false` routes.

- **🟢 LOW** - No lint or type-check scripts defined in `package.json` despite having `.eslintrc` and TypeScript. Add `"lint": "eslint ."` and `"type-check": "nuxt typecheck"` scripts.

### `server/package.json` Scripts

```json
{
  "dev": "node --import ./instrument.js --watch webhooks/wp_webhook.js",
  "start": "node --import ./instrument.js webhooks/wp_webhook.js",
  "reminders:morning": "node --import ./instrument.js scripts/send-reminders.js --mode morning",
  "reminders:evening": "node --import ./instrument.js scripts/send-reminders.js --mode evening",
  "weekly-summary": "node --import ./instrument.js scripts/send-weekly-summary.js"
}
```

- **🟢 LOW** - Clean script organization. `--import ./instrument.js` for Sentry is consistent across all scripts. `--watch` in dev mode is appropriate.

---

## 5. Environment Variable Handling

### No `.env.example` Files

- **🟠 HIGH** - **No `.env.example` files exist** in either `web/` or `server/`.
  The `.gitignore` includes `!.env.example` (to allow committing it), but no example files exist. New developers (or the "Text the Check" merge) have no documentation of required env vars beyond reading `CLAUDE.md` or source code.
  **Fix**: Create `web/.env.example` and `server/.env.example` listing all required variables with placeholder values.

### Env Var Inventory

**Web** (`nuxt.config.ts`):
- `CONTACT_EMAIL` (optional, has default)
- `FIREBASE_API_KEY` (required)
- `FIREBASE_PROJECT_ID` (required)
- `FIREBASE_VAPID_KEY` (required for push notifications)

**Server** (various files):
- `FIREBASE_PROJECT_ID` (has default fallback `pay-tracker-7a5a6`)
- `FIREBASE_SERVICE_ACCOUNT` (required for production, base64)
- `WP_VERIFY_TOKEN` (required for WhatsApp, has weak fallback `myself_testing`)
- `IDENTIFIER_WP_NUMBER` (required for WhatsApp)
- `ACCESS_TOKEN_WP_BUSINESS` (required for WhatsApp)
- `GEMINI_API_KEY` (optional, gracefully handles absence)
- `PORT` (optional, defaults to 4000)
- `SENTRY_DSN` (required for error tracking)

**GitHub Actions Secrets** (referenced in workflows):
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`
- `GEMINI_API_KEY`
- Missing: `SENTRY_DSN`

- **🟡 MEDIUM** - **`FIREBASE_PROJECT_ID` duplicated across web and server** with inconsistent handling. Web has no default; server falls back to `pay-tracker-7a5a6`. Plus `firebaseAuthDomain` and `firebaseStorageBucket` are hardcoded in `nuxt.config.ts:52,54` instead of using env vars.
  **Fix**: Standardize approach -- either use env vars everywhere or accept hardcoded values for this personal project.

---

## 6. PWA Configuration

### `nuxt.config.ts` PWA Section (lines 63-136)

- **🟢 LOW** - PWA manifest is well-configured: proper `name`, `short_name`, `theme_color`, `display: standalone`, `orientation: portrait`, `start_url: /`.

- **🟢 LOW** - Icons include 192x192, 512x512, and a maskable 512x512 variant. All three icon files exist in `web/public/img/`.

- **🟡 MEDIUM** - **No Apple-specific PWA meta tags** (`nuxt.config.ts:138-153`).
  Missing `apple-touch-icon` link tag, `apple-mobile-web-app-capable`, and `apple-mobile-web-app-status-bar-style` meta tags. iOS Safari does not fully support the Web App Manifest for these properties.
  **Fix**: Add to `app.head.link`: `{ rel: "apple-touch-icon", href: "/img/icon-192.png" }` and appropriate meta tags.

- **🟢 LOW** - Workbox configuration is reasonable: `navigateFallback: null` (correct for hybrid app), proper `globPatterns`, explicit deny for `firebase-messaging-sw.js`, and runtime caching for Google Fonts.

- **🟢 LOW** - `periodicSyncForUpdates: 20` (minutes) is aggressive but acceptable for a personal app.

### `web/public/firebase-messaging-sw.js`

- **🟡 MEDIUM** - **Hardcoded Sentry DSN** in service worker (`firebase-messaging-sw.js:9`).
  The DSN `https://ca4d274b77449c12c943bc986c31cc36@o4510864892624896.ingest.us.sentry.io/4510864895508480` is hardcoded because service workers cannot access `process.env`. This is a known trade-off, but it means the DSN is public in client code. Sentry DSNs are designed to be public, but this should be documented.

- **🟢 LOW** - Good architecture decision to NOT import Firebase Messaging SDK in the service worker (well-documented in comments lines 69-83) to avoid duplicate notifications.

---

## 7. Dependencies

### `web/package.json`

- **🔴 CRITICAL** - **`firebase-admin` (^12.0.0) and `firebase-functions` (^4.6.0) are in web frontend dependencies** (`web/package.json:34-35`).
  These are server-side-only packages and should NEVER be in a client-side web app's dependencies. `firebase-admin` includes the entire Google Cloud SDK and credentials handling. It will either:
  (a) Bloat the client bundle enormously, or
  (b) Cause build errors when bundled for the browser.
  These are likely leftover from migration scripts (`web/scripts/`) that import `firebase-admin`.
  **Fix**: Move `firebase-admin` and `firebase-functions` to `devDependencies` if only used for local scripts, or better yet, move the migration scripts to the `server/` package and remove these deps from `web/` entirely.

- **🟡 MEDIUM** - **`dotenv` (^17.2.3) in web dependencies** (`web/package.json:32`).
  Nuxt 3 handles env vars natively via `runtimeConfig`. `dotenv` is likely only needed for the migration scripts. Should be in `devDependencies` at most.
  **Fix**: Move to `devDependencies` or remove.

- **🟡 MEDIUM** - **Potentially outdated packages**. Key versions:
  - `nuxt: ^3.10.0` - Nuxt 3.10 is from early 2024. Current is 3.15+.
  - `vue: ^3.4.15` - Vue 3.4 is from early 2024. Current is 3.5+.
  - `firebase: ^10.8.0` - Firebase JS SDK 10.8. Current is 10.14+.
  - `tailwindcss: ^3.4.1` - Tailwind 3.x. Tailwind v4 is now available.
  **Fix**: Run `npm outdated` in `web/` and consider updating. Not blocking for merge, but some updates include security patches.

### `server/package.json`

- **🟢 LOW** - Clean, minimal dependencies: `@sentry/node`, `dotenv`, `express`, `firebase-admin`. No bloat.

### Cross-Package Duplication

- **🟡 MEDIUM** - `dotenv` appears in both `web/package.json` and `server/package.json`. Different major versions (^17.2.3 web vs ^16.4.5 server). No monorepo tooling to manage shared deps.

---

## 8. Deployment Architecture

### Web Frontend
- **Deployed to**: Firebase Hosting (static files from `nuxt generate`)
- **Deploy method**: Manual via `npm run deploy` (no CI/CD)
- **Strategy**: Hybrid static generation -- public pages prerendered, auth pages as SPA

### Server (WhatsApp Webhook)
- **🟠 HIGH** - **No deployment configuration for the Express server**.
  No Dockerfile, Procfile, Cloud Run config, Firebase Functions wrapper, or any deployment manifest. The `server/` package has a `start` script but no indication of where/how it runs in production.
  CLAUDE.md says the server handles "WhatsApp chatbot (Express) + cron notification scripts (FCM)". The cron scripts run via GitHub Actions, but the Express webhook server's hosting is undocumented.
  **Fix**: Document the server deployment in a README or add deployment config (Dockerfile for Cloud Run, `app.yaml` for App Engine, etc.). For the merge with "Text the Check", this needs to be clearly defined.

### Monorepo Structure
- **🟡 MEDIUM** - **Orphaned root `package-lock.json`** with empty packages.
  A `package-lock.json` exists at the repo root with `"packages": {}` but there is no root `package.json`. This is confusing and serves no purpose.
  **Fix**: Delete the root `package-lock.json` (it's already in `.gitignore` based on git status showing it as untracked). Or add a root `package.json` with workspaces if you want a proper monorepo setup.

- **🟡 MEDIUM** - **No monorepo tooling**. The repo has two independent packages (`web/` and `server/`) with separate `node_modules` and no shared tooling (no npm workspaces, turborepo, nx, etc.). This works but makes it harder to manage shared configs, run all tests, or ensure consistent tooling.
  **Fix**: Consider adding a root `package.json` with `"workspaces": ["web", "server"]` for basic npm workspace support.

---

## 9. Additional Findings

- **🟡 MEDIUM** - **`user-scalable=no` in viewport meta** (`nuxt.config.ts:149`).
  `maximum-scale=1.0, user-scalable=no` prevents pinch-to-zoom. This is an accessibility concern (WCAG 1.4.4 Resize Text) and is flagged by Lighthouse. Some users need zoom for readability.
  **Fix**: Remove `maximum-scale=1.0, user-scalable=no` or at minimum allow `maximum-scale=5.0`.

- **🟢 LOW** - `.eslintrc` exists but uses `plugin:vue/essential` (Vue 2 rules) instead of `plugin:vue/vue3-essential` or `plugin:vue/vue3-recommended`. This means Vue 3-specific lint rules are not active.
  **Fix**: Update to `plugin:vue/vue3-recommended`.

- **🟡 MEDIUM** - **`eqeqeq: off`** in `.eslintrc:15`. Disabling strict equality is a footgun for JavaScript. Type coercion bugs are a common source of issues.
  **Fix**: Enable `eqeqeq: ["error", "always"]` and fix any resulting lint errors.

---

## Summary Table

| Severity | Count | Key Items |
|----------|-------|-----------|
| 🔴 CRITICAL | 2 | No web CI/CD pipeline; `firebase-admin` in frontend deps |
| 🟠 HIGH | 5 | No Firestore indexes/rules in VCS; no `.env.example`; no server deploy config; no SPA rewrite in firebase.json; no test automation |
| 🟡 MEDIUM | 11 | Missing security headers; Sentry not in GH Actions; Apple PWA tags; outdated deps; eqeqeq off; orphaned lockfile; etc. |
| 🟢 LOW | 7 | Single Firebase alias; clean server deps; good PWA manifest; etc. |

### Pre-Merge Priorities (for "Text the Check" integration)

1. **Remove `firebase-admin` and `firebase-functions` from `web/package.json`** -- this will cause problems.
2. **Create a CI/CD workflow for the web app** -- manual deploys will not scale.
3. **Version-control Firestore indexes and security rules** -- essential for multi-developer collaboration.
4. **Create `.env.example` files** -- the "Text the Check" team needs to know what's required.
5. **Document or containerize the server deployment** -- unclear how the Express webhook runs.
6. **Add SPA rewrite rule to `firebase.json`** -- deep links will 404 otherwise.
