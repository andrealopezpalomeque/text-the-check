/**
 * GeminiHandler — all AI operations for both Grupos and Finanzas.
 *
 * All methods use Gemini 2.5 Flash Lite via SDK.
 * Grupos: NL expense/payment parsing.
 * Finanzas: NL personal expense parsing, audio transcription,
 *           image/PDF receipt parsing, categorization,
 *           financial analysis, weekly insight.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'
import * as Sentry from '@sentry/node'

// ─── Grupos AI types ───────────────────────────────────────────────

export interface MemberInfo {
  name: string
  aliases: string[]
}

export interface AIExpenseResult {
  type: 'expense'
  amount: number
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL'
  description: string
  splitAmong: string[]
  includesSender: boolean
  excludeFromSplit: string[]
  confidence: number
}

export interface AIPaymentResult {
  type: 'payment'
  amount: number
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL'
  direction: 'paid' | 'received'
  person: string
  confidence: number
}

export interface AICommandResult {
  type: 'command'
  command: string
  confidence: number
}

export interface AIUnknownResult {
  type: 'unknown'
  confidence: number
  suggestion?: string
  isSupportQuestion: boolean
}

export interface AIErrorResult {
  type: 'error'
  error: string
}

export type AIParseResult = AIExpenseResult | AIPaymentResult | AICommandResult | AIUnknownResult | AIErrorResult

// ─── Finanzas AI types ─────────────────────────────────────────────

export interface TranscriptionResult {
  transcription: string
  title: string
  items: string[]
  totalAmount: number
  description: string
  category: string
  date: string | null
}

export interface TransferResult {
  amount: number
  recipientName: string | null
  recipientCBU: string | null
  recipientAlias: string | null
  recipientBank: string | null
  senderBank: string | null
  date: string | null
  reference: string | null
  concept: string | null
}

// ─── Finanzas personal expense NLP types ──────────────────────────

export interface AIPersonalExpenseResult {
  type: 'personal_expense'
  amount: number
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL'
  title: string
  category: string
  description: string
  isRecurrent: boolean
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly' | null
  confidence: number
}

export type AIPersonalParseResult = AIPersonalExpenseResult | AIUnknownResult | AIErrorResult

// ─── Config ────────────────────────────────────────────────────────

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '5000', 10)
const AI_CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7')

// Model fallback rotation: try each in order, skip exhausted (rate-limited) ones
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',          // Stable — primary
  'gemini-2.5-flash',               // Stable — fallback 1
  'gemini-2.0-flash',               // Stable — fallback 2
]

const RETRY_DELAYS = [2000, 5000] // Exponential backoff for 503 retries

// Shared Argentine Spanish dictionary used by both Grupos and Finanzas prompts
const ARGENTINE_DICTIONARY = `| Term | Meaning |
|------|---------|
| lucas, luquitas | thousands (5 lucas = 5000) |
| k | thousands (5k = 5000) |
| mangos | Argentine pesos |
| guita, plata | money |
| morfi | food |
| birra | beer |
| bondi | bus |
| super | supermercado |
| facu | facultad / universidad |
| depto | departamento / alquiler |
| expensas | building maintenance fees |
| prepaga | health insurance |
| abono | monthly subscription / plan |
| monotributo | tax regime payment |
| afip | tax authority |
| dólar blue | informal dollar |
| dol, dólar, dolares, usd | US dollars |
| euro, eur | euros |
| real, reais, brl | Brazilian reais |
| pe, pes | pesos (abbreviation) |`

const CURRENCY_RULES = `- Default to ARS (Argentine pesos)
- "dólares", "dol", "usd", "dolares" → USD
- "euros", "eur" → EUR
- "reales", "reais", "brl" → BRL
- "pesos", "mangos", "pe" → ARS`

const CONFIDENCE_RULES = `- 0.95-1.0: Very clear message, explicit amount and description
- 0.8-0.94: Clear message but uses slang or abbreviations
- 0.7-0.79: Understandable message but somewhat ambiguous
- <0.7: Very ambiguous message, better to ask for clarification`

// ─── Handler class ─────────────────────────────────────────────────

export default class GeminiHandler {
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string
  private exhaustedModels = new Map<string, string>() // model → 'YYYY-MM-DD'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey)
    }
    return this.genAI
  }

  private getModel(modelName: string): GenerativeModel {
    return this.getClient().getGenerativeModel({ model: modelName })
  }

  // ─── Model rotation internals ──────────────────────────────────

  private isExhausted(model: string): boolean {
    const today = new Date().toISOString().slice(0, 10)
    return this.exhaustedModels.get(model) === today
  }

  private markExhausted(model: string): void {
    const today = new Date().toISOString().slice(0, 10)
    this.exhaustedModels.set(model, today)
    console.log(`[GEMINI] Model ${model} marked exhausted for ${today}`)
  }

  /** Extract HTTP status code from SDK errors or fetch-like errors */
  private getErrorStatus(error: unknown): number | null {
    if (error && typeof error === 'object') {
      // @google/generative-ai SDK wraps HTTP errors with status
      if ('status' in error && typeof (error as any).status === 'number') return (error as any).status
      // Some SDK versions put it in statusCode
      if ('statusCode' in error && typeof (error as any).statusCode === 'number') return (error as any).statusCode
      // Check error message for status code patterns
      const msg = (error as any).message || ''
      const match = msg.match(/\b(429|503)\b/)
      if (match) return parseInt(match[1], 10)
    }
    return null
  }

  // ─── Shared internals ─────────────────────────────────────────

  /**
   * Generic content generation with model fallback rotation.
   * Tries each model in GEMINI_MODELS order, skipping exhausted ones.
   * On 429: marks model exhausted, rotates to next.
   * On 503: retries with exponential backoff, then rotates.
   * On other errors: returns null (doesn't mask).
   */
  private async generateContent(
    prompt: string | null,
    options: {
      maxOutputTokens?: number
      temperature?: number
      parts?: any[]
    } = {}
  ): Promise<string | null> {
    const { maxOutputTokens = 500, temperature = 0.7, parts } = options

    for (const model of GEMINI_MODELS) {
      if (this.isExhausted(model)) continue

      const result = await this.tryWithModel(model, prompt, { maxOutputTokens, temperature, parts })

      if (result === '__rate_limit__') {
        this.markExhausted(model)
        Sentry.captureMessage('Gemini model exhausted (429), rotating', { level: 'warning', extra: { model } })
        continue
      }

      if (result === '__unavailable__') {
        console.log(`[GEMINI] Model ${model} unavailable (503), rotating to next`)
        continue
      }

      // Success or null (real error) — return as-is
      return result
    }

    // All models exhausted
    console.error('[GEMINI] All models exhausted')
    Sentry.captureException(new Error('All Gemini models exhausted'))
    return null
  }

  /**
   * Try a single model with 503 retry logic.
   * Returns the text, null (non-retryable error), '__rate_limit__', or '__unavailable__'.
   */
  private async tryWithModel(
    model: string,
    prompt: string | null,
    options: { maxOutputTokens: number; temperature: number; parts?: any[] }
  ): Promise<string | null | '__rate_limit__' | '__unavailable__'> {
    const { maxOutputTokens, temperature, parts } = options

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        let text: string | null

        if (parts) {
          // Multimodal: raw fetch API
          text = await this.fetchGenerateContent(model, { maxOutputTokens, temperature, parts })
        } else {
          // Text-only: SDK
          text = await this.sdkGenerateContent(model, prompt!, { maxOutputTokens, temperature })
        }

        console.log(`[GEMINI] Success with model ${model}`)
        return text
      } catch (error) {
        const status = this.getErrorStatus(error)

        if (status === 429) {
          console.warn(`[GEMINI] 429 rate limited on ${model}`)
          return '__rate_limit__'
        }

        if (status === 503) {
          if (attempt < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[attempt]
            console.warn(`[GEMINI] 503 on ${model}, retry ${attempt + 1}/${RETRY_DELAYS.length} in ${delay}ms`)
            await new Promise(r => setTimeout(r, delay))
            continue
          }
          console.warn(`[GEMINI] 503 persistent on ${model}, rotating`)
          return '__unavailable__'
        }

        // Non-retryable error — log and return null
        console.error(`[GEMINI] Request failed on ${model}:`, error)
        Sentry.captureException(error, { extra: { model } })
        return null
      }
    }

    return null
  }

  /** Raw fetch to Gemini API (for multimodal / parts requests). Throws on HTTP errors. */
  private async fetchGenerateContent(
    model: string,
    options: { maxOutputTokens: number; temperature: number; parts: any[] }
  ): Promise<string | null> {
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'
    const response = await fetch(
      `${baseUrl}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: options.parts }],
          generationConfig: { maxOutputTokens: options.maxOutputTokens, temperature: options.temperature },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      const err: any = new Error(`Gemini API ${response.status}: ${errorText.slice(0, 150)}`)
      err.status = response.status
      throw err
    }

    const result: any = await response.json()
    return result.candidates?.[0]?.content?.parts?.[0]?.text || null
  }

  /** SDK-based text generation. Throws on errors (including HTTP errors from the SDK). */
  private async sdkGenerateContent(
    model: string,
    prompt: string,
    options: { maxOutputTokens: number; temperature: number }
  ): Promise<string | null> {
    const genModel = this.getModel(model)
    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: options.maxOutputTokens, temperature: options.temperature },
    })
    return result.response.text().trim() || null
  }

  /** Strip markdown code blocks and parse JSON */
  private parseJSON<T>(text: string, context: string): T | null {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      console.error(`[GEMINI] ${context} JSON parse failed: ${(error as Error).message} | raw: ${text.slice(0, 100)}`)
      Sentry.captureException(error, { extra: { rawText: text, context } })
      return null
    }
  }

  // ─── Grupos AI methods ────────────────────────────────────────

  isAIEnabled(): boolean {
    return process.env.AI_ENABLED === 'true' && !!this.apiKey
  }

  getConfidenceThreshold(): number {
    return AI_CONFIDENCE_THRESHOLD
  }

  /**
   * Parse a natural language message into structured expense/payment/command data.
   * Uses Gemini 2.0 Flash via SDK with the full extraction prompt.
   */
  async parseExpenseNL(message: string, groupMembers: MemberInfo[], senderName?: string): Promise<AIParseResult> {
    const startTime = Date.now()

    try {
      const systemPrompt = this.buildExtractionPrompt(groupMembers, senderName)
      const fullPrompt = `${systemPrompt}\n\nMensaje del usuario: "${message}"`

      console.log('[AI] Input:', message)
      console.log('[AI] Group members:', groupMembers.map(m => `${m.name} (${(m.aliases || []).join(', ')})`))

      const responseText = await Promise.race([
        this.generateContent(fullPrompt, { maxOutputTokens: 500, temperature: 0.7 }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
        ),
      ])

      if (!responseText) {
        return { type: 'error', error: 'No response from AI' }
      }

      console.log('[AI] Raw response:', responseText)
      console.log('[AI] Latency:', `${Date.now() - startTime}ms`)

      const parsed = this.parseAIResponse(responseText)
      console.log('[AI] Parsed result:', JSON.stringify(parsed))
      return parsed
    } catch (error) {
      console.error('[AI] Error:', error)
      console.log('[AI] Latency (error):', `${Date.now() - startTime}ms`)
      return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private parseAIResponse(responseText: string): AIParseResult {
    try {
      let jsonStr = responseText
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) jsonStr = jsonMatch[1].trim()

      const parsed = JSON.parse(jsonStr)
      if (!parsed.type) throw new Error('Missing type in response')

      switch (parsed.type) {
        case 'expense': return this.validateExpenseResult(parsed)
        case 'payment': return this.validatePaymentResult(parsed)
        case 'command': return this.validateCommandResult(parsed)
        default: return this.validateUnknownResult(parsed)
      }
    } catch {
      return { type: 'unknown', confidence: 0, suggestion: 'No pude entender el mensaje', isSupportQuestion: false }
    }
  }

  private validateExpenseResult(p: Record<string, unknown>): AIExpenseResult {
    return {
      type: 'expense',
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0,
      currency: this.validateCurrency(p.currency),
      description: typeof p.description === 'string' ? p.description : '',
      splitAmong: Array.isArray(p.splitAmong) ? p.splitAmong.filter((s): s is string => typeof s === 'string') : [],
      includesSender: typeof p.includesSender === 'boolean' ? p.includesSender : true,
      excludeFromSplit: Array.isArray(p.excludeFromSplit) ? p.excludeFromSplit.filter((s): s is string => typeof s === 'string') : [],
      confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.5,
    }
  }

  private validatePaymentResult(p: Record<string, unknown>): AIPaymentResult {
    return {
      type: 'payment',
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0,
      currency: this.validateCurrency(p.currency),
      direction: p.direction === 'received' ? 'received' : 'paid',
      person: typeof p.person === 'string' ? p.person : '',
      confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.5,
    }
  }

  private validateCommandResult(p: Record<string, unknown>): AICommandResult {
    return {
      type: 'command',
      command: typeof p.command === 'string' ? p.command : '',
      confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 1.0,
    }
  }

  private validateUnknownResult(p: Record<string, unknown>): AIUnknownResult {
    return {
      type: 'unknown',
      confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.3,
      suggestion: typeof p.suggestion === 'string' ? p.suggestion : undefined,
      isSupportQuestion: typeof p.isSupportQuestion === 'boolean' ? p.isSupportQuestion : false,
    }
  }

  private validateCurrency(currency: unknown): 'ARS' | 'USD' | 'EUR' | 'BRL' {
    const valid = ['ARS', 'USD', 'EUR', 'BRL']
    const normalized = typeof currency === 'string' ? currency.toUpperCase() : 'ARS'
    return valid.includes(normalized) ? (normalized as any) : 'ARS'
  }

  /**
   * Build the full extraction prompt for grupos NL parsing.
   * Contains the complete Argentine Spanish dictionary, split logic rules,
   * and example messages (419 lines from expenseExtraction.ts).
   */
  private buildExtractionPrompt(groupMembers: MemberInfo[], senderName?: string): string {
    let membersList: string
    if (groupMembers.length === 0) {
      membersList = 'No registered members'
    } else {
      membersList = groupMembers.map(m => {
        const aliases = m.aliases || []
        return aliases.length > 0 ? `${m.name} (aliases: ${aliases.join(', ')})` : m.name
      }).join('\n')
    }

    const senderContext = senderName
      ? `\nSENDER (the person sending this WhatsApp message): ${senderName}\n`
      : ''

    return `You are an assistant that extracts expense and payment information from messages in Argentine Spanish.

TASK: Analyze the user's message and extract structured data.
${senderContext}
GROUP MEMBERS (for identifying mentions):
${membersList}

MESSAGE TYPES:

1. EXPENSE (expense): User registers an expense they paid
   - Keywords: "gasté", "pagué" (without recipient), amount + description
   - Example: "Gasté 150 en pizza", "50 dólares la cena", "5 lucas el taxi"

2. PAYMENT (payment): User transferred money to another person or received money
   - Keywords: "le pagué a", "le di a", "transferí a", "recibí de", "me pagó"
   - Must have a clear recipient or sender
   - Example: "Le pagué 5000 a María", "Recibí 3k de Juan"
   - THIRD-PERSON messages: The user may describe a payment between two people using third person (e.g. "Juan pagó a Pedro 5000"). Use the SENDER name to determine direction:
     - If the sender is the recipient → direction: "received", person: the OTHER person
     - If the sender is the payer → direction: "paid", person: the OTHER person
     - The "person" field must ALWAYS be the OTHER party, never the sender themselves

3. COMMAND (command): User wants to execute a bot command
   - Start with "/"
   - Example: "/balance", "/grupo", "/ayuda", "/lista"

4. UNKNOWN (unknown): Cannot determine what the user wants
   - Ambiguous messages, greetings, questions

ARGENTINE SPANISH DICTIONARY:

${ARGENTINE_DICTIONARY}

CURRENCY RULES:
${CURRENCY_RULES}

MENTION RULES:
- Identify ALL names of people mentioned in the message
- Include EVERY name in splitAmong, even if it doesn't match any group member
- The app will handle matching and warn about unrecognized names
- They can be with @ or without @
- Use the exact name or alias as it appears in the message for splitAmong
- Examples: "cena con gonza y xyz123" → splitAmong: ["gonza", "xyz123"]

IMPORTANT - SPLIT LOGIC (includesSender):

The "includesSender" field determines if the person sending the message should be included in the split:

1. When NO ONE is mentioned:
   - splitAmong: []
   - includesSender: true
   - Meaning: split among the ENTIRE group (handled by the app)

2. When NATURAL LANGUAGE is used like "con", "with", "entre", "y":
   - Examples: "cena con Juan", "taxi con María y Pedro", "almuerzo entre todos"
   - splitAmong: ["Juan"] or ["María", "Pedro"]
   - includesSender: TRUE (the sender participated, they said "with")

3. When EXPLICIT @MENTIONS are used:
   - Examples: "@Juan", "@María @Pedro", "para Juan"
   - splitAmong: ["Juan"] or ["María", "Pedro"]
   - includesSender: FALSE (sender might be logging for others)

4. When user EXPLICITLY mentions themselves:
   - Examples: "con Juan y conmigo", "@Juan @yo", "entre Juan y yo"
   - splitAmong: ["Juan"]
   - includesSender: TRUE (they explicitly said "me"/"conmigo")

DETECTION PATTERNS:

Natural language (includesSender = true):
- "con [name]" / "with [name]"
- "entre [names]" / "among [names]"
- "[name] y yo" / "[name] and me"
- "fuimos con [name]" / "we went with [name]"
- "comimos con [name]" / "we ate with [name]"

Explicit mentions (includesSender = false):
- "@[name]"
- "para [name]" / "for [name]"
- "de [name]" / "of [name]" (when indicating who owes)
- "solo [name]" / "only [name]"
- "le pagué el [something] a [name]" (paid for something only that person owes)

EXCLUSION PATTERNS ("todos menos [name]"):

Sometimes users want to split among everyone EXCEPT specific people. Recognize these patterns:

- "todos menos [name]" → excludeFromSplit: ["name"], splitAmong: []
- "todos excepto [name]" → excludeFromSplit: ["name"], splitAmong: []
- "entre todos sin [name]" → excludeFromSplit: ["name"], splitAmong: []
- "para todos menos yo" → excludeFromSplit: [], splitAmong: [], includesSender: false
- "dividí entre todos menos [name] y [name2]" → excludeFromSplit: ["name", "name2"], splitAmong: []

When you detect an exclusion pattern:
1. Set splitAmong to [] (empty - means "everyone")
2. Set excludeFromSplit to the names that should be EXCLUDED
3. Set includesSender based on context (usually true for "todos", false if "menos yo")

Note: "menos yo" or "excepto yo" means the sender excludes themselves, so set includesSender: false and excludeFromSplit: []

SUPPORT QUESTION DETECTION:
- isSupportQuestion: true SOLO si el mensaje es claramente una pregunta general, saludo, consulta de soporte, o texto sin relación a un gasto/pago.
- Ejemplos de isSupportQuestion=true: "hola", "cómo funciona esto", "necesito ayuda", "qué puedo hacer", "no entiendo"
- Ejemplos de isSupportQuestion=false: "150", "pizza", "5 lucas", "le pagué a juan" (cualquier cosa que pueda ser un gasto o pago)
- En caso de duda, usa false.

RESPONSE FORMAT (strict JSON):

For EXPENSE:
{
  "type": "expense",
  "amount": <number>,
  "currency": "ARS" | "USD" | "EUR" | "BRL",
  "description": "<expense description>",
  "splitAmong": ["<name1>", "<name2>"],
  "includesSender": true | false,
  "excludeFromSplit": ["<name to exclude>"],
  "confidence": <0.0 to 1.0>
}

For PAYMENT:
{
  "type": "payment",
  "amount": <number>,
  "currency": "ARS" | "USD" | "EUR" | "BRL",
  "direction": "paid" | "received",
  "person": "<person's name>",
  "confidence": <0.0 to 1.0>
}

For COMMAND:
{
  "type": "command",
  "command": "<command without />",
  "confidence": 1.0
}

For UNKNOWN:
{
  "type": "unknown",
  "confidence": <0.0 to 1.0>,
  "suggestion": "<suggestion for user in Spanish>",
  "isSupportQuestion": true | false
}

CONFIDENCE RULES:
${CONFIDENCE_RULES}

EXAMPLES:

Message: "150 pizza"
{"type":"expense","amount":150,"currency":"ARS","description":"pizza","splitAmong":[],"includesSender":true,"excludeFromSplit":[],"confidence":0.95}

Message: "USD 50 cena @Juan @Maria"
{"type":"expense","amount":50,"currency":"USD","description":"cena","splitAmong":["Juan","Maria"],"includesSender":false,"excludeFromSplit":[],"confidence":0.98}

Message: "Gasté 50 dólares en la cena con juan"
{"type":"expense","amount":50,"currency":"USD","description":"cena","splitAmong":["juan"],"includesSender":true,"excludeFromSplit":[],"confidence":0.9}

Message: "5 lucas el uber"
{"type":"expense","amount":5000,"currency":"ARS","description":"uber","splitAmong":[],"includesSender":true,"excludeFromSplit":[],"confidence":0.9}

Message: "150 pizza con Juan"
{"type":"expense","amount":150,"currency":"ARS","description":"pizza","splitAmong":["Juan"],"includesSender":true,"excludeFromSplit":[],"confidence":0.95}

Message: "150 pizza @Juan"
{"type":"expense","amount":150,"currency":"ARS","description":"pizza","splitAmong":["Juan"],"includesSender":false,"excludeFromSplit":[],"confidence":0.95}

Message: "100 alcohol dividí entre todos menos pipi"
{"type":"expense","amount":100,"currency":"ARS","description":"alcohol","splitAmong":[],"includesSender":true,"excludeFromSplit":["pipi"],"confidence":0.95}

Message: "200 cena para todos excepto juan y maria"
{"type":"expense","amount":200,"currency":"ARS","description":"cena","splitAmong":[],"includesSender":true,"excludeFromSplit":["juan","maria"],"confidence":0.95}

Message: "150 taxi entre todos menos yo"
{"type":"expense","amount":150,"currency":"ARS","description":"taxi","splitAmong":[],"includesSender":false,"excludeFromSplit":[],"confidence":0.95}

Message: "Le pagué 5000 a María"
{"type":"payment","amount":5000,"currency":"ARS","direction":"paid","person":"María","confidence":0.95}

Message: "Recibí 3k de Juan"
{"type":"payment","amount":3000,"currency":"ARS","direction":"received","person":"Juan","confidence":0.9}

Message: "Pablito pagó 5000 a Imanol" (sender is Imanol)
{"type":"payment","amount":5000,"currency":"ARS","direction":"received","person":"Pablito","confidence":0.9}

Message: "Imanol le transfirió 3000 a María" (sender is Imanol)
{"type":"payment","amount":3000,"currency":"ARS","direction":"paid","person":"María","confidence":0.9}

Message: "/balance"
{"type":"command","command":"balance","confidence":1.0}

Message: "Hola"
{"type":"unknown","confidence":0.1,"suggestion":"Hola! Para registrar un gasto, decime el monto y la descripción. Ej: 150 pizza","isSupportQuestion":true}

IMPORTANT:
- Respond ONLY with the JSON, no additional text
- Do not add explanations, only the JSON
- The JSON must be valid and parseable
- If in doubt, use low confidence and suggest clarification
`
  }

  // ─── Finanzas NLP parsing ────────────────────────────────────

  /**
   * Parse a natural language message into structured personal expense data.
   * Uses Gemini 2.5 Flash Lite via SDK with the personal finance prompt.
   */
  async parsePersonalExpenseNL(message: string, userCategories: string[]): Promise<AIPersonalParseResult> {
    const startTime = Date.now()

    try {
      const systemPrompt = this.buildPersonalExpensePrompt(userCategories)
      const fullPrompt = `${systemPrompt}\n\nMensaje del usuario: "${message}"`

      console.log('[AI-FIN] Input:', message)
      console.log('[AI-FIN] User categories:', userCategories.join(', '))

      const responseText = await Promise.race([
        this.generateContent(fullPrompt, { maxOutputTokens: 500, temperature: 0.7 }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
        ),
      ])

      if (!responseText) {
        return { type: 'error', error: 'No response from AI' }
      }

      console.log('[AI-FIN] Raw response:', responseText)
      console.log('[AI-FIN] Latency:', `${Date.now() - startTime}ms`)

      const parsed = this.parsePersonalExpenseResponse(responseText)
      console.log('[AI-FIN] Parsed result:', JSON.stringify(parsed))
      return parsed
    } catch (error) {
      console.error('[AI-FIN] Error:', error)
      console.log('[AI-FIN] Latency (error):', `${Date.now() - startTime}ms`)
      return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private parsePersonalExpenseResponse(responseText: string): AIPersonalParseResult {
    try {
      let jsonStr = responseText
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) jsonStr = jsonMatch[1].trim()

      const parsed = JSON.parse(jsonStr)
      if (!parsed.type) throw new Error('Missing type in response')

      if (parsed.type === 'personal_expense') return this.validatePersonalExpenseResult(parsed)
      return this.validateUnknownResult(parsed)
    } catch {
      return { type: 'unknown', confidence: 0, suggestion: 'No pude entender el mensaje', isSupportQuestion: false }
    }
  }

  private validatePersonalExpenseResult(p: Record<string, unknown>): AIPersonalExpenseResult {
    return {
      type: 'personal_expense',
      amount: typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0,
      currency: this.validateCurrency(p.currency),
      title: typeof p.title === 'string' ? p.title.slice(0, 30) : '',
      category: typeof p.category === 'string' ? p.category : 'Otros',
      description: typeof p.description === 'string' ? p.description : '',
      isRecurrent: typeof p.isRecurrent === 'boolean' ? p.isRecurrent : false,
      frequency: this.validateFrequency(p.frequency),
      confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.5,
    }
  }

  private validateFrequency(freq: unknown): 'monthly' | 'weekly' | 'biweekly' | 'yearly' | null {
    const valid = ['monthly', 'weekly', 'biweekly', 'yearly']
    if (typeof freq === 'string' && valid.includes(freq)) return freq as any
    return null
  }

  private buildPersonalExpensePrompt(userCategories: string[]): string {
    const categoriesList = userCategories.length > 0
      ? userCategories.join(', ')
      : 'Supermercado, Salidas, Transporte, Servicios, Suscripciones, Otros'

    return `You are an assistant that extracts personal expense information from messages in Argentine Spanish.

TASK: Analyze the user's message and extract structured data for a personal finance tracker.

MESSAGE TYPES:

1. PERSONAL EXPENSE (personal_expense): User registers a personal expense
   - Keywords: "gasté", "pagué", "compré", amount + description, "$amount title"
   - Example: "Gasté 150 en pizza", "5 lucas el uber", "$1500 café #comida"

2. UNKNOWN (unknown): Cannot determine what the user wants
   - Ambiguous messages, greetings, questions

USER'S CATEGORIES (match to the closest one):
${categoriesList}

ARGENTINE SPANISH DICTIONARY:

${ARGENTINE_DICTIONARY}

CURRENCY RULES:
${CURRENCY_RULES}

RECURRENT DETECTION RULES:
- Keywords: "mensual", "semanal", "quincenal", "anual", "todos los meses", "cada mes", "por mes"
- Service heuristics (auto-detect as monthly if title matches):
  netflix, spotify, disney, hbo, amazon prime, youtube premium,
  luz, gas, agua, internet, telefono, celular,
  alquiler, expensas, gym, gimnasio, monotributo, prepaga, obra social, seguro, abono
- frequency: "monthly" | "weekly" | "biweekly" | "yearly" | null

TITLE RULES:
- Short: max 30 characters
- Capitalize first letter
- Descriptive but concise
- Example: "Café", "Uber al trabajo", "Netflix mensual"

DESCRIPTION RULES:
- Extract from "d:" prefix if present (e.g. "d:cumple de juan" → description: "cumple de juan")
- Otherwise use any extra context from the message
- Can be empty string

CATEGORY MATCHING:
- Match to the closest category from the user's list above
- Use partial matching: "super" → "Supermercado", "sal" → "Salidas"
- If no category is specified or matched, use "Otros"
- If a #hashtag is present, use it as the category hint

SUPPORT QUESTION DETECTION:
- isSupportQuestion: true SOLO si el mensaje es claramente una pregunta general, saludo, consulta de soporte, o texto sin relación a un gasto/pago.
- Ejemplos de isSupportQuestion=true: "hola", "cómo funciona esto", "necesito ayuda", "qué puedo hacer", "no entiendo"
- Ejemplos de isSupportQuestion=false: "150", "pizza", "5 lucas", "pagué el netflix" (cualquier cosa que pueda ser un gasto)
- En caso de duda, usa false.

RESPONSE FORMAT (strict JSON):

For PERSONAL EXPENSE:
{
  "type": "personal_expense",
  "amount": <number>,
  "currency": "ARS" | "USD" | "EUR" | "BRL",
  "title": "<short expense title>",
  "category": "<best matching category>",
  "description": "<optional detail>",
  "isRecurrent": true | false,
  "frequency": "monthly" | "weekly" | "biweekly" | "yearly" | null,
  "confidence": <0.0 to 1.0>
}

For UNKNOWN:
{
  "type": "unknown",
  "confidence": <0.0 to 1.0>,
  "suggestion": "<suggestion for user in Spanish>",
  "isSupportQuestion": true | false
}

CONFIDENCE RULES:
${CONFIDENCE_RULES}

EXAMPLES:

Message: "$1500 café #comida"
{"type":"personal_expense","amount":1500,"currency":"ARS","title":"Café","category":"Comida","description":"","isRecurrent":false,"frequency":null,"confidence":0.98}

Message: "gasté 2 lucas en uber"
{"type":"personal_expense","amount":2000,"currency":"ARS","title":"Uber","category":"Transporte","description":"","isRecurrent":false,"frequency":null,"confidence":0.92}

Message: "50 dólares la cena"
{"type":"personal_expense","amount":50,"currency":"USD","title":"Cena","category":"Salidas","description":"","isRecurrent":false,"frequency":null,"confidence":0.9}

Message: "pagué el netflix"
{"type":"personal_expense","amount":0,"currency":"ARS","title":"Netflix","category":"Suscripciones","description":"","isRecurrent":true,"frequency":"monthly","confidence":0.6}

Message: "5k super d:compra semanal"
{"type":"personal_expense","amount":5000,"currency":"ARS","title":"Super","category":"Supermercado","description":"compra semanal","isRecurrent":false,"frequency":null,"confidence":0.92}

Message: "alquiler mensual 350 lucas"
{"type":"personal_expense","amount":350000,"currency":"ARS","title":"Alquiler","category":"Vivienda","description":"","isRecurrent":true,"frequency":"monthly","confidence":0.95}

Message: "1200 birras con los pibes"
{"type":"personal_expense","amount":1200,"currency":"ARS","title":"Birras","category":"Salidas","description":"con los pibes","isRecurrent":false,"frequency":null,"confidence":0.88}

Message: "prepaga del mes 45k"
{"type":"personal_expense","amount":45000,"currency":"ARS","title":"Prepaga","category":"Salud","description":"","isRecurrent":true,"frequency":"monthly","confidence":0.93}

Message: "monotributo"
{"type":"personal_expense","amount":0,"currency":"ARS","title":"Monotributo","category":"Impuestos","description":"","isRecurrent":true,"frequency":"monthly","confidence":0.5}

Message: "hola"
{"type":"unknown","confidence":0.1,"suggestion":"Hola! Para registrar un gasto, decime el monto y la descripción. Ej: $500 café #comida","isSupportQuestion":true}

IMPORTANT:
- Respond ONLY with the JSON, no additional text
- Do not add explanations, only the JSON
- The JSON must be valid and parseable
- If in doubt, use low confidence and suggest clarification
- For amounts with "lucas" or "k", multiply by 1000
- If amount is 0 or unclear, set confidence below 0.7
`
  }

  // ─── Finanzas AI methods ──────────────────────────────────────

  /** Audio transcription + expense extraction */
  async transcribeAudio(base64: string, mimeType: string, userCategories: string[] = []): Promise<TranscriptionResult | null> {
    const categoriesList = userCategories.length > 0
      ? `Categorias del usuario: ${userCategories.join(', ')}`
      : ''

    const today = new Date().toISOString().slice(0, 10)
    const year = new Date().getFullYear()

    const parts = [
      { inlineData: { mimeType, data: base64 } },
      {
        text: `Transcribi este audio en español argentino. El audio describe un gasto o compra.
Hoy es ${today} (año ${year}).

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "transcription": "texto completo transcrito",
  "title": "titulo corto del gasto (max 30 chars)",
  "items": ["item1", "item2"],
  "totalAmount": 0,
  "description": "descripcion breve si la hay",
  "category": "categoria sugerida",
  "date": "fecha en formato YYYY-MM-DD o null"
}

${categoriesList}

Si no podes determinar el monto, usa 0.
Si no podes determinar la categoria, usa "Otros".
El titulo debe ser conciso y descriptivo.
Si el audio menciona una fecha (ej: "ayer", "el martes", "el 5"), convertila a YYYY-MM-DD usando la fecha de hoy como referencia. Si no menciona fecha, usa null.`
      },
    ]

    const text = await this.generateContent(null, { maxOutputTokens: 1000, temperature: 0.3, parts })
    if (!text) return null
    return this.parseJSON<TranscriptionResult>(text, 'transcribeAudio')
  }

  /** Bank transfer receipt image parsing */
  async parseTransferImage(base64: string, mimeType: string): Promise<TransferResult | null> {
    const today = new Date().toISOString().slice(0, 10)
    const year = new Date().getFullYear()

    const parts = [
      { inlineData: { mimeType, data: base64 } },
      {
        text: `Analiza este comprobante de pago o transferencia bancaria argentina.
Hoy es ${today}.

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "amount": 0,
  "recipientName": "nombre del destinatario o comercio",
  "recipientCBU": "CBU o CVU si aparece",
  "recipientAlias": "alias si aparece",
  "recipientBank": "banco del destinatario",
  "senderBank": "banco del emisor",
  "date": "fecha en formato YYYY-MM-DD",
  "reference": "numero de referencia o comprobante",
  "concept": "concepto o categoria si aparece"
}

IMPORTANTE sobre montos argentinos:
- Los montos usan punto como separador de miles: $67.506 = sesenta y siete mil quinientos seis
- Los decimales a veces aparecen en tamaño chico/superindice al lado del monto principal. Ej: "$67.506⁰⁸" o "$67.506,08" significa 67506.08 (sesenta y siete mil quinientos seis con 08 centavos)
- NUNCA interpretes los puntos como decimales. En Argentina el punto es separador de miles.
- El monto debe ser un numero con decimales si los hay (ej: 67506.08), sin signos ni separadores de miles.

Si la fecha no muestra año, asumi ${year}.
Si algun campo no esta visible o no se puede determinar, usa null.`
      },
    ]

    const text = await this.generateContent(null, { maxOutputTokens: 1000, temperature: 0.3, parts })
    if (!text) return null
    return this.parseJSON<TransferResult>(text, 'parseTransferImage')
  }

  /** Bank transfer PDF parsing (same logic, different prompt mention) */
  async parseTransferPDF(base64: string, mimeType: string): Promise<TransferResult | null> {
    const today = new Date().toISOString().slice(0, 10)
    const year = new Date().getFullYear()

    const parts = [
      { inlineData: { mimeType: mimeType || 'application/pdf', data: base64 } },
      {
        text: `Analiza este comprobante de pago o transferencia bancaria argentina en PDF.
Hoy es ${today}.

Extrae la siguiente informacion y devolvela SOLO como JSON valido, sin markdown ni texto extra:
{
  "amount": 0,
  "recipientName": "nombre del destinatario o comercio",
  "recipientCBU": "CBU o CVU si aparece",
  "recipientAlias": "alias si aparece",
  "recipientBank": "banco del destinatario",
  "senderBank": "banco del emisor",
  "date": "fecha en formato YYYY-MM-DD",
  "reference": "numero de referencia o comprobante",
  "concept": "concepto o categoria si aparece"
}

IMPORTANTE sobre montos argentinos:
- Los montos usan punto como separador de miles: $67.506 = sesenta y siete mil quinientos seis
- Los decimales a veces aparecen en tamaño chico/superindice al lado del monto principal. Ej: "$67.506⁰⁸" o "$67.506,08" significa 67506.08 (sesenta y siete mil quinientos seis con 08 centavos)
- NUNCA interpretes los puntos como decimales. En Argentina el punto es separador de miles.
- El monto debe ser un numero con decimales si los hay (ej: 67506.08), sin signos ni separadores de miles.

Si la fecha no muestra año, asumi ${year}.
Si algun campo no esta visible o no se puede determinar, usa null.`
      },
    ]

    const text = await this.generateContent(null, { maxOutputTokens: 1000, temperature: 0.3, parts })
    if (!text) return null
    return this.parseJSON<TransferResult>(text, 'parseTransferPDF')
  }

  /** Classify expense into user's categories */
  async categorizeExpense(title: string, description: string, userCategories: string[] = []): Promise<string> {
    if (userCategories.length === 0) return 'Otros'

    const prompt = `Clasifica este gasto en una de las categorias del usuario.

Gasto: "${title}"${description ? ` - ${description}` : ''}

Categorias disponibles: ${userCategories.join(', ')}

Responde SOLO con el nombre exacto de la categoria que mejor aplique. Si ninguna aplica, responde "Otros".`

    const text = await this.generateContent(prompt, { maxOutputTokens: 50, temperature: 0.2 })
    if (!text) return 'Otros'

    const result = text.trim()
    const match = userCategories.find(c => c.toLowerCase() === result.toLowerCase())
    return match || 'Otros'
  }

  /** 3-month financial health analysis */
  async getFinancialAnalysis(dataSummary: {
    months: string[]
    totalPayments: number
    totalRecurrent: number
    recurrentCount: number
    monthlyData: Record<string, { total: number; count: number; byCategory: Record<string, number> }>
    recurrents: Array<{ title: string; amount: number; category: string }>
  }): Promise<string> {
    const prompt = `Eres un asesor financiero personal amigable. Analiza los siguientes datos de gastos de un usuario argentino y proporciona feedback conciso sobre su salud financiera.

DATOS DEL USUARIO:
- Meses analizados: ${dataSummary.months.join(', ')}
- Total de pagos registrados: ${dataSummary.totalPayments}
- Gastos fijos mensuales: $${dataSummary.totalRecurrent} (${dataSummary.recurrentCount} fijos)

GASTOS POR MES:
${Object.entries(dataSummary.monthlyData).map(([month, info]) =>
  `${month}: $${info.total.toLocaleString('es-AR')} (${info.count} pagos)
   Categorias: ${Object.entries(info.byCategory).map(([cat, amt]) => `${cat}: $${(amt as number).toLocaleString('es-AR')}`).join(', ')}`
).join('\n\n')}

GASTOS FIJOS PRINCIPALES:
${dataSummary.recurrents.map(r => `- ${r.title}: $${r.amount.toLocaleString('es-AR')} (${r.category})`).join('\n')}

INSTRUCCIONES:
1. Analiza tendencias de gasto (subiendo, bajando, estable)
2. Identifica categorias con mayor gasto. Identifica posible gastos irresponsables, evitables o anomalos
3. Evalua la proporcion de gastos fijos vs variables
4. Da 2-3 consejos practicos y especificos
5. Usa un tono amigable y motivador. No marques errores ni juzgues los habitos. Sos el aliado que quiere ayudar.
6. NO uses emojis
7. Responde en espanol argentino
8. Manten la respuesta CORTA (max 800 caracteres) para WhatsApp
9. Usa *asteriscos* para negritas
10. Si aplica, haz notar algun patron interesante en los datos

Responde directamente con el analisis, sin introduccion.`

    const text = await this.generateContent(prompt, { maxOutputTokens: 500, temperature: 0.7 })
    return text || 'No se pudo completar el analisis. Intenta nuevamente.'
  }

  // ─── Support AI methods ────────────────────────────────────────

  /** FAQ entry type for support questions */
  async answerSupportQuestion(
    question: string,
    faqEntries: Array<{ topic: string; question: string; answer: string }>,
    conversationHistory: Array<{ question: string; answer: string }> = []
  ): Promise<{ answer: string; noAnswer: boolean } | null> {
    const faqContext = faqEntries
      .map(entry => `Tema: ${entry.topic}\nPregunta: ${entry.question}\nRespuesta: ${entry.answer}`)
      .join('\n\n---\n\n')

    let historyBlock = ''
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-3)
      historyBlock = '\nConversacion previa:\n' +
        recent.map(qa => `Usuario: ${qa.question}\nAsistente: ${qa.answer}`).join('\n\n') +
        '\n'
    }

    const prompt = `Sos un asistente de soporte de "text the check", una app financiera para Argentina/Latinoamérica con dos modos:

Contexto de la plataforma:
- *Grupos*: dividir gastos entre amigos (tipo Splitwise). Se registran gastos por WhatsApp, se dividen automáticamente, se pueden hacer @menciones para dividir entre personas específicas, "todos menos X", pagos entre personas, ver balances.
- *Finanzas*: registrar gastos personales. Se pueden enviar textos, audios, fotos de comprobantes o PDFs. Categorización automática, gastos fijos/recurrentes, resúmenes mensuales, análisis financiero con IA.
- El usuario interactúa principalmente por WhatsApp enviando mensajes al bot.
- También hay un dashboard web en textthecheck.app donde se pueden ver y editar gastos.
- Comandos disponibles: /ayuda, /balance, /lista, /grupo, /modo, /resumen, /fijos, /categorias, /analisis, /borrar
- Para vincular WhatsApp: generar código en la app → enviar "VINCULAR <código>" por WhatsApp
- Se puede cambiar entre modos con /modo grupos o /modo finanzas

Tu rol es responder consultas usando UNICAMENTE la información del FAQ y el contexto de arriba. No inventes información.

Reglas:
- Respondé en español argentino informal (vos, tenés, podés, etc.)
- Sé conciso y claro (máximo 3-4 oraciones)
- Si la pregunta no se puede responder con el FAQ ni el contexto, respondé con "noAnswer": true y en "answer" poné un mensaje amable indicando que no tenés esa información
- No uses formato HTML, solo texto plano y *negritas* para énfasis
- Si el usuario pregunta sobre precios o costos del servicio, respondé con "noAnswer": true
- Siempre referite a la plataforma como "text the check"
- Sé amable y empático. Si el usuario está frustrado, reconocé su situación antes de responder
- Nunca prometas funcionalidades futuras ni des información que no está en el FAQ
- Usá un tono cercano y profesional, como un compañero de trabajo que te ayuda

FAQ:
${faqContext}
${historyBlock}
Pregunta del usuario: "${question}"

Respondé SOLO con JSON válido en este formato:
{"answer": "tu respuesta", "noAnswer": false}

Si no podés responder:
{"answer": "mensaje amable", "noAnswer": true}`

    const text = await this.generateContent(prompt, {
      maxOutputTokens: 500,
      temperature: 0.3,
    })

    if (!text) return null
    return this.parseJSON<{ answer: string; noAnswer: boolean }>(text, 'answerSupportQuestion')
  }

  /** Weekly summary insight */
  async getWeeklyInsight(weeklyStats: {
    pastWeek: { count: number; amount: number; paidCount: number; unpaidCount: number; unpaidAmount: number }
    nextWeek: { count: number; amount: number; paidCount: number; unpaidCount: number; unpaidAmount: number }
    totalUnpaidAmount: number
    paidThisMonth: number
    unpaidThisMonth: number
    totalPaidAmount: number
    oneTimeCount: number
    oneTimeAmount: number
  }): Promise<string | null> {
    const { pastWeek, nextWeek } = weeklyStats

    const prompt = `Sos un asesor financiero personal amigable. Analizá los datos semanales de un usuario argentino y armá un resumen breve con dos partes:

1. RESUMEN: En 2-3 oraciones contá qué pasó la semana pasada y qué se viene. Mencioná qué fue lo más pesado, qué estuvo tranquilo, si viene bien o atrasado con los pagos.
2. TIPS: 1-2 comentarios genéricos, amigables y motivadores. NO sugieras acciones concretas (no "pagá tal cosa", "revisá tal otra"). Solo observaciones positivas o datos curiosos sobre sus finanzas.

DATOS:
- Semana pasada: ${pastWeek.count} pagos por $${pastWeek.amount.toLocaleString('es-AR')} (${pastWeek.paidCount} pagados, ${pastWeek.unpaidCount} pendientes por $${pastWeek.unpaidAmount.toLocaleString('es-AR')})
- Semana entrante: ${nextWeek.count} pagos por $${nextWeek.amount.toLocaleString('es-AR')} (${nextWeek.paidCount} pagados, ${nextWeek.unpaidCount} pendientes por $${nextWeek.unpaidAmount.toLocaleString('es-AR')})
- Total pendiente ambas semanas: $${weeklyStats.totalUnpaidAmount.toLocaleString('es-AR')}
- Pagados este mes: ${weeklyStats.paidThisMonth}
- Pendientes este mes: ${weeklyStats.unpaidThisMonth}
- Total pagado este mes: $${weeklyStats.totalPaidAmount.toLocaleString('es-AR')}
- Gastos únicos este mes: ${weeklyStats.oneTimeCount} por $${weeklyStats.oneTimeAmount.toLocaleString('es-AR')}

REGLAS:
- Español argentino, tono amigable y cercano
- Sin emojis
- No uses encabezados ni listas, escribí todo como texto corrido
- Separá el resumen de los tips con un salto de línea
- Máximo 600 caracteres en total
- Respondé directamente, sin introducción`

    return await this.generateContent(prompt, { maxOutputTokens: 350, temperature: 0.8 })
  }
}
