# Text The Check - Session Handoff Document

**Last updated:** December 30, 2025
**Purpose:** Context document to start new Claude conversations with full project knowledge

---

## 🚀 Quick Start for New Sessions

Paste this at the start of any new Claude conversation:

> I'm working on **Text The Check**, a collaborative expense tracking app where users log expenses via WhatsApp and view balances on a web dashboard.
>
> **Tech Stack:**
> - `/client`: Nuxt.js + Tailwind + Pinia (Firebase Hosting)
> - `/server`: Node.js + Express (Render)
> - Database: Firebase Firestore
> - Bot: WhatsApp Business API
>
> **Live URLs:**
> - Dashboard: https://textthecheck.app
> - Backend: https://viaje-grupo-server.onrender.com
>
> **Current Phase:** Closed Beta Testing with 3 friend groups
>
> See `docs/session-handoff.md` for full context, or I can explain what I need.

---

## 📋 Project Summary

### What It Does

Users split expenses during trips by texting a WhatsApp bot using **natural language**:

**Natural language (AI-powered):**
- `Gasté 150 en pizza` → AI understands and logs expense
- `50 dólares la cena con Gonzalo` → Sender + Gonzalo split it
- `5 lucas el taxi` → Understands "lucas" = thousands (5000 ARS)
- `pagué 200 de nafta` → Natural payment description

**Structured syntax (still works as fallback):**
- `100 taxi` → Logs expense, splits among everyone in group
- `USD 50 dinner @Juan @Maria` → Converts currency, splits ONLY among mentioned
- `50 cena @Yo @Juan` → Include yourself by mentioning your name

**Split logic ("con" vs "@"):**
- `50 cena con Juan` → Sender + Juan split it (natural language, "with")
- `50 cena @Juan` → Only Juan owes (explicit mention, logging for others)

**Payments:**
- `pagué 5000 @Maria` → Record payment made to Maria
- `recibí 5000 @Juan` → Record payment received from Juan

**Commands:**
- `/balance` → Shows who owes whom
- `/grupo` → Switch between groups
- `/lista` → View recent expenses
- `/ayuda` → Get help

**Edit/Delete:** Dashboard only at textthecheck.app (keeps bot simple)

### The Core Insight

> **Splitwise friction:** Everyone downloads app + creates account + joins group
>
> **Our solution:** ONE person creates group, friends just text. No app downloads.

---

## 🏗️ Architecture

### Data Model

```
users/
├── {userId}
│   ├── name: "Juan Pérez"
│   ├── phone: "+5493794702813"
│   ├── email: "juan@gmail.com" (nullable)
│   ├── aliases: ["juan", "juanpe"]  ← for @mention matching
│   ├── activeGroupId: "brazil-2026" ← current group for WhatsApp
│   ├── paymentInfo: { cbu, alias, mercadoPago, bankName }
│   └── createdAt: timestamp

groups/
├── {groupId}
│   ├── name: "Brazil Trip 2025"
│   ├── members: [userId1, userId2, ...]
│   ├── createdBy: userId
│   └── createdAt: timestamp

expenses/
├── {expenseId}
│   ├── groupId: "brazil-2026"
│   ├── paidBy: userId
│   ├── amount: 1500 (always in ARS)
│   ├── originalAmount: 50 (if foreign currency)
│   ├── originalCurrency: "USD"
│   ├── description: "taxi"
│   ├── category: "transport"
│   ├── splitAmong: [userId1, userId2]
│   └── createdAt: timestamp

payments/
├── {paymentId}
│   ├── groupId: "brazil-2026"
│   ├── fromUserId: userId (who paid)
│   ├── toUserId: userId (who received)
│   ├── amount: 5000 (always in ARS)
│   ├── recordedBy: userId (who recorded via WhatsApp/dashboard)
│   ├── authUid: string (Firebase Auth UID for security)
│   ├── note: string (optional)
│   └── createdAt: timestamp
```

### Key Services (Server)

| File | Purpose |
|------|---------|
| `routes/whatsapp.js` | Webhook handler, message routing, AI integration |
| `services/aiService.ts` | Google Gemini integration for NLP parsing |
| `prompts/expenseExtraction.ts` | AI system prompts for expense extraction |
| `services/commandService.ts` | Bot commands (/ayuda, /balance, etc.) |
| `services/expenseService.ts` | CRUD for expenses |
| `services/paymentService.ts` | CRUD for payments (settling debts) |
| `services/userService.ts` | User lookup, group membership |
| `services/mentionService.ts` | Fuzzy @mention matching (Fuse.js) |
| `services/exchangeRateService.ts` | DolarApi.com integration |
| `utils/messageParser.ts` | Regex fallback parser for "100 taxi @Juan" |

### Key Components (Client)

| File | Purpose |
|------|---------|
| `composables/useAuth.ts` | Google Auth + Firestore user linking |
| `stores/useExpenseStore.ts` | Expense state, real-time sync |
| `stores/usePaymentStore.ts` | Payment state, real-time sync |
| `stores/useUserStore.ts` | Balance calculations (includes payments) |
| `components/expense/PaymentItem.vue` | Display payment in activity feed |
| `components/settlement/SettlementItem.vue` | Settlement row with payment button |
| `pages/index.vue` | Main dashboard |
| `pages/profile.vue` | User profile, payment info |

---

## ✅ What's Built & Working

### AI Natural Language (December 2025)
- [x] Google Gemini AI integration for message parsing
- [x] Argentine Spanish slang support (lucas, k, mangos, birra, morfi, bondi)
- [x] Natural language expense entry ("gasté 150 en pizza", "50 dólares la cena con juan")
- [x] Smart split detection ("con Juan" = include sender, "@Juan" = only Juan)
- [x] Fallback to regex parser if AI fails or has low confidence
- [x] Confidence threshold (0.7) for AI responses
- [x] 5-second timeout with automatic fallback
- [x] **Confirmation flow**: AI expenses require "si" to save, "no" to cancel
- [x] **Member aliases**: AI receives nicknames for better recognition
- [x] **Unresolved name rejection**: Expense blocked if any name can't be matched
- [x] **Strict fuzzy matching**: 70% similarity required, prevents false positives

### WhatsApp Bot
- [x] Natural language expense entry (AI-powered)
- [x] Multi-currency (USD, EUR, BRL → ARS via DolarApi.com Blue rate)
- [x] @mention splitting with fuzzy matching (Fuse.js)
- [x] Commands: `/ayuda`, `/balance`, `/lista`, `/grupo`
- [x] Edit/Delete: Dashboard only (keeps bot simple, redirects to textthecheck.app)
- [x] Auto-categorization (food, transport, accommodation, etc.)
- [x] Multi-group support with `/grupo` switching
- [x] **Payment recording**: `pagué 5000 @Maria` or `recibí 5000 @Juan`
- [x] **Payment notifications**: Other party gets notified when payment is recorded
- [x] Security: webhook signature verification, rate limiting

### Web Dashboard
- [x] Google Authentication (linked to Firestore users)
- [x] **Create expenses via form** (amount, description, currency, participants)
- [x] Real-time expense feed
- [x] **Edit/Delete expenses**
- [x] **Unified activity feed**: Shows both expenses AND payments
- [x] Personal view ("Tu Resumen") vs Group view
- [x] Settlement recommendations
- [x] **Payment recording button**: Click settlement → "Registrar pago realizado"
- [x] Payment info with copy-to-clipboard
- [x] Group selector dropdown
- [x] Bottom navigation (mobile)
- [x] Profile page with payment details

### Infrastructure
- [x] Backend on Render (auto-deploy from GitHub)
- [x] **Cron job (cron-job.org)** - Pings server every 10 minutes to prevent cold starts
- [x] Frontend on Firebase Hosting
- [x] Custom domain: textthecheck.app
- [x] Firestore security rules

---

## ❌ What's NOT Built Yet

### Critical for Public Launch

| Feature | Why Needed | Estimate |
|---------|------------|----------|
| Self-registration | Users can't create accounts | 1 week |
| Group creation UI | Groups require seed scripts | 1 week |
| Friend invitation flow | Can't add friends without dev | 1 week |
| WhatsApp Business verification | Meta approval for public access | 1-4 weeks |

### Nice to Have (Post-Launch)

- Receipt/image upload
- Export to CSV/PDF
- Public shareable balance links
- WhatsApp-based onboarding flow

---

## 🧪 Current Test Groups

### Group 1: Brazil Trip 2025
- **Members:** 11 people (original test group)
- **ID:** `brazil-trip-2025`
- **Status:** Ready to test

### Group 2: Demo Group
- **Members:** Pipi, Virginia, Carlos Demo, Laura Demo
- **ID:** `demo-group`
- **Purpose:** Marketing co-founder testing
- **Note:** Virginia's email needs to be added when she provides it

### Group 3: Brazil 2026 Ingleses
- **Members:** Pipi, Gonzalo Soria, Agustin Hurtado, Conrado Romero, Chiche Gonzalez
- **ID:** `brazil-2026-ingleses`
- **Status:** Ready to test

### Phone Numbers (for ALLOWED_PHONE_NUMBERS on Render)

```
# Brazil Trip 2025 (11)
+5493794702813,+5493794702875,+5493794029833,+5493794887005,+5493794583503,+5493794229905,+5493794720969,+5493794770027,+5493794142450,+5493794625698,+5493794824341

# Demo Group (1 new)
+5493794574159

# Brazil 2026 Ingleses (4 new)
+5493794008427,+5493794335989,+5493794351114,+5493794382508
```

---

## 🔑 Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| AI Provider | Google Gemini 2.0 Flash | Cheap (~$0.02/month), fast (~800ms), good structured output |
| AI Fallback | Regex parser | Graceful degradation if AI fails/times out |
| Split detection | "con" vs "@" | Natural language includes sender, explicit @ does not |
| Exchange rate API | DolarApi.com | Free, has Blue Dollar, supports EUR/BRL |
| Fuzzy matching | Fuse.js | Lightweight, handles typos and accents |
| Auth | Google (Firebase Auth) | Simple, most users have Google |
| Multi-group | `activeGroupId` on user | Syncs between WhatsApp and dashboard |
| Currency display | Always ARS | Stored in ARS, original currency for reference |
| Hosting | Render (backend) + Firebase (frontend) | Free tiers, good DX |

---

## 📱 WhatsApp API Status

### Current: Test Mode
- Using Meta's test phone number
- Only ALLOWED_PHONE_NUMBERS can message the bot
- Works for testing with known friends
- Cannot scale to unknown users

### For Public Launch
- Need WhatsApp Business verification (1-4 weeks)
- Need dedicated phone number for bot
- Need approved message templates for outbound messages

---

## 🛤️ Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1-4 | ✅ Done | Security, deployment, data quality, bot commands |
| Phase 5 | ✅ Done | Dashboard UX enhancements |
| **Testing** | 🔄 Current | Test with 3 friend groups |
| Self-service | ⬜ Next | Registration, group creation UI |
| Public launch | ⬜ Future | WhatsApp verification, remove whitelist |

---

## 📁 Key File Locations

```
/client
├── composables/useAuth.ts      # Auth logic
├── stores/useExpenseStore.ts   # Expense state
├── stores/useUserStore.ts      # User state, balances
├── pages/index.vue             # Main dashboard
├── pages/profile.vue           # Profile page
└── components/                 # UI components

/server
├── src/routes/whatsapp.js      # Webhook handler, AI integration
├── src/services/
│   ├── aiService.ts            # Gemini AI integration (NEW)
│   ├── commandService.ts       # Bot commands
│   ├── expenseService.ts       # Expense CRUD
│   ├── userService.ts          # User/group queries
│   ├── mentionService.ts       # @mention matching
│   └── exchangeRateService.ts  # Currency conversion
├── src/prompts/
│   └── expenseExtraction.ts    # AI system prompts (NEW)
├── src/utils/messageParser.ts  # Regex fallback parser
├── scripts/
│   ├── seedUsers.ts            # Seed Brazil Trip 2025
│   ├── seedTestGroup.ts        # Seed Demo Group
│   ├── seedBrazil2026Group.ts  # Seed Ingleses group
│   └── updateUserEmail.ts      # Update user email

/docs
├── project-plan.md             # Development phases, session log
├── product-status.md           # Honest assessment for co-founders
├── overview.md                 # Product vision
├── deployment.md               # Deployment guide
├── adding-groups.md            # How to add test groups
└── session-handoff.md          # This file
```

---

## 🔧 Environment Variables (Render)

```env
# WhatsApp
WHATSAPP_VERIFY_TOKEN=xxx
WHATSAPP_APP_SECRET=xxx
WHATSAPP_API_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx

# Phone whitelist (all test users)
ALLOWED_PHONE_NUMBERS=+5493794702813,+5493794702875,...

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx

# AI / Gemini (NEW)
GEMINI_API_KEY=xxx
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.7
AI_TIMEOUT_MS=5000

# Server
PORT=4000
NODE_ENV=production
```

---

## ⚠️ Known Limitations & Gotchas

1. **Cold starts on Render:** ~~Free tier spins down after inactivity, first request can be slow~~ **SOLVED** - Cron job pings server every 10 minutes via cron-job.org

2. **WhatsApp test number:** Must manually add each phone to ALLOWED_PHONE_NUMBERS

3. **Google Auth domain:** Must add domains to Firebase Auth → Authorized Domains

4. **Multi-group users:** When user is in multiple groups, they must use `/grupo` to switch. Default is their `activeGroupId` or first group found.

5. **Emails optional:** Users can use WhatsApp without email. Email only needed for dashboard access.

6. **Argentina focus:** Currency conversion assumes ARS as target. Blue Dollar rate used.

---

## 💡 Lessons Learned

1. **WhatsApp API is not like Telegram:** You can't just let anyone message your bot. Meta controls access.

2. **The friction trade-off:** We reduced friction for expense logging but current onboarding requires developer. This is the main gap to fix.

3. **Test with real users early:** Many UX issues only surface with real usage (numbers getting cut off, confusing navigation, etc.)

4. **Documentation matters:** Keeping docs updated helped clarify product state for co-founder discussions.

---

## 📞 Useful Commands

```bash
# Run seed scripts (from /server)
npx ts-node scripts/seedUsers.ts
npx ts-node scripts/seedTestGroup.ts
npx ts-node scripts/seedBrazil2026Group.ts

# Update user email
npx ts-node scripts/updateUserEmail.ts --phone="+549..." --email="x@gmail.com"

# Deploy frontend
cd client && npm run build && firebase deploy --only hosting

# Deploy backend (auto via GitHub push to main)
git push origin main
```

---

## 🎯 Next Steps (As of December 30, 2025)

1. **Done:** Splitting logic redesign - payer not auto-included (see `docs/splitting-logic.md`)
2. **Done:** Payment recording feature - WhatsApp commands + dashboard button
3. **Done:** Activity feed shows both expenses and payments
4. **Done:** AI natural language parsing with Gemini (see `docs/ai-natural-language.md`)
5. **Done:** Smart split detection ("con" vs "@")
6. **Done:** AI expense confirmation flow (user must confirm with "si")
7. **Done:** Unresolved name handling (reject expense if names can't be matched)
8. **Test:** Real trip testing scheduled for January 2025
9. **Parallel:** Research WhatsApp Business verification process
10. **After testing:** Build self-registration and group creation features

---

## 📝 How to Update This Document

After each significant development session:
1. Update "Last updated" date
2. Add new decisions to "Key Technical Decisions"
3. Update "What's Built" and "What's NOT Built"
4. Update "Next Steps"
5. Commit to repo

This keeps the handoff document fresh for future sessions.
