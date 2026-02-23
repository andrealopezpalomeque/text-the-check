# Server Refactor Plan

## Priority 1: Finanzas NLP Text Parsing

### 1.1 MODIFY `server/handlers/GeminiHandler.ts`
- Add new interface `AIPersonalExpenseResult`:
  ```
  { type: 'personal_expense', amount, currency, description, category, isRecurrent, frequency, confidence }
  ```
  - `category`: AI auto-detects from message context (e.g. "café" → "cafetería/comida")
  - `isRecurrent`: boolean — AI detects "todos los meses", "mensual", "semanal", etc.
  - `frequency`: 'monthly' | 'weekly' | 'biweekly' | 'yearly' | null
- Add method `parsePersonalExpenseNL(message: string, userCategories: string[]): Promise<AIPersonalExpenseResult | AIErrorResult>`
  - New prompt: simpler than grupos (no split logic, no mentions, no group members)
  - Accepts user's existing category names for better matching
  - Handles both formats: "1500 café" (NLP) and "$1500 café #comida" (hybrid — NLP still parses it)
  - Argentine Spanish dictionary (same slang: lucas, k, mangos, etc.)
  - Currency detection (same rules as grupos)
  - Confidence scoring (same thresholds)
  - Model: gemini-2.5-flash-lite, temperature 0.3, timeout same as grupos

### 1.2 MODIFY `server/handlers/FinanzasHandler.ts` — `handleExpenseMessage()`
- Current flow (line 328): `parseExpenseMessage(text)` regex → save or error
- New flow:
  1. If `gemini.isAIEnabled()`:
     - Call `gemini.parsePersonalExpenseNL(text, userCategoryNames)`
     - If confidence >= threshold AND amount > 0:
       - Use AI result's `category` to `findCategoryId()` (existing 4-level matcher)
       - If `isRecurrent`: create in `pt_recurrent` instead of `pt_payment` (or flag for user review)
       - Save to Firestore, send confirmation
       - RETURN
     - If confidence < threshold or error: fall through to regex
  2. Existing regex path: `parseExpenseMessage(text)` (unchanged, lines 572-598)
  3. If both fail: show help message (existing behavior, line 333-337)
- This means "$1500 café #comida" works via EITHER path — NLP catches it, and if NLP is off, regex catches it too

---

## Priority 2: Grupos Image + Audio Support

### 2.1 MODIFY `server/webhooks/wp_webhook.ts` — `processMessage()` routing
- Current (line ~231): Grupos only gets text messages, all other types silently ignored
  ```ts
  if (mode === 'grupos') {
    if (messageType === 'text') { gruposHandler.handleMessage(...) }
    // else: silently dropped
  }
  ```
- Change to: pass ALL message types to GruposHandler
  ```ts
  if (mode === 'grupos') {
    gruposHandler.handleMessage(from, messageType, messageData, user, contactName)
  }
  ```
- Update `GruposHandler.handleMessage()` signature to accept messageType + full messageData (see 2.2)

### 2.2 MODIFY `server/handlers/GruposHandler.ts` — entry point + new media methods
- Change `handleMessage()` signature:
  - FROM: `handleMessage(from, text, messageId, user)`
  - TO: `handleMessage(from, messageType, messageData, user, contactName)`
  - Extract text from messageData when type is 'text', preserve all existing text logic
  - Route audio/image to new methods

- Add `processAudioMessage(from, audioId, user)`:
  1. `downloadMedia(audioId)` → base64
  2. Get user's group members for context
  3. `gemini.transcribeAudio(base64, mimeType)` → get transcription text
  4. Feed transcription into `gemini.parseExpenseNL(transcription, memberInfos)` — reuse existing NLP
  5. If expense result with confidence >= threshold:
     - Enter same `handleAIExpense()` confirmation flow (with split options)
     - Include `_"transcripción: ..."_` in confirmation message
  6. If low confidence: send "No pude entender el audio" + show transcription for manual retry
  - Key insight: audio → text → existing parseExpenseNL pipeline. No new AI method needed.

- Add `processImageMessage(from, imageId, caption, user)`:
  1. `downloadMedia(imageId)` → base64
  2. `gemini.parseTransferImage(base64, mimeType)` → TransferResult
  3. Convert TransferResult to a pseudo-expense: amount from receipt, description from recipientName/concept
  4. Enter `handleAIExpense()` confirmation flow:
     - Show: "Comprobante detectado: $X a [recipient] — Dividir entre el grupo?"
     - User confirms with "si" → split among group (like any other expense)
     - User says "no" → cancel
  5. If caption provided: use caption as description override
  - Note: images in Grupos context = "I paid this, split it with the group" (different from Finanzas where it's personal tracking)

- Add import for `downloadMedia` from `../helpers/whatsapp.js`

### 2.3 MODIFY `server/handlers/GeminiHandler.ts` — minor
- No new methods needed. `transcribeAudio()` and `parseTransferImage()` already exist.
- Only change: make `transcribeAudio()` work without `userCategories` param (it already defaults to `[]`, so no change needed — just confirm).

---

## Priority 3: Unified Response Formatter

### 3.1 CREATE `server/helpers/responseFormatter.ts`
- Shared formatting module used by both GruposHandler and FinanzasHandler
- Functions:

  **Confirmations:**
  - `formatExpenseConfirmation({ title, amount, currency?, category?, splitInfo?, transcription? })` → string
  - `formatPaymentConfirmation({ amount, direction, person, groupName? })` → string
  - `formatTransferConfirmation({ title, amount, recipient?, category?, needsRevision? })` → string

  **Errors:**
  - `formatParseError(mode: 'grupos' | 'finanzas', suggestions?: string[])` → string
  - `formatNotLinkedError()` → string
  - `formatMediaError(mediaType: string)` → string
  - `formatAIUnavailableError()` → string

  **Help:**
  - `formatHelpMessage(mode: 'grupos' | 'finanzas', categories?: string[])` → string

  **Balance / Summary:**
  - `formatBalance(balances: BalanceEntry[])` → string
  - `formatExpenseList(expenses: ExpenseEntry[])` → string
  - `formatMonthlySummary({ month, total, count, comparison?, topCategories?, pendingCount? })` → string
  - `formatRecurringSummary({ total, pending, paid })` → string

  **Shared utilities:**
  - `formatAmount(amount: number)` → string (es-AR currency, no decimals)
  - `formatAmountFull(amount: number)` → string (es-AR currency, with decimals)
  - `bold(text: string)` → `*${text}*`
  - `italic(text: string)` → `_${text}_`

  **Emoji system** (consistent across both modes):
  - Expense confirmed: (no emoji, clean)
  - Error: (no emoji, just clear text)
  - Keep current style — both handlers already avoid emojis per brand guidelines

### 3.2 MODIFY `server/handlers/GruposHandler.ts`
- Replace inline message strings (lines 859-989) with calls to `responseFormatter`
- Remove local `formatAmount()` if it exists, use shared one
- Affected methods: `formatWelcomeMessage`, `formatBalanceMessage`, `formatExpenseListMessage`, `formatConfirmationMessage`, `formatPaymentConfirmation`, `formatHelpMessage`

### 3.3 MODIFY `server/handlers/FinanzasHandler.ts`
- Replace inline message strings with calls to `responseFormatter`
- Remove local `formatAmount()` (line 42-44) and `formatAmountFull()` (line 46-48), use shared
- Affected methods: `sendHelpMessage`, `handleResumenCommand`, `handleFijosCommand`, confirmation messages in `handleExpenseMessage`, `processAudioMessage`, `processTransferData`

---

## Priority 4: Harmonize Commands

### 4.1 MODIFY `server/webhooks/wp_webhook.ts` — replace global "MODE" command
- Current (line ~215): matches `MODE GRUPOS` / `MODE FINANZAS` as plain text
- Change to: remove this global handler entirely (will be handled by /modo command inside handlers)

### 4.2 CREATE shared command router or modify both handlers
- Add `/modo` command handling:
  - `/modo` (no arg) → show current mode + "Escribe /modo grupos o /modo finanzas para cambiar"
  - `/modo grupos` → `setUserActiveMode(phone, 'grupos')`
  - `/modo finanzas` → `setUserActiveMode(phone, 'finanzas')`
  - Must work from EITHER handler (user might be in grupos and type `/modo finanzas`)
  - Implementation: handle in `wp_webhook.ts` processMessage() as a global command (like vincular/desvincular), since it needs to work pre-routing

### 4.3 MODIFY `server/handlers/GruposHandler.ts` — command harmonization
- Current commands: `/ayuda`, `/help`, `/balance`, `/saldo`, `/lista`, `/list`, `/grupo`, `/group`, `/borrar`, `/delete`
- Changes:
  - `/ayuda` / `/help` → use shared `formatHelpMessage('grupos')` from responseFormatter
  - `/balance` / `/saldo` → keep as-is (already grupos-specific, shows group balances)
  - `/lista` / `/list` → keep as-is (shows group expense list)
  - Keep all existing command names (don't remove aliases)

### 4.4 MODIFY `server/handlers/FinanzasHandler.ts` — add slash commands
- Current commands are bare words: `ayuda`, `categorias`, `resumen`, `fijos`, `analisis`
- Changes:
  - Add slash versions: `/ayuda`, `/categorias`, `/resumen`, `/fijos`, `/analisis`
  - Keep bare word versions too (backward compat)
  - `/ayuda` → use shared `formatHelpMessage('finanzas')` from responseFormatter
  - Add `/balance` alias → same as `resumen` (monthly summary)
  - Add `/lista` alias → show recent expenses (new: query last 10 pt_payment, format as list)
  - Both `/balance` and `/lista` now work in BOTH modes — they just show different data

### 4.5 MODIFY `server/webhooks/wp_webhook.ts` — unified /ayuda
- Before mode routing, check for `/ayuda` or `/help` globally
- If user has no mode yet (not linked, not in a group): show a unified help message explaining both modes
- If user has a mode: let it pass through to the handler (handler-specific help)

---

## Implementation Order

1. **P3 first** (responseFormatter) — creates the shared module both handlers will use
2. **P1 second** (Finanzas NLP) — self-contained addition to GeminiHandler + FinanzasHandler
3. **P2 third** (Grupos media) — requires changes to wp_webhook routing + GruposHandler
4. **P4 last** (commands) — touches all files but is low-risk string changes

## Files Summary

| File | Action | Priorities |
|------|--------|-----------|
| `server/helpers/responseFormatter.ts` | CREATE | P3 |
| `server/handlers/GeminiHandler.ts` | MODIFY | P1 |
| `server/handlers/FinanzasHandler.ts` | MODIFY | P1, P3, P4 |
| `server/handlers/GruposHandler.ts` | MODIFY | P2, P3, P4 |
| `server/webhooks/wp_webhook.ts` | MODIFY | P2, P4 |

Total: 1 new file, 4 modified files.
