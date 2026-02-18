/**
 * AI Service using Google Gemini for natural language understanding
 *
 * Responsibilities:
 * - Parse natural language expense/payment messages
 * - Return structured data for existing services to process
 * - Handle timeouts and errors gracefully
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildExtractionPrompt, type MemberInfo } from '../prompts/expenseExtraction.js'

// Re-export MemberInfo for callers
export type { MemberInfo } from '../prompts/expenseExtraction.js'

// Types for AI responses
export interface AIExpenseResult {
  type: 'expense'
  amount: number
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL'
  description: string
  splitAmong: string[]  // Raw names/mentions to resolve
  includesSender: boolean  // Whether the sender should be included in the split
  excludeFromSplit: string[]  // Names to exclude when using "todos menos [name]" pattern
  confidence: number
}

export interface AIPaymentResult {
  type: 'payment'
  amount: number
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL'
  direction: 'paid' | 'received'  // "pagué" vs "recibí"
  person: string  // Raw name to resolve
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

// Configuration from environment
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '5000', 10)
const AI_CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7')

// Gemini client (lazy initialized)
let genAI: GoogleGenerativeAI | null = null

/**
 * Initialize the Gemini client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Check if AI is enabled and available
 */
export function isAIEnabled(): boolean {
  const enabled = process.env.AI_ENABLED === 'true'
  const hasApiKey = !!process.env.GEMINI_API_KEY
  return enabled && hasApiKey
}

/**
 * Get the confidence threshold from environment
 */
export function getConfidenceThreshold(): number {
  return AI_CONFIDENCE_THRESHOLD
}

/**
 * Parse a message using AI
 *
 * @param message - The user's message
 * @param groupMembers - Members with names and aliases for context
 * @returns Parsed result with type, data, and confidence
 */
export async function parseMessageWithAI(
  message: string,
  groupMembers: MemberInfo[]
): Promise<AIParseResult> {
  const startTime = Date.now()

  try {
    // Get the Gemini client
    const ai = getGenAI()
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Log input
    console.log('[AI] Input:', message)
    console.log('[AI] Group members:', groupMembers.map(m => `${m.name} (${(m.aliases || []).join(', ')})`))

    // Build the prompt
    const systemPrompt = buildExtractionPrompt(groupMembers)

    // Create the request with timeout
    const result = await Promise.race([
      model.generateContent([
        { text: systemPrompt },
        { text: `Mensaje del usuario: "${message}"` }
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)
      )
    ])

    // Extract the response text
    const response = result.response
    const responseText = response.text().trim()

    // Log response
    console.log('[AI] Raw response:', responseText)
    console.log('[AI] Latency:', `${Date.now() - startTime}ms`)

    // Parse the JSON response
    const parsed = parseAIResponse(responseText)

    console.log('[AI] Parsed result:', JSON.stringify(parsed))

    return parsed
  } catch (error) {
    console.error('[AI] Error:', error)
    console.log('[AI] Latency (error):', `${Date.now() - startTime}ms`)

    // Return error type so caller knows to fall back to regex
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      type: 'error',
      error: errorMessage
    }
  }
}

/**
 * Parse the AI response JSON
 *
 * @param responseText - Raw text response from Gemini
 * @returns Parsed AIParseResult
 */
function parseAIResponse(responseText: string): AIParseResult {
  try {
    // Try to extract JSON from the response
    // Sometimes the model wraps it in markdown code blocks
    let jsonStr = responseText

    // Remove markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    // Validate the response structure
    if (!parsed.type) {
      throw new Error('Missing type in response')
    }

    // Validate and normalize based on type
    switch (parsed.type) {
      case 'expense':
        return validateExpenseResult(parsed)
      case 'payment':
        return validatePaymentResult(parsed)
      case 'command':
        return validateCommandResult(parsed)
      case 'unknown':
      default:
        return validateUnknownResult(parsed)
    }
  } catch (error) {
    console.error('[AI] Failed to parse response:', error)
    return {
      type: 'unknown',
      confidence: 0,
      suggestion: 'No pude entender el mensaje'
    }
  }
}

/**
 * Validate and normalize expense result
 */
function validateExpenseResult(parsed: Record<string, unknown>): AIExpenseResult {
  const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(String(parsed.amount)) || 0
  const currency = validateCurrency(parsed.currency)
  const description = typeof parsed.description === 'string' ? parsed.description : ''
  const splitAmong = Array.isArray(parsed.splitAmong)
    ? parsed.splitAmong.filter((s): s is string => typeof s === 'string')
    : []
  // Default to true when no mentions (split among everyone including sender)
  // or when not specified (backwards compatibility)
  const includesSender = typeof parsed.includesSender === 'boolean'
    ? parsed.includesSender
    : true
  // Names to exclude from "everyone" when using "todos menos [name]" pattern
  const excludeFromSplit = Array.isArray(parsed.excludeFromSplit)
    ? parsed.excludeFromSplit.filter((s): s is string => typeof s === 'string')
    : []
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.5

  return {
    type: 'expense',
    amount,
    currency,
    description,
    splitAmong,
    includesSender,
    excludeFromSplit,
    confidence
  }
}

/**
 * Validate and normalize payment result
 */
function validatePaymentResult(parsed: Record<string, unknown>): AIPaymentResult {
  const amount = typeof parsed.amount === 'number' ? parsed.amount : parseFloat(String(parsed.amount)) || 0
  const currency = validateCurrency(parsed.currency)
  const direction = parsed.direction === 'received' ? 'received' : 'paid'
  const person = typeof parsed.person === 'string' ? parsed.person : ''
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.5

  return {
    type: 'payment',
    amount,
    currency,
    direction,
    person,
    confidence
  }
}

/**
 * Validate and normalize command result
 */
function validateCommandResult(parsed: Record<string, unknown>): AICommandResult {
  const command = typeof parsed.command === 'string' ? parsed.command : ''
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 1.0

  return {
    type: 'command',
    command,
    confidence
  }
}

/**
 * Validate and normalize unknown result
 */
function validateUnknownResult(parsed: Record<string, unknown>): AIUnknownResult {
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.3
  const suggestion = typeof parsed.suggestion === 'string' ? parsed.suggestion : undefined

  return {
    type: 'unknown',
    confidence,
    suggestion
  }
}

/**
 * Validate currency string
 */
function validateCurrency(currency: unknown): 'ARS' | 'USD' | 'EUR' | 'BRL' {
  const validCurrencies = ['ARS', 'USD', 'EUR', 'BRL']
  const normalized = typeof currency === 'string' ? currency.toUpperCase() : 'ARS'
  return validCurrencies.includes(normalized)
    ? (normalized as 'ARS' | 'USD' | 'EUR' | 'BRL')
    : 'ARS'
}
