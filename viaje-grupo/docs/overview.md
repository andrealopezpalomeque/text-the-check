# Text The Check - Product Overview

## ⚠️ Current Status: Closed Beta

The product described below is functional but in **closed beta**. New users cannot sign up on their own yet — each user and group must be manually created.

**For honest technical status, see [Product Status](./product-status.md).**

**What works:** WhatsApp bot, dashboard, multi-group, settlements
**What's missing:** Self-registration, group creation UI, WhatsApp verification

---

## The Problem

Splitting expenses with friends during trips or shared activities is a solved problem — apps like Splitwise, Tricount, and Settle Up exist. But they all share the same friction:

**Everyone needs to download the app, create an account, and join the group.**

In practice, this means:
- The "accountant friend" downloads Splitwise
- They try to get 10 people to install it
- 3 people never do
- Someone ends up tracking everything in a notes app anyway

The result: friction kills adoption. People revert to messy spreadsheets, WhatsApp messages saying "I paid for lunch, you owe me", and awkward end-of-trip settlements.

## The Solution

**Text The Check** takes a different approach:

> Log expenses where you're already coordinating — WhatsApp.

Instead of asking everyone to download an app:
1. Group members add the bot to their contacts (one-time setup)
2. **Whoever pays** texts the expense: `50 taxi @Juan @Maria`
3. Everyone can view balances on a simple web dashboard
4. At the end, copy payment details and settle however you want

**Zero app downloads. Zero forms. Just text what you paid.**

## How It Works

### Logging expenses (WhatsApp OR Dashboard — anyone in the group)

**Natural language (AI-powered):**
```
Gasté 150 en pizza           → AI understands and logs
50 dólares la cena con Juan  → Sender + Juan split it
5 lucas el taxi              → Understands "lucas" = 5000 ARS
pagué 200 de nafta           → Natural expense description
```

**Split logic ("con" vs "@"):**
```
50 cena con Juan             → Sender + Juan split it
50 cena @Juan                → Only Juan owes (explicit mention)
```

**Structured syntax (fallback):**
```
50 lunch                     → Splits among everyone
USD 20 dinner @Ana @Pedro    → Converts to ARS, splits among mentioned
/balance                     → See who owes whom
/lista                       → See recent expenses
```

**Argentine slang supported:**
- `lucas/luquitas` = thousands (5 lucas = 5000)
- `k` = thousands (5k = 5000)
- `mangos` = pesos
- `birra` = beer
- `morfi` = food
- `bondi` = bus

### Viewing balances & managing expenses (Web Dashboard — anyone)
- **Create expenses** via form (amount, description, currency, participants)
- View real-time expense feed (expenses + payments)
- Edit or delete existing expenses
- See your personal balance
- Check settlement recommendations
- Record payments with one click
- Copy payment details (CBU, alias, etc.) to transfer

### Settlement
The app is **payment-method agnostic**. Users can add their preferred payment info:
- Bank CBU/CVU
- Bank alias
- Mercado Pago
- Any platform

When it's time to settle, the dashboard shows who pays whom, with a copy button for payment details. You settle however you normally transfer money to friends.

## Target Users

**Primary:** Friend groups traveling together (5-15 people)
- Already coordinating via WhatsApp
- Mixed willingness to install apps
- Need transparency on shared expenses
- Will settle via bank transfer / Mercado Pago / cash

**Secondary:**
- Roommates splitting bills
- Couples with shared expenses
- Small groups organizing events (asados, parties)

## Competitive Landscape

### Traditional Apps (Splitwise, Tricount, Settle Up)
- ✅ Full-featured expense tracking
- ✅ Settlement recommendations
- ❌ Requires everyone to download and create accounts
- ❌ Friction kills adoption in casual groups

### WhatsApp-First Competitors (Pango, Lanly, Whispend)
- ✅ WhatsApp native entry
- ✅ Lower friction
- ❌ Most are English-first, US-focused
- ❌ Don't understand LATAM payment culture (CBU, alias, MP)

### Text The Check
- ✅ WhatsApp native entry
- ✅ Real-time web dashboard
- ✅ Spanish-first experience
- ✅ LATAM payment details (CBU, CVU, alias, Mercado Pago)
- ✅ Multi-currency for travel (USD, EUR, BRL → ARS)
- ✅ Zero friction for non-logging participants

## Why LATAM / Argentina

This isn't a limitation — it's a wedge:

1. **WhatsApp dominance** — Argentina is one of the highest WhatsApp-usage countries globally
2. **Payment culture** — People settle via "pasame por MP" or "te transfiero al CBU"
3. **Travel patterns** — Groups traveling to Brazil, Uruguay, Chile need multi-currency
4. **Competition gap** — US-based competitors won't prioritize Argentine banking

A US-based team building for Venmo/Zelle users won't invest in CBU/alias support. We already have it.

## What's Built (Production Ready)

### WhatsApp Bot
- [x] **AI-powered natural language parsing** (Google Gemini)
- [x] **Argentine Spanish slang support** (lucas, k, mangos, birra, morfi, bondi)
- [x] **Smart split detection** ("con Juan" = include sender, "@Juan" = only Juan)
- [x] Natural language expense entry (`Gasté 150 en pizza`)
- [x] Multi-currency conversion (USD, EUR, BRL → ARS with live rates)
- [x] @mention splitting with fuzzy name matching
- [x] Commands: `/ayuda`, `/balance`, `/lista`, `/borrar`, `/grupo`
- [x] Auto-categorization (food, transport, accommodation, etc.)
- [x] Fallback to regex parser if AI fails
- [x] Message deduplication and rate limiting

### Web Dashboard
- [x] Google Authentication (linked to pre-registered users)
- [x] **Create expenses** via form (amount, description, currency, participants)
- [x] Real-time expense feed (Firebase Firestore)
- [x] Edit and delete expenses
- [x] Personal balance view with breakdown
- [x] Group balance overview
- [x] Settlement recommendations (who pays whom)
- [x] **Record payments** with one-click button
- [x] Payment info display with copy-to-clipboard
- [x] User profiles with editable payment details
- [x] Mobile-first responsive design
- [x] Dark mode support

### Infrastructure
- [x] Express.js backend on Render
- [x] **Cron job (cron-job.org)** - Pings server every 10 minutes to prevent cold starts
- [x] Nuxt.js frontend on Firebase Hosting
- [x] Firebase Firestore for real-time sync
- [x] Webhook signature verification
- [x] Firestore security rules

## What's Planned (Backlog)

- [ ] Receipt/image upload with OCR parsing
- [ ] Public view-only balance links (shareable without login)
- [ ] Export to CSV/PDF
- [ ] User-configurable settlement algorithms
- [ ] Weight-based splitting ("this person eats more")
- [ ] Couples as single entity option
- [ ] Monthly summary reports

## Success Signals to Watch

When testing with friend groups, these indicate product-market fit:

1. **Repeat usage** — Do groups keep using it after the first weekend?
2. **Retention after settlement** — Do they reuse it for another trip?
3. **Organic invites** — Do users add the bot to new groups without prompting?

## Live URLs

| Service | URL |
|---------|-----|
| Dashboard | https://textthecheck.app |
| Backend API | https://viaje-grupo-server.onrender.com (legacy URL) |

---

## Technical Documentation

For implementation details, see:
- [Project Plan](./project-plan.md) — Development phases and session log
- [Deployment Guide](./deployment.md) — Production deployment checklist
- [Google Auth Setup](./google-auth.md) — Authentication configuration
- [Firestore Security](./firestore-security.md) — Security rules
- [Splitting Logic](./splitting-logic.md) — Balance calculation algorithm
- [Icon Usage](./icons.md) — Frontend icon system

## Tech Stack Summary

- **Frontend:** Nuxt 4 (Vue 3) + Tailwind CSS + Pinia
- **Backend:** Node.js + Express
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Authentication (Google)
- **Bot:** WhatsApp Business API
