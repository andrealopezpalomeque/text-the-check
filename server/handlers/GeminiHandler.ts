/**
 * GeminiHandler — all AI operations for both Grupos and Finanzas.
 *
 * Grupos: NL expense/payment parsing via Gemini 2.0 Flash (SDK).
 * Finanzas: audio transcription, image/PDF receipt parsing, categorization,
 *           financial analysis, weekly insight via Gemini 2.5 Flash Lite (SDK).
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

// ─── Config ────────────────────────────────────────────────────────

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '5000', 10)
const AI_CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7')

// ─── Handler class ─────────────────────────────────────────────────

export default class GeminiHandler {
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string

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

  // ─── Shared internals ─────────────────────────────────────────

  /**
   * Generic content generation. Supports text-only and multimodal (inline base64).
   * Uses raw fetch for pay-trackr-style multimodal (parts with inlineData),
   * and SDK for text-only or grupos-style calls.
   */
  private async generateContent(
    prompt: string | null,
    options: {
      maxOutputTokens?: number
      temperature?: number
      parts?: any[]
      model?: string
    } = {}
  ): Promise<string | null> {
    const { maxOutputTokens = 500, temperature = 0.7, parts, model = 'gemini-2.5-flash-lite' } = options

    try {
      // If parts are provided (multimodal), use raw API like pay-trackr
      if (parts) {
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models'
        const response = await fetch(
          `${baseUrl}/${model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { maxOutputTokens, temperature },
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[GEMINI] API ${response.status}: ${errorText.slice(0, 150)}`)
          Sentry.captureMessage('Gemini API error', { level: 'error', extra: { status: response.status, body: errorText } })
          return null
        }

        const result: any = await response.json()
        return result.candidates?.[0]?.content?.parts?.[0]?.text || null
      }

      // Text-only: use SDK
      const genModel = this.getModel(model)
      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt! }] }],
        generationConfig: { maxOutputTokens, temperature },
      })
      return result.response.text().trim() || null
    } catch (error) {
      console.error(`[GEMINI] Request failed:`, error)
      Sentry.captureException(error)
      return null
    }
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
  async parseExpenseNL(message: string, groupMembers: MemberInfo[]): Promise<AIParseResult> {
    const startTime = Date.now()

    try {
      const model = this.getModel('gemini-2.0-flash')
      const systemPrompt = this.buildExtractionPrompt(groupMembers)

      console.log('[AI] Input:', message)
      console.log('[AI] Group members:', groupMembers.map(m => `${m.name} (${(m.aliases || []).join(', ')})`))

      const result = await Promise.race([
        model.generateContent([
          { text: systemPrompt },
          { text: `Mensaje del usuario: "${message}"` },
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
        ),
      ])

      const responseText = result.response.text().trim()
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
      return { type: 'unknown', confidence: 0, suggestion: 'No pude entender el mensaje' }
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
  private buildExtractionPrompt(groupMembers: MemberInfo[]): string {
    let membersList: string
    if (groupMembers.length === 0) {
      membersList = 'No registered members'
    } else {
      membersList = groupMembers.map(m => {
        const aliases = m.aliases || []
        return aliases.length > 0 ? `${m.name} (aliases: ${aliases.join(', ')})` : m.name
      }).join('\n')
    }

    return `You are an assistant that extracts expense and payment information from messages in Argentine Spanish.

TASK: Analyze the user's message and extract structured data.

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

3. COMMAND (command): User wants to execute a bot command
   - Start with "/"
   - Example: "/balance", "/grupo", "/ayuda", "/lista"

4. UNKNOWN (unknown): Cannot determine what the user wants
   - Ambiguous messages, greetings, questions

ARGENTINE SPANISH DICTIONARY:

| Term | Meaning |
|------|---------|
| lucas, luquitas | thousands (5 lucas = 5000) |
| k | thousands (5k = 5000) |
| mangos | Argentine pesos |
| guita, plata | money |
| morfi | food |
| birra | beer |
| bondi | bus |
| dólar blue | informal dollar |
| dol, dólar, dolares, usd | US dollars |
| euro, eur | euros |
| real, reais, brl | Brazilian reais |
| pe, pes | pesos (abbreviation) |

CURRENCY RULES:
- Default to ARS (Argentine pesos)
- "dólares", "dol", "usd", "dolares" → USD
- "euros", "eur" → EUR
- "reales", "reais", "brl" → BRL
- "pesos", "mangos", "pe" → ARS

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
  "suggestion": "<suggestion for user in Spanish>"
}

CONFIDENCE RULES:
- 0.95-1.0: Very clear message, explicit amount and description
- 0.8-0.94: Clear message but uses slang or abbreviations
- 0.7-0.79: Understandable message but somewhat ambiguous
- <0.7: Very ambiguous message, better to ask for clarification

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

Message: "/balance"
{"type":"command","command":"balance","confidence":1.0}

Message: "Hola"
{"type":"unknown","confidence":0.1,"suggestion":"Hola! Para registrar un gasto, decime el monto y la descripción. Ej: 150 pizza"}

IMPORTANT:
- Respond ONLY with the JSON, no additional text
- Do not add explanations, only the JSON
- The JSON must be valid and parseable
- If in doubt, use low confidence and suggest clarification
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
