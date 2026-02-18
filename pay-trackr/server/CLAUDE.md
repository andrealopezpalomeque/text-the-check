# PayTrackr - Server

Node.js backend services for PayTrackr: WhatsApp chatbot integration and scheduled notification scripts.

## Technical Stack

- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Database**: Firebase Admin SDK (Firestore)
- **Messaging**: Firebase Cloud Messaging (FCM) for push notifications
- **External APIs**: WhatsApp Business API (Meta Graph API), Gemini AI (Google)
- **Config**: dotenv for environment variables

## Architecture Overview

Two independent services sharing the same Firebase project:

### 1. WhatsApp Webhook Server (`webhooks/wp_webhook.js`)
- Express server receiving WhatsApp Business API webhooks
- Handles account linking via verification codes
- Parses natural language expense messages (e.g., `$500 Super #supermercado`)
- Commands: `VINCULAR`, `DESVINCULAR`, `AYUDA`, `CATEGORIAS`, `RESUMEN`, `FIJOS`, `ANALISIS`
- Writes directly to `p_t_payment` collection (same as web app)
- AI-powered financial analysis via Gemini API

### 2. Notification Scripts (`scripts/`)
- `send-reminders.js` - Cron-driven payment reminders via FCM push notifications
  - Morning mode: notifies for payments due today + in 3 days
  - Evening mode: notifies for payments due today only
- `send-weekly-summary.js` - Weekly digest with per-user stats + AI insight via Gemini

### 3. Handlers (`handlers/`)
- `GeminiHandler.js` - Reusable Gemini AI API wrapper (used by webhook + weekly summary)

## Firestore Collections Used

- `p_t_payment` - Reads/writes one-time payments (shared with web)
- `p_t_recurrent` - Reads recurring payment templates (shared with web)
- `p_t_whatsapp_link` - Account linking state (pending codes + linked accounts)
- `p_t_fcm_token` - Push notification tokens per user
- `p_t_expense_category` - User category definitions

## Key Patterns

### Firebase Admin Initialization
- Uses base64-encoded service account from `FIREBASE_SERVICE_ACCOUNT` env var
- Falls back to default credentials if not provided
- Project ID: `viaje-grupo`

### WhatsApp Message Parsing
- Format: `$<amount> <title> #<category> d:<description>`
- Amount supports Argentine format (`1.234,56` -> `1234.56`)
- Category matching: exact -> starts-with -> contains -> fallback to "Otros"
- Phone number normalization for Argentine numbers (removes `9` after country code)

### Timezone
- All date operations use `America/Argentina/Buenos_Aires`

## Environment Variables

```
FIREBASE_PROJECT_ID        # Firebase project (default: viaje-grupo)
FIREBASE_SERVICE_ACCOUNT   # Base64-encoded service account JSON
WP_VERIFY_TOKEN            # WhatsApp webhook verification token
IDENTIFIER_WP_NUMBER       # WhatsApp phone number ID
ACCESS_TOKEN_WP_BUSINESS   # WhatsApp Business API access token
GEMINI_API_KEY             # Google Gemini API key for AI analysis
PORT                       # Express server port (default: 4000)
```

## Running

```bash
npm run dev                    # Webhook server with --watch
npm run start                  # Webhook server (production)
npm run reminders:morning      # Morning reminder cron
npm run reminders:evening      # Evening reminder cron
npm run weekly-summary         # Weekly summary cron
```

## Language & Formatting

- All user-facing messages are in **Spanish (Argentine)**
- Currency: ARS formatted with `Intl.NumberFormat('es-AR', ...)`
- Same locale rules as the web app (see `/web/CLAUDE.md`)
