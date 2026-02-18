import type { ParsedExpense, ExpenseCategory, ParsedPayment } from '../types/index.js'

/**
 * Parse expense from WhatsApp message
 * Expected format: "50 lunch at beach"
 * Returns: { amount: 50, description: "lunch at beach" }
 */
export const parseExpenseMessage = (message: string): ParsedExpense => {
  // Trim and normalize
  const normalized = message.trim()

  // Extract mentions
  const mentions: string[] = []
  // Regex to match @Name (alphanumeric)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const cleanMessage = normalized.replace(mentionRegex, (_match, name) => {
    mentions.push(name)
    return '' // Remove mention from text
  }).trim()

  // Attempt to match: number followed by description
  // Regex: ^(\d+(?:\.\d+)?)\s+(.+)$
  const match = cleanMessage.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/i)

  if (!match) {
    return {
      amount: 0,
      description: message,
      splitAmong: [],
      needsReview: true
    }
  }

  const amountStr = match[1].replace(',', '.')
  const amount = parseFloat(amountStr)
  const description = match[2].trim()

  // Auto-categorize based on keywords
  const category = categorizeExpense(description)

  return {
    amount,
    description,
    category,
    splitAmong: mentions,
    needsReview: false
  }
}

/**
 * Automatically categorize expense based on keywords
 */
const categorizeExpense = (description: string): ExpenseCategory => {
  const keywords: Record<ExpenseCategory, string[]> = {
    food: [
      'lunch', 'almuerzo', 'dinner', 'cena', 'breakfast', 'desayuno',
      'comida', 'restaurant', 'restaurante', 'pizza', 'burger',
      'coffee', 'café', 'beer', 'cerveza', 'drink', 'bebida',
      'snack', 'groceries', 'supermercado', 'market', 'mercado'
    ],
    transport: [
      'taxi', 'uber', 'bus', 'colectivo', 'train', 'tren',
      'metro', 'subway', 'flight', 'vuelo', 'car', 'auto',
      'rental', 'alquiler', 'gas', 'nafta', 'parking', 'estacionamiento'
    ],
    accommodation: [
      'hotel', 'airbnb', 'hostel', 'alojamiento', 'lodging',
      'rent', 'alquiler', 'house', 'casa', 'apartment', 'apartamento'
    ],
    entertainment: [
      'ticket', 'entrada', 'show', 'espectaculo', 'museum', 'museo',
      'tour', 'excursion', 'excursión', 'activity', 'actividad',
      'game', 'juego', 'movie', 'cine', 'theater', 'teatro',
      'club', 'bar', 'disco', 'party', 'fiesta'
    ],
    general: []
  }

  const lowerDesc = description.toLowerCase()

  for (const [category, words] of Object.entries(keywords)) {
    if (category === 'general') continue

    for (const word of words) {
      if (lowerDesc.includes(word)) {
        return category as ExpenseCategory
      }
    }
  }

  return 'general'
}

/**
 * Currency words mapping
 */
const CURRENCY_WORDS: Record<string, string> = {
  // USD
  usd: 'USD',
  dollar: 'USD',
  dollars: 'USD',
  dolar: 'USD',
  dolares: 'USD',
  // EUR
  eur: 'EUR',
  euro: 'EUR',
  euros: 'EUR',
  // BRL
  brl: 'BRL',
  real: 'BRL',
  reais: 'BRL',
  reales: 'BRL',
  // ARS (treated as no conversion needed)
  ars: 'ARS',
  peso: 'ARS',
  pesos: 'ARS'
}

// Regex pattern for all currency words
const CURRENCY_PATTERN = Object.keys(CURRENCY_WORDS).join('|')

/**
 * Extract currency conversion if mentioned
 * Supports formats:
 * - "100 usd lunch" (amount currency description)
 * - "usd 100 lunch" (currency amount description)
 * - "100 euro lunch" (amount currencyWord description)
 * - "euro 100 lunch" (currencyWord amount description)
 */
export const extractCurrency = (message: string): { amount: number; currency: string } | null => {
  // Pattern 1: amount followed by currency word (e.g., "100 usd", "50 euro")
  const pattern1 = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${CURRENCY_PATTERN})\\b`, 'i')
  // Pattern 2: currency word followed by amount (e.g., "usd 100", "euro 50")
  const pattern2 = new RegExp(`\\b(${CURRENCY_PATTERN})\\s*(\\d+(?:[.,]\\d+)?)`, 'i')

  let amount: number
  let rawCurrency: string

  const match1 = message.match(pattern1)
  const match2 = message.match(pattern2)

  if (match1) {
    amount = parseFloat(match1[1].replace(',', '.'))
    rawCurrency = match1[2].toLowerCase()
  } else if (match2) {
    rawCurrency = match2[1].toLowerCase()
    amount = parseFloat(match2[2].replace(',', '.'))
  } else {
    return null
  }

  const currency = CURRENCY_WORDS[rawCurrency] || rawCurrency.toUpperCase()

  // Don't return for ARS since no conversion needed
  if (currency === 'ARS') {
    return null
  }

  return { amount, currency }
}

/**
 * Strip currency words from description
 */
export const stripCurrencyFromDescription = (description: string): string => {
  const pattern = new RegExp(`\\b(${CURRENCY_PATTERN})\\b`, 'gi')
  return description.replace(pattern, '').replace(/\s+/g, ' ').trim()
}

/**
 * Convert supported currencies to ARS
 * NOTE: This function has been moved to services/exchangeRateService.ts
 * The new version uses live exchange rates from DolarApi.com with caching
 *
 * @deprecated Use convertToARS from services/exchangeRateService.ts instead
 */

/**
 * Parse payment message from WhatsApp
 * Supports patterns like:
 * - "pagué 5000 @Maria" / "pague 5000 @Maria" (I paid Maria)
 * - "recibí 5000 @Juan" / "recibi 5000 @Juan" (I received from Juan)
 *
 * @returns ParsedPayment if the message is a payment, null otherwise
 */
export const parsePaymentMessage = (message: string): ParsedPayment | null => {
  const normalized = message.trim().toLowerCase()

  // Payment keywords (with and without accents)
  const paidKeywords = ['pagué', 'pague', 'le pagué', 'le pague']
  const receivedKeywords = ['recibí', 'recibi', 'me pagó', 'me pago']

  // Extract mentions first
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const mentions: string[] = []
  let match
  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1])
  }

  // Check if it's a payment message
  let paymentType: 'paid' | 'received' | null = null

  for (const keyword of paidKeywords) {
    if (normalized.startsWith(keyword)) {
      paymentType = 'paid'
      break
    }
  }

  if (!paymentType) {
    for (const keyword of receivedKeywords) {
      if (normalized.startsWith(keyword)) {
        paymentType = 'received'
        break
      }
    }
  }

  // Not a payment message
  if (!paymentType) {
    return null
  }

  // Extract amount (number in the message)
  const amountMatch = message.match(/(\d+(?:[.,]\d+)?)/g)
  if (!amountMatch || amountMatch.length === 0) {
    return null
  }

  const amountStr = amountMatch[0].replace(',', '.')
  const amount = parseFloat(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return null
  }

  // Must have exactly one mention
  if (mentions.length !== 1) {
    return null
  }

  return {
    type: paymentType,
    amount,
    mention: mentions[0]
  }
}

/**
 * Check if a message is a payment command (quick check before full parsing)
 */
export const isPaymentMessage = (message: string): boolean => {
  const normalized = message.trim().toLowerCase()
  const paymentKeywords = [
    'pagué', 'pague', 'le pagué', 'le pague',
    'recibí', 'recibi', 'me pagó', 'me pago'
  ]

  return paymentKeywords.some(keyword => normalized.startsWith(keyword))
}
