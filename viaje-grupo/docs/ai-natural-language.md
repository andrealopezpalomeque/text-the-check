# AI Natural Language Processing

**Last Updated:** December 30, 2025
**Status:** ✅ Implemented and Production Ready

---

## Why This Makes Sense Now

### The Core Problem (Solved!)

Our whole thesis is "reduce friction." Making users learn a syntax IS friction.

| Before AI (Rigid Syntax) | After AI (Natural Language) |
|--------------------------|----------------------------|
| `150 pizza` ✅ | `150 pizza` ✅ |
| `USD 50 cena @Juan @Maria` ✅ | `USD 50 cena @Juan @Maria` ✅ |
| `Gasté 150 en pizza` ❌ | `Gasté 150 en pizza` ✅ |
| `Pagué un taxi 200p` ❌ | `Pagué un taxi 200p` ✅ |
| `50 dólares la cena con juan` ❌ | `50 dólares la cena con juan` ✅ |
| `5 lucas el taxi` ❌ | `5 lucas el taxi` ✅ |

### Why Now?

| Reason | Explanation |
|--------|-------------|
| **Core goal alignment** | Reduce friction is our thesis - syntax is friction |
| **Small user base** | Beta = low API costs while we experiment |
| **Real user feedback** | We'll quickly learn what people actually type |
| **Competitive advantage** | Most expense apps don't do this |

---

## Architecture (Implemented)

```
┌─────────────────────────────────────────────────────────────┐
│  USER MESSAGE                                               │
│  "50 dólares la cena con juan"                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Has Pending AI Expense?                                    │
│  → YES + "si": Save pending expense, send confirmation      │
│  → YES + "no": Cancel pending, send cancellation message    │
│  → YES + other: Clear pending, process as new message       │
│  → NO: Continue to command/AI parsing                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Is Command? (/balance, /grupo, /ayuda)                     │
│  → YES: Handle command directly (bypass AI)                 │
│  → NO: Continue to AI parsing                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  AI LAYER (Gemini 2.0 Flash)                                │
│                                                             │
│  Input: User message + group members (names + aliases)      │
│                                                             │
│  Output (structured JSON):                                  │
│  {                                                          │
│    "type": "expense",                                       │
│    "amount": 50,                                            │
│    "currency": "USD",                                       │
│    "description": "cena",                                   │
│    "splitAmong": ["juan", "xyz"],  ← ALL names, even unknown│
│    "includesSender": true,         ← "con" = include sender │
│    "confidence": 0.95                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Confidence ≥ 0.7?                                          │
│  → YES: Use AI result                                       │
│  → NO or ERROR: Fall back to regex parser                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MENTION RESOLUTION (mentionService)                        │
│  - Fuzzy match names against group members (Fuse.js)        │
│  - Threshold: 0.3 (70% similarity required)                 │
│  - Confidence: 0.35 (strict rejection of marginal matches)  │
│  - Returns: { resolvedNames, unresolvedNames }              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Any Unresolved Names?                                      │
│  → YES: REJECT expense, show error with suggestions         │
│  → NO: Continue to confirmation                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CONFIRMATION REQUEST                                       │
│  - Store as pending expense (not saved yet)                 │
│  - Send confirmation message to user                        │
│  - Wait for "si" or "no" response                           │
│  - If includesSender=true, add sender to split              │
│  - Convert currency if needed                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Explicit Confirmation Before Saving

AI-parsed expenses require user confirmation before saving:

```
User: "50 dol cena con juancho"
Bot: 🔍 ¿Guardar este gasto?

     📁 Grupo: Brazil Trip 2025

     💵 USD 50 → $52.500 ARS
     📝 cena
     🏷️ 🍽️ food
     👥 Dividido entre: Juan Pérez, Pipi López

     ━━━━━━━━━━━━━━━━━━━━━━
     Respondé si para guardar
     Respondé no para cancelar

User: "si"
Bot: ✅ Gasto registrado
     💵 USD 50 → $52.500 ARS
     📝 cena
     👥 Juan Pérez, Pipi López
     📁 Brazil Trip 2025
```

### 2. Reject Unresolved Names (Don't Just Warn)

If any mentioned name can't be matched, the expense is rejected entirely:

```
User: "50 cena con gonza y robertro"
Bot: ⚠️ No pude encontrar a esta persona en el grupo:
     • robertro

     📁 Grupo actual: Brazil Trip 2025

     💡 ¿Qué podés hacer?
     • Revisá que el nombre esté bien escrito
     • Usá /grupo para cambiar de grupo
     • Volvé a enviar el gasto con los nombres correctos
```

**Why reject instead of warn?** Users might miss a warning and accidentally save an expense with incorrect splits.

### 3. Confidence Threshold

If AI confidence < 0.7, ask for clarification:

```
User: "150"
Bot: 🤔 No entendí bien. ¿Qué fue ese gasto?
     Ejemplo: "150 taxi" o "150 almuerzo"
```

### 4. Hybrid Approach (Safety Net)

1. Try AI interpretation first
2. If AI fails or times out (>5s) → fall back to regex parser
3. Log everything for debugging and improvement

### 5. Commands Stay Unchanged

Slash commands (`/balance`, `/grupo`, `/ayuda`, etc.) bypass AI entirely - they're already unambiguous.

### 6. Strict Fuzzy Matching

To prevent false positives like "robertro" matching "Conrado Romero":
- Fuse.js threshold: 0.3 (requires 70% similarity)
- Confidence threshold: 0.35 (rejects marginal matches)
- Debug logging shows match scores for troubleshooting

---

## Cost Estimation

Using Gemini 1.5 Flash:

| Scenario | Messages/month | Estimated Cost |
|----------|---------------|----------------|
| 1 active trip, 5 people | ~200 | $0.02 |
| 3 active trips, 15 people | ~600 | $0.06 |
| 10 active trips, 50 people | ~2000 | $0.20 |
| 100 active trips (growth!) | ~20000 | $2.00 |

**Verdict: Cost is negligible.** Even at scale, dollars per month.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI hallucinates amounts | Always show confirmation, "deshacer" command |
| AI is slow/unavailable | Fallback to regex parser, 5s timeout |
| Costs spike unexpectedly | Billing alerts, rate limit per user |
| AI misunderstands slang | Argentine slang in system prompt |
| Privacy concerns | No message content stored in AI logs |

---

## Implementation Status

### Phase 1: Expenses ✅ COMPLETE
- [x] AI parses expense messages
- [x] Existing commands unchanged (bypass AI)
- [x] Fallback to regex if AI fails or low confidence
- [x] Smart split detection ("con" vs "@")
- [x] `includesSender` field for split logic

### Phase 2: Payments ✅ COMPLETE
- [x] AI recognizes "pagué", "le di", "transferí"
- [x] Same confirmation flow
- [x] Payment notifications to other party

### Phase 3: Confirmation Flow ✅ COMPLETE
- [x] AI expenses stored as "pending" until user confirms
- [x] User responds "si" to save, "no" to cancel
- [x] Original message text preserved in Firestore
- [x] Member aliases passed to AI for better nickname recognition
- [x] Affirmative/negative response detection (handles "dale", "ok", "nope", etc.)

### Phase 4: Unresolved Name Handling ✅ COMPLETE
- [x] AI returns ALL mentioned names (even unrecognized ones)
- [x] Fuzzy matching made stricter (70% similarity, 0.35 confidence)
- [x] Expense REJECTED if any names can't be resolved
- [x] Clear error message with suggestions (check spelling, /grupo, try again)
- [x] Singular/plural grammar ("esta persona" vs "estas personas")

### Phase 5: Smart Features (Future/Backlog)
- [ ] "¿Cuánto le debo a Juan?" → AI answers from balance
- [ ] "Borrar el último" → AI understands context
- [ ] Multi-message context
- [ ] Allow specifying who paid (not just sender) - See GitHub issue #34

---

## Technical Details

### Provider: Google Gemini 2.0 Flash
- **Model:** `gemini-2.0-flash-exp`
- **Why:** Cheapest, fast (~800ms), good structured output
- **Fallback:** Regex parser (existing messageParser.ts)

### Environment Variables

```
GEMINI_API_KEY=your_api_key_here
AI_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.7
AI_TIMEOUT_MS=5000
```

### New Files
- `server/src/services/aiService.ts` - Gemini integration
- `server/src/prompts/expenseExtraction.ts` - System prompts

### Modified Files
- `server/src/routes/whatsapp.js` - AI integration in message flow
- `server/src/utils/messageParser.ts` - Add fallback flag

---

## Argentine Spanish Considerations

The AI prompt includes these local terms:

| Slang | Meaning |
|-------|---------|
| lucas, luquitas | thousands (5 lucas = 5000) |
| mangos | pesos |
| 5k, 10k | 5000, 10000 |
| guita | money |
| morfi | food |
| birra | beer |
| dólar blue | informal USD rate |

---

## Success Metrics

1. **Parse success rate:** % of messages AI correctly interprets (target: >90%)
2. **Fallback rate:** % of messages falling back to regex (target: <10%)
3. **User corrections:** How often users use "deshacer" (target: <5%)
4. **Latency:** Average AI response time (target: <1.5s)

---

## Changelog

| Date | Change |
|------|--------|
| Dec 30, 2025 | Reject expense if any names unresolved (not just warn) |
| Dec 30, 2025 | Stricter fuzzy matching (0.3 threshold, 0.35 confidence) |
| Dec 30, 2025 | AI prompt updated to include ALL mentioned names |
| Dec 29, 2025 | Added confirmation flow (user must respond "si" to save) |
| Dec 29, 2025 | Member aliases passed to AI for better recognition |
| Dec 29, 2025 | Added `includesSender` for smart split detection ("con" vs "@") |
| Dec 28, 2025 | Payment recognition ("pagué", "recibí") |
| Dec 27, 2025 | Initial implementation (Phase 1 - expenses) |
