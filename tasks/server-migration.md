# Server Migration — Progress Tracker

## Status: Planning

## Phase 1: Project Scaffolding
- [ ] package.json (unified dependencies + scripts)
- [ ] tsconfig.json
- [ ] .env.example
- [ ] instrument.ts (Sentry)

## Phase 2: Config & Helpers
- [ ] config/firebase.ts (dual auth method support)
- [ ] helpers/phone.ts (merged normalization)
- [ ] helpers/whatsapp.ts (sendMessage + downloadMedia)

## Phase 3: GeminiHandler
- [ ] Class structure + constructor + SDK init
- [ ] Grupos: parseExpenseNL() with full extraction prompt
- [ ] Grupos: AI config helpers (isAIEnabled, getConfidenceThreshold)
- [ ] Finanzas: transcribeAudio()
- [ ] Finanzas: parseTransferImage()
- [ ] Finanzas: parseTransferPDF()
- [ ] Finanzas: categorizeExpense()
- [ ] Finanzas: getFinancialAnalysis()
- [ ] Finanzas: getWeeklyInsight()
- [ ] Shared: generateContent() wrapper + JSON parsing

## Phase 4: GruposHandler
- [ ] State management (dedup, pending states, cleanup)
- [ ] handleMessage() main routing chain (11 steps)
- [ ] Commands: /ayuda, /help
- [ ] Commands: /balance, /saldo (Splitwise algorithm)
- [ ] Commands: /lista, /list (recent expenses + relative dates)
- [ ] Commands: /grupo, /group (multi-group selection)
- [ ] Commands: /borrar, /delete (redirect to dashboard)
- [ ] Expense handling (regex): parse, validate, mentions, create
- [ ] Expense handling (AI): full AI flow with confirmation
- [ ] Payment handling: regex + AI, direction logic, notifications
- [ ] Welcome message
- [ ] Exchange rate service (dolarapi.com + cache)
- [ ] Mention service (Fuse.js fuzzy matching)
- [ ] All message formatting functions
- [ ] All Firestore operations (users, expenses, payments, groups)
- [ ] Response helpers (affirmative/negative detection)

## Phase 5: FinanzasHandler
- [ ] handleMessage() routing (by type + commands)
- [ ] Account linking: VINCULAR/DESVINCULAR
- [ ] Commands: AYUDA
- [ ] Commands: CATEGORIAS
- [ ] Commands: RESUMEN (monthly summary)
- [ ] Commands: FIJOS (recurring status)
- [ ] Commands: ANALISIS (AI financial analysis)
- [ ] Expense parsing ($amount title #cat d:desc)
- [ ] Category matching (4-level fallback)
- [ ] Audio message processing
- [ ] Image message processing (transfer receipts)
- [ ] PDF message processing (transfer receipts)
- [ ] Transfer data processing (recipient history, auto-fill)
- [ ] All Firestore operations
- [ ] All message templates (Spanish)

## Phase 6: wp_webhook.ts
- [ ] Express setup (helmet, cors, morgan, raw body capture)
- [ ] Security: signature verification (HMAC SHA256)
- [ ] Security: rate limiting
- [ ] Message deduplication
- [ ] Routes: GET /, GET /health, GET /webhook, POST /webhook
- [ ] Mode detection + routing logic
- [ ] Handler instantiation
- [ ] Error handlers

## Phase 7: Scripts
- [ ] send-reminders.ts (morning/evening FCM)
- [ ] send-weekly-summary.ts (weekly digest + AI)

## Phase 8: Verification
- [ ] TypeScript compiles
- [ ] Dev server starts
- [ ] Endpoints respond
- [ ] Firestore connectivity
- [ ] WhatsApp send works

## Notes
- Both `ttc_*` and `p_t_*` collections coexist (no migration)
- Single WhatsApp phone number shared between modes
- Mode detection: user.activeMode → linking check → group membership check
