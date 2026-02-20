# Server — CLAUDE.md

## Overview

Express.js + TypeScript server for Text the Check. One WhatsApp phone number, one webhook endpoint, two domain handlers (Grupos + Finanzas). Firebase Admin SDK for Firestore. Gemini AI for natural language parsing.

## Architecture Principles

### Webhooks Are HTTP, Handlers Are Business Logic
Each file in `/webhooks` is a standalone Express server that owns one webhook endpoint. It handles HTTP concerns: setup, verification, security, request parsing. It does NOT contain domain/business logic — that lives in handlers.

### Handlers vs Helpers
- **Handler** = has agency, makes decisions, orchestrates flows, contains business logic. It "handles" something (a message type, an AI interaction). Class-based — may hold config or shared state.
- **Helper** = stateless utilities, pure functions, API wrappers. It "helps" handlers do their job. Knows *how* to do a mechanical thing but never decides *what* to do.

Example: `GeminiHandler` is a handler — it decides which prompt, how to parse responses, what confidence means. WhatsApp `sendMessage()` is a helper — it mechanically sends a message, no decisions.

### One Coherent Story Per File
A file should contain ONE coherent story. Split only when a file contains two UNRELATED stories — never because it's "too long." 1500 lines telling one story > 8 files of 200 lines connected by imports.

GruposHandler contains all grupos logic (commands, expenses, splits, balances, mentions). FinanzasHandler contains all finanzas logic (commands, expenses, transfers, linking, analysis). Each is one coherent domain story.

### Extract Only What's Genuinely Shared
Code moves to `/helpers` ONLY when 2+ files actually use it. If only FinanzasHandler does image parsing, it stays in FinanzasHandler. If a future handler also needs it, extract it then. Never pre-extract for "cleanliness."

### AI-Context-Friendly Design
The file structure is optimized for feeding to AI assistants. To understand grupos: read `wp_webhook.ts` + `GruposHandler.ts` + `GeminiHandler.ts`. Three files, full picture. Fewer files with more context each beats many files with fragmented context.

### New Webhook = One New File in `/webhooks`
Adding a webhook means adding one file in `webhooks/` — a standalone Express server. Copy the pattern from `wp_webhook.ts`, adapt. No framework, no plugin system, no message bus.

## Structure

```
server/
├── config/
│   └── firebase.ts                 # Firebase Admin SDK init (shared)
├── webhooks/
│   └── wp_webhook.ts               # Express server + WhatsApp webhook
│                                    #   signature verify, dedup, rate limit
│                                    #   user lookup, mode routing
│                                    #   → GruposHandler or FinanzasHandler
├── handlers/
│   ├── GruposHandler.ts            # Class: all grupos message processing
│   │                               #   commands, expenses, payments, splits,
│   │                               #   balance calc, mentions (Fuse.js),
│   │                               #   exchange rates, multi-group flow
│   ├── FinanzasHandler.ts          # Class: all finanzas message processing
│   │                               #   commands, expenses, transfers, linking,
│   │                               #   categories, audio, image/PDF, analysis
│   └── GeminiHandler.ts            # Class: all AI operations
│                                    #   NL parsing, audio transcription,
│                                    #   image/PDF receipt, categorization,
│                                    #   financial analysis, weekly insight,
│                                    #   all prompts defined here
├── helpers/
│   ├── whatsapp.ts                 # sendMessage(), downloadMedia(), replyMessage()
│   └── phone.ts                    # normalization, format, comparison
├── scripts/
│   ├── send-reminders.ts           # Cron: payment reminders (morning/evening)
│   └── send-weekly-summary.ts      # Cron: weekly digest + AI insight
├── instrument.ts                   # Sentry init (imported first by all entry points)
├── package.json
└── tsconfig.json
```

## Webhook Flow

Single WhatsApp phone number → single POST endpoint → shared middleware → mode router:

```
wp_webhook.ts (Express server, port 3001)
  │
  ├── GET  /webhook  → Meta verification (hub.verify_token challenge)
  ├── GET  /health   → status check
  └── POST /webhook  →
        signature verification (HMAC SHA256, constant-time comparison)
        → rate limiting (100 req/min per IP)
        → 200 OK immediately (async processing)
        → extract message from payload
        → message deduplication (in-memory Map, auto-cleanup)
        → phone normalization (Argentine format)
        → user lookup (ttc_user from Firestore)
        → determine activeMode (from user doc or explicit command)
        → route:
            grupos   → gruposHandler.handleMessage(msg, user)
            finanzas → finanzasHandler.handleMessage(msg, user)
```

Handlers are instantiated once at startup:
```typescript
const gemini = new GeminiHandler(apiKey)
const grupos = new GruposHandler(gemini)
const finanzas = new FinanzasHandler(gemini)
```

Handlers use helpers directly via imports (no dependency injection for stateless utilities).

## Handler Domains

### GruposHandler (`handlers/GruposHandler.ts`)
- Commands: /ayuda, /help, /balance, /saldo, /lista, /list, /grupo, /group, /borrar, /delete
- Welcome message (first interaction, personalized with groups)
- NL expense parsing (Gemini AI with confidence threshold + regex fallback)
- AI expense confirmation flow (pending state, "si"/"no" response)
- @mention fuzzy matching (Fuse.js, threshold 0.3, accent normalization)
- Multi-group support (group selection flow, activeGroupId, pending states)
- Expense splitting logic (all members, subset, exclude "todos menos" pattern)
- Payment/settlement recording ("pagué", "recibí" with @mentions)
- Exchange rate conversion (USD/EUR/BRL → ARS via dolarapi.com, 30min cache)
- Argentine slang currency detection (lucas, k, mangos, dolares, reales)
- Balance calculation (Splitwise-style: paid - share + payment adjustments)
- Delete last expense/payment (/borrar command)
- In-memory pending state management (group selection, expense confirmation, AI confirmation — auto-cleanup with timeouts)
- Firestore: `ttc_user`, `ttc_group`, `ttc_expense`, `ttc_payment`

### FinanzasHandler (`handlers/FinanzasHandler.ts`)
- Commands: AYUDA, CATEGORIAS, RESUMEN, FIJOS, ANALISIS
- Account linking: VINCULAR/DESVINCULAR via 6-char verification codes (10min expiry)
- Expense parsing: `$amount title #category d:description` (flexible order)
- Argentine amount parsing (1.234,56 format — dot thousands, comma decimal)
- 4-level category matching (exact → startsWith → contains → "Otros")
- Audio message processing (download → Gemini transcription → expense extraction with date detection)
- Image message processing (download → Gemini vision → bank transfer receipt parsing)
- PDF message processing (download → Gemini vision → transfer receipt parsing)
- Transfer recipient history lookup (auto-fill title + category from past transfers)
- Monthly summary with month-over-month comparison (top 3 categories)
- Recurring payment status (pending/paid, days until due, monthly total)
- AI financial health analysis (3 months data, 2-3 actionable tips, max 800 chars)
- Common categories fallback (supermercado, salidas, transporte, servicios, suscripciones)
- Firestore: `ttc_user`, `ttc_finanzas_payment`, `ttc_finanzas_recurring`, `ttc_finanzas_category`, `ttc_finanzas_template`, `pt_whatsapp_link`

### GeminiHandler (`handlers/GeminiHandler.ts`)
All AI operations via Google Generative AI SDK. All prompts defined in this class.

**Grupos methods:**
- `parseExpenseNL(text, members)` → amount, currency, description, splitAmong, confidence (Gemini 2.0 Flash)
- Supports expense/payment/command/unknown result types
- Confidence threshold system (default 0.7)

**Finanzas methods:**
- `transcribeAudio(base64, mimeType, categories)` → transcription, title, amount, category, description, date
- `parseTransferImage(base64, mimeType)` → amount, recipient, sender bank, date, reference
- `parseTransferPDF(base64, mimeType)` → same as image
- `categorizeExpense(title, description, categories)` → category name
- `getFinancialAnalysis(dataSummary)` → 2-3 advice tips (max 800 chars)
- `getWeeklyInsight(weeklyStats)` → 2-3 sentence summary (max 600 chars)

**Shared internals:**
- `generateContent(prompt, media?)` → generic Gemini API wrapper
- Supports text + multimodal (base64 audio/image/PDF inline data)
- JSON response parsing (handles raw JSON and markdown code blocks)
- Error handling with Sentry reporting
- Configurable temperature per use case

## Helpers

### whatsapp.ts
- `sendMessage(to, text)` — Send text via WhatsApp Graph API
- `downloadMedia(mediaId)` — Download audio/image/PDF from WhatsApp, return base64
- Uses WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID from env

### phone.ts
- `normalizePhone(phone)` — Argentine mobile: 549XXXXXXXXX → 54XXXXXXXXX
- `formatPhone(phone)` — Display formatting
- `comparePhones(a, b)` — Digits-only comparison
- Handles Argentina "15" mobile prefix variations

## Security

Applied in `wp_webhook.ts` before any handler logic:
- HMAC SHA256 webhook signature verification (X-Hub-Signature-256) with constant-time comparison
- Rate limiting (100 req/min per IP via express-rate-limit)
- Message deduplication (in-memory Map, 15min cleanup cycle, 1hr entry TTL)
- Helmet security headers
- Phone authorization allowlist (ALLOWED_PHONE_NUMBERS)
- Raw body capture for signature verification
- Dev-only signature bypass (NODE_ENV=development AND explicit flag — NEVER in production)

## Environment Variables

```
# Server
PORT=3001
NODE_ENV=development

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_SERVICE_ACCOUNT=              # Base64-encoded JSON (alternative)

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_SKIP_SIGNATURE_VERIFICATION=   # dev only, never in prod

# AI
GEMINI_API_KEY=
AI_ENABLED=true
AI_TIMEOUT_MS=5000
AI_CONFIDENCE_THRESHOLD=0.7

# Access Control
ALLOWED_PHONE_NUMBERS=                  # comma-separated

# Error Tracking
SENTRY_DSN=
```

## Firestore Collections

Shared: `ttc_user`
Grupos: `ttc_group`, `ttc_expense`, `ttc_payment`
Finanzas: `ttc_finanzas_payment`, `ttc_finanzas_recurring`, `ttc_finanzas_category`, `ttc_finanzas_template`, `pt_whatsapp_link`

## Scripts

Standalone Node.js scripts for cron jobs. Import `instrument.ts` first for Sentry. Share Firebase + Gemini config.
- `send-reminders.ts` — Morning (due today + 3 days) and evening (due today) FCM push notifications for pending recurring payments. Queries `pt_fcm_token` for enabled tokens, auto-removes invalid tokens.
- `send-weekly-summary.ts` — Computes weekly stats (paid/unpaid, past/next week), generates AI insight via GeminiHandler, saves to `pt_weekly_summary`, sends FCM notification.

## Key Conventions

- Full TypeScript (strict)
- ES Modules (`"type": "module"`)
- Argentine locale (`es-AR`), timezone (`America/Argentina/Buenos_Aires`), currency (ARS)
- Sentry for error tracking (`instrument.ts` imported first by all entry points)
- Immediate 200 response on webhook POST (async processing after)
- dayjs with Spanish locale for date handling
- Spanish (Argentine) for all WhatsApp responses — friendly tone, no emojis
- Class-based handlers, function-based helpers
- No over-abstraction: no DI container, no plugin system, no base classes
