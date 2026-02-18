# Text The Check

> Collaborative expense tracking via WhatsApp

Split expenses with friends during trips. Add expenses via WhatsApp, see balances in real-time on the dashboard.

**Live:** https://textthecheck.app

## Features

### WhatsApp Bot
- **AI Natural Language**: Just text naturally - "Gasté 150 en pizza", "5 lucas el taxi"
- **Argentine Slang**: Understands "lucas", "mangos", "birra", "morfi", "bondi"
- **Smart Split Detection**: "con Juan" includes you, "@Juan" means only Juan
- **Confirmation Flow**: AI asks for confirmation before saving (respond "si" or "no")
- **Unresolved Name Check**: Rejects expense if any mentioned name can't be found
- **Multi-currency**: USD, EUR, BRL auto-converted to ARS (Blue Dollar rate)
- **Payment Recording**: `pagué 5000 @Maria` or `recibí 5000 @Juan`
- **Bot Commands**: `/balance`, `/lista`, `/grupo`, `/ayuda`

### Web Dashboard
- **Real-time Updates**: Firebase Firestore syncs instantly across devices
- **Smart Balance Calculations**: Splitwise-style "who owes whom" logic
- **Unified Activity Feed**: Shows both expenses and payments
- **Settlement Recommendations**: See exactly who should pay whom
- **Payment Info**: CBU, CVU, Mercado Pago details with copy-to-clipboard
- **Multi-group Support**: Switch between trip groups
- **Mobile-first**: Optimized for on-the-go usage
- **Dark Mode**: Full dark mode support

## Tech Stack

### Frontend (Client)
- **Framework**: Nuxt 4 (Vue 3)
- **Language**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore (Client SDK)
- **Auth**: Firebase Google Authentication
- **Utilities**: dayjs, Intl API

### Backend (Server)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: Firebase Firestore (Admin SDK)
- **Webhook**: WhatsApp Business API integration
- **AI**: Google Gemini 2.0 Flash (natural language parsing)
- **Fuzzy Matching**: Fuse.js (for @mentions)

## Documentation

- [Project Plan](./docs/project-plan.md) - Development phases and session log
- [Product Status](./docs/product-status.md) - Current state and roadmap
- [AI Natural Language](./docs/ai-natural-language.md) - AI parsing architecture and features
- [Session Handoff](./docs/session-handoff.md) - Context for new development sessions
- [Deployment Guide](./docs/deployment.md) - Production deployment checklist
- [Google Auth Setup](./docs/google-auth.md) - Authentication configuration
- [Firestore Security](./docs/firestore-security.md) - Security rules documentation
- [Splitting Logic](./docs/splitting-logic.md) - Balance calculation algorithm
- [Adding Groups](./docs/adding-groups.md) - How to create test groups
- [Architecture Overview](./docs/overview.md) - Detailed system design

## Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project with Firestore
- WhatsApp Business API access (optional for local dev)

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both client and server.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required configuration:
- **Firebase**: Project ID, API keys, Admin SDK credentials
- **WhatsApp**: Verify token, phone number ID
- **Users**: Authorized phone numbers (comma-separated)

### 3. Run Development Server

```bash
npm run dev
```

This starts:
- **Client**: `http://localhost:3000`
- **Server**: `http://localhost:4000`

### Run individually:

```bash
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
```

### Expose backend for WhatsApp webhooks:

```bash
npm run ngrok:server
```

Then configure your WhatsApp webhook URL to:
`https://<your-ngrok-host>/api/whatsapp/webhook`

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://textthecheck.app |
| Backend | https://viaje-grupo-server.onrender.com |

> **Note:** The backend is still hosted at `viaje-grupo-server.onrender.com`. This will be updated in a future release.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/whatsapp/webhook` - WhatsApp webhook verification
- `POST /api/whatsapp/webhook` - Receive WhatsApp messages

## Message Format

Users can send expenses in natural language (AI-powered):

### Natural Language (AI understands)
- `Gasté 150 en pizza` → AI parses: $150 ARS, "pizza"
- `5 lucas el taxi` → AI understands slang: $5000 ARS, "taxi"
- `50 dólares la cena` → AI detects currency: $50 USD → ARS

### Split Options
- `50 cena con Juan` → Sender + Juan split it (natural "with")
- `50 cena @Juan` → Only Juan owes (explicit mention)
- `100 pizza con Juan y María` → Sender + Juan + María split it
- `100 pizza @Juan @María` → Only Juan and María split it

### Payments
- `pagué 5000 @Maria` → Record payment made to Maria
- `recibí 5000 @Juan` → Record payment received from Juan

### Legacy Syntax (still works)
- `50 lunch` → $50 ARS, "lunch", category: food
- `USD 10 dinner` → Converted to ARS, "dinner"

## Bot Commands

| Command | Description |
|---------|-------------|
| `/ayuda` or `/help` | Show usage instructions |
| `/balance` or `/saldo` | Show group balances (who owes whom) |
| `/lista` or `/list` | Show last 10 expenses |
| `/grupo` or `/group` | Switch between groups (for multi-group users) |

> **Note:** Edit and delete operations are dashboard-only. The bot redirects users to textthecheck.app for these actions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both client and server |
| `npm run dev:client` | Run frontend only |
| `npm run dev:server` | Run backend only |
| `npm run build` | Build both for production |
| `npm run typecheck` | Type-check both projects |

## License

Private project for group use.
