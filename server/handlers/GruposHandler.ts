/**
 * GruposHandler — all grupos domain logic in a single coherent file.
 *
 * Commands, expenses, payments, splits, balance calculation, mentions (Fuse.js),
 * exchange rates, multi-group flow, AI expense confirmation, welcome message.
 *
 * Firestore collections: ttc_user, ttc_group, ttc_expense, ttc_payment
 */

import Fuse from 'fuse.js'
import axios from 'axios'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { sendMessage, downloadMedia } from '../helpers/whatsapp.js'
import { normalizeForComparison, generatePhoneCandidates } from '../helpers/phone.js'
import {
  appFooter,
  isAffirmativeResponse, isNegativeResponse, isGreeting, formatGreetingResponse,
  buildConfirmationRequest, buildConfirmationSuccess, buildConfirmationCancelled,
  formatParseError, formatValidationError, formatUnresolvedNamesError,
  formatPaymentError, formatSaveError, formatMediaError,
  formatPaymentConfirmation, formatPaymentNotification,
  formatHelpMessage, formatBalance, formatExpenseList,
  type BalanceEntry, type ExpenseListEntry,
} from '../helpers/responseFormatter.js'
import type GeminiHandler from './GeminiHandler.js'
import type { AIExpenseResult, AIPaymentResult, MemberInfo } from './GeminiHandler.js'

// ─── Types ─────────────────────────────────────────────────────────

interface User {
  id: string
  name: string
  phone: string
  email: string | null
  aliases: string[]
  activeGroupId?: string | null
  welcomedAt?: Date
  phoneNumber?: string // legacy
  [key: string]: unknown
}

interface Group {
  id: string
  name: string
  members: string[]
  createdBy: string
  [key: string]: unknown
}

interface Expense {
  id?: string
  userId: string
  userName: string
  amount: number
  originalInput: string
  originalAmount?: number
  originalCurrency?: string
  description: string
  category: string
  splitAmong?: string[]
  groupId?: string
  timestamp: Date
}

interface Payment {
  id?: string
  groupId: string
  fromUserId: string
  toUserId: string
  amount: number
  recordedBy: string
  note?: string
  createdAt: Date
}

interface PendingGroupSelection {
  groups: Group[]
  expiresAt: number
}

interface PendingExpense {
  phone: string
  text: string
  groups: Group[]
  expiresAt: number
}

interface PendingAIExpense {
  from: string
  originalText: string
  expense: {
    amount: number
    originalAmount?: number
    originalCurrency?: string
    description: string
    category: string
    splitAmong: string[]
    displayNames: string[]
    includesSender: boolean
  }
  userId: string
  userName: string
  groupId: string
  groupName: string
  createdAt: Date
}

interface CachedRates {
  USD: number
  EUR: number
  BRL: number
  lastUpdated: number
}

// ─── Fuse.js config for @mentions ──────────────────────────────────

const FUSE_OPTIONS = {
  keys: ['aliases', 'normalizedName'],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
}

const MENTION_CONFIDENCE_THRESHOLD = 0.35

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

// ─── Currency words ────────────────────────────────────────────────

const CURRENCY_WORDS: Record<string, string> = {
  usd: 'USD', dollar: 'USD', dollars: 'USD', dolar: 'USD', dolares: 'USD',
  eur: 'EUR', euro: 'EUR', euros: 'EUR',
  brl: 'BRL', real: 'BRL', reais: 'BRL', reales: 'BRL',
  ars: 'ARS', peso: 'ARS', pesos: 'ARS',
}
const CURRENCY_PATTERN = Object.keys(CURRENCY_WORDS).join('|')

// ─── Handler class ─────────────────────────────────────────────────

export default class GruposHandler {
  private gemini: GeminiHandler

  // In-memory state maps
  private processedMessageIds = new Map<string, number>()
  private pendingGroupSelections = new Map<string, PendingGroupSelection>()
  private pendingExpenses = new Map<string, PendingExpense>()
  private pendingAIExpenses = new Map<string, PendingAIExpense>()
  private recentExpenseCache = new Map<string, string[]>()

  // Exchange rate cache
  private ratesCache: CachedRates | null = null
  private readonly CACHE_DURATION = 30 * 60 * 1000
  private readonly FALLBACK_RATES = { USD: 850, EUR: 925, BRL: 170 }

  // Timeouts
  private readonly GROUP_SELECTION_TIMEOUT = 2 * 60 * 1000
  private readonly AI_EXPENSE_TIMEOUT = 5 * 60 * 1000

  constructor(gemini: GeminiHandler) {
    this.gemini = gemini

    // Cleanup intervals
    setInterval(() => this.cleanupProcessedMessages(), 15 * 60 * 1000)
    setInterval(() => this.cleanupPendingStates(), 60 * 1000)
  }

  // ─── Cleanup ────────────────────────────────────────────────────

  private cleanupProcessedMessages(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [id, ts] of this.processedMessageIds.entries()) {
      if (ts < oneHourAgo) this.processedMessageIds.delete(id)
    }
  }

  private cleanupPendingStates(): void {
    const now = Date.now()
    for (const [userId, p] of this.pendingGroupSelections.entries()) {
      if (p.expiresAt < now) this.pendingGroupSelections.delete(userId)
    }
    for (const [userId, p] of this.pendingExpenses.entries()) {
      if (p.expiresAt < now) this.pendingExpenses.delete(userId)
    }
    const aiCutoff = now - this.AI_EXPENSE_TIMEOUT
    for (const [userId, p] of this.pendingAIExpenses.entries()) {
      if (p.createdAt.getTime() < aiCutoff) this.pendingAIExpenses.delete(userId)
    }
  }

  // ─── Message dedup ──────────────────────────────────────────────

  isDuplicate(messageId: string): boolean {
    if (this.processedMessageIds.has(messageId)) return true
    this.processedMessageIds.set(messageId, Date.now())
    return false
  }

  // ─── Main entry point ──────────────────────────────────────────

  async handleMessage(from: string, messageType: string, messageData: any, user: User, contactName: string): Promise<void> {
    // Route non-text message types
    if (messageType === 'audio') {
      await this.processAudioMessage(from, messageData.audio?.id, user)
      return
    }
    if (messageType === 'image') {
      await this.processImageMessage(from, messageData.image?.id, messageData.image?.caption, user)
      return
    }
    if (messageType !== 'text') return // Unsupported message type

    const text = messageData.text?.body || ''

    // 1. Welcome message check
    if (!user.welcomedAt) {
      const userGroups = await this.getAllGroupsByUserId(user.id)
      await sendMessage(from, this.getWelcomeMessage(user.name, userGroups))
      await this.markUserAsWelcomed(user.id)
      return
    }

    // 3. Pending AI expense confirmation
    if (this.hasPendingAIExpense(user.id)) {
      if (isAffirmativeResponse(text)) {
        const pending = this.getPendingAIExpense(user.id)
        if (pending) {
          await this.saveConfirmedAIExpense(pending)
          this.pendingAIExpenses.delete(user.id)
          await sendMessage(from, buildConfirmationSuccess({
            mode: 'grupos', amount: pending.expense.amount,
            originalAmount: pending.expense.originalAmount, originalCurrency: pending.expense.originalCurrency,
            description: pending.expense.description, category: pending.expense.category,
            displayNames: pending.expense.displayNames, groupName: pending.groupName,
          }))
          return
        }
      }
      if (isNegativeResponse(text)) {
        this.pendingAIExpenses.delete(user.id)
        await sendMessage(from, buildConfirmationCancelled())
        return
      }
      // Something else — cancel pending, continue processing
      this.pendingAIExpenses.delete(user.id)
    }

    // 4. Pending expense group selection
    if (this.hasPendingExpense(user.id)) {
      const trimmed = text.trim()
      const number = parseInt(trimmed, 10)
      const pending = this.getPendingExpense(user.id)

      if (pending && /^\d+$/.test(trimmed)) {
        if (number >= 1 && number <= pending.groups.length) {
          const selectedGroup = pending.groups[number - 1]
          this.pendingExpenses.delete(user.id)
          await this.updateUserActiveGroup(user.id, selectedGroup.id)
          await this.handleExpenseMessage(from, pending.text, user, selectedGroup.id, selectedGroup.name)
          return
        } else {
          await sendMessage(from, `⚠️ Número inválido. Elegí un número entre 1 y ${pending.groups.length}.`)
          return
        }
      }
      this.pendingExpenses.delete(user.id)
    }

    // 5. Pending group selection (from /grupo command)
    if (this.hasPendingGroupSelection(user.id)) {
      const result = await this.handleGroupSelectionResponse(user.id, text)
      if (result) {
        await sendMessage(from, result)
        return
      }
    }

    // 6. Command check
    if (this.isCommand(text)) {
      const group = await this.getGroupByUserId(user.id)
      await this.handleCommand(from, text, user, group?.id || null, group?.name)
      return
    }

    // 7. Greeting detection — respond with mode + group context, don't send to AI
    if (isGreeting(text.trim().toLowerCase())) {
      const group = await this.getGroupByUserId(user.id)
      await sendMessage(from, formatGreetingResponse('grupos', { groupName: group?.name }))
      return
    }

    // 8. Multi-group user without activeGroupId
    const allGroups = await this.getAllGroupsByUserId(user.id)
    if (allGroups.length > 1 && !user.activeGroupId) {
      this.pendingExpenses.set(user.id, {
        phone: from, text, groups: allGroups,
        expiresAt: Date.now() + this.GROUP_SELECTION_TIMEOUT,
      })
      await sendMessage(from, this.getExpenseGroupPromptMessage(allGroups))
      return
    }

    // 8. Get user's group
    const group = await this.getGroupByUserId(user.id)
    const groupId = group?.id || null

    // 9. AI parsing
    if (this.gemini.isAIEnabled() && groupId) {
      try {
        const groupMembers = await this.getGroupMembers(groupId)
        const memberInfos: MemberInfo[] = groupMembers.map(m => ({ name: m.name, aliases: m.aliases || [] }))
        const aiResult = await this.gemini.parseExpenseNL(text, memberInfos)
        const threshold = this.gemini.getConfidenceThreshold()

        if (aiResult.type === 'expense' && aiResult.confidence >= threshold) {
          await this.handleAIExpense(from, aiResult, user, groupId, group?.name || '', text)
          return
        } else if (aiResult.type === 'payment' && aiResult.confidence >= threshold) {
          await this.handleAIPayment(from, aiResult, user, groupId, group?.name || '')
          return
        } else if (aiResult.type === 'unknown') {
          // AI couldn't parse — show our formatted parse error (not raw AI suggestion)
          await sendMessage(from, formatParseError('grupos', { groupName: group?.name }))
          return
        }
        // Low confidence → fall through to regex
      } catch (error) {
        console.error('[AI] Parsing failed, falling back to regex:', error)
      }
    }

    // 10. Regex fallback: payment message
    if (this.isPaymentMessage(text)) {
      await this.handlePaymentMessage(from, text, user, groupId, group?.name)
      return
    }

    // 11. Regex fallback: expense message
    await this.handleExpenseMessage(from, text, user, groupId, group?.name)
  }

  // ─── Commands ───────────────────────────────────────────────────

  private async handleCommand(from: string, text: string, user: User, groupId: string | null, groupName?: string): Promise<void> {
    const parsed = this.parseCommand(text)
    if (!parsed) return

    switch (parsed.command) {
      case '/ayuda':
      case '/help':
        await sendMessage(from, formatHelpMessage('grupos'))
        break

      case '/grupo':
      case '/group': {
        const { message, groups } = await this.getGroupMessage(user.id, user.activeGroupId || groupId)
        await sendMessage(from, message)
        if (groups.length > 1) {
          this.pendingGroupSelections.set(user.id, {
            groups, expiresAt: Date.now() + this.GROUP_SELECTION_TIMEOUT,
          })
        }
        break
      }

      case '/balance':
      case '/saldo':
        if (!groupId) { await sendMessage(from, '⚠️ No pertenecés a ningún grupo.'); return }
        await sendMessage(from, await this.getBalanceMessage(groupId))
        break

      case '/lista':
      case '/list':
        if (!groupId) { await sendMessage(from, '⚠️ No pertenecés a ningún grupo.'); return }
        await sendMessage(from, await this.getExpenseListMessage(groupId))
        break

      case '/borrar':
      case '/delete':
        await sendMessage(from, `✏️ Para agregar, editar o eliminar gastos manualmente, usá el dashboard:\n\n${appFooter()}`)
        break

      default:
        await sendMessage(from, `❓ Comando no reconocido: ${parsed.command}\n\nEscribí /ayuda para ver los comandos disponibles.\n\n${appFooter('O visitá')}`)
        break
    }
  }

  // ─── Expense handling (regex) ───────────────────────────────────

  private async handleExpenseMessage(from: string, text: string, user: User, groupId: string | null, groupName?: string): Promise<void> {
    const currencyInfo = this.extractCurrency(text)
    const parsed = this.parseExpenseMessage(text)
    let finalAmount = currencyInfo ? await this.convertToARS(currencyInfo.amount, currencyInfo.currency) : parsed.amount
    const originalAmount = currencyInfo?.amount
    const originalCurrency = currencyInfo?.currency

    if (parsed.needsReview) {
      await sendMessage(from, formatParseError('grupos', { groupName }))
      return
    }

    const cleanDescription = this.stripCurrencyFromDescription(parsed.description)
    const validation = this.validateExpenseInput(finalAmount, cleanDescription)
    if (!validation.valid) {
      await sendMessage(from, formatValidationError(validation.error!))
      return
    }

    let resolvedSplitAmong: string[] = []
    let displayNames: string[] = []

    if (parsed.splitAmong.length > 0 && groupId) {
      const groupMembers = await this.getGroupMembers(groupId)
      resolvedSplitAmong = this.resolveMentionsToUserIds(parsed.splitAmong, groupMembers)
      displayNames = parsed.splitAmong
    }

    try {
      await this.createExpense({
        userId: user.id, userName: user.name, amount: finalAmount,
        originalAmount, originalCurrency, originalInput: text,
        description: cleanDescription, category: parsed.category || 'general',
        splitAmong: resolvedSplitAmong, groupId: groupId || undefined,
        timestamp: new Date(),
      })

      await sendMessage(from, buildConfirmationSuccess({
        mode: 'grupos', amount: finalAmount, originalAmount, originalCurrency,
        description: cleanDescription, category: parsed.category || 'general', displayNames, groupName,
      }))
    } catch (error) {
      console.error('Error creating expense:', error)
      await sendMessage(from, formatSaveError('gasto'))
    }
  }

  // ─── AI expense handling ────────────────────────────────────────

  private async handleAIExpense(from: string, aiResult: AIExpenseResult, user: User, groupId: string, groupName: string, originalText: string): Promise<void> {
    let finalAmount = aiResult.amount
    let originalAmount: number | undefined
    let originalCurrency: string | undefined

    if (aiResult.currency !== 'ARS') {
      finalAmount = await this.convertToARS(aiResult.amount, aiResult.currency)
      originalAmount = aiResult.amount
      originalCurrency = aiResult.currency
    }

    const validation = this.validateExpenseInput(finalAmount, aiResult.description)
    if (!validation.valid) {
      await sendMessage(from, formatValidationError(validation.error!))
      return
    }

    const groupMembers = await this.getGroupMembers(groupId)
    let resolvedSplitAmong: string[] = []
    let displayNames: string[] = []
    let unresolvedNames: string[] = []

    // Handle exclusion pattern: "todos menos [names]"
    if (aiResult.excludeFromSplit && aiResult.excludeFromSplit.length > 0) {
      const allMemberIds = groupMembers.map(m => m.id)
      const allMemberNames = groupMembers.map(m => m.name)
      const excludeResolution = this.resolveMentionsWithTracking(aiResult.excludeFromSplit, groupMembers)

      if (excludeResolution.unresolvedNames.length > 0) {
        await sendMessage(from, formatUnresolvedNamesError(excludeResolution.unresolvedNames, groupName))
        return
      }

      resolvedSplitAmong = allMemberIds.filter(id => !excludeResolution.resolvedUserIds.includes(id))
      displayNames = allMemberNames.filter((_, i) => !excludeResolution.resolvedUserIds.includes(allMemberIds[i]))

      if (!aiResult.includesSender && resolvedSplitAmong.includes(user.id)) {
        resolvedSplitAmong = resolvedSplitAmong.filter(id => id !== user.id)
        displayNames = displayNames.filter(name => name !== user.name)
      }

      if (resolvedSplitAmong.length === 0) {
        await sendMessage(from, '⚠️ No podés excluir a todo el grupo. Tiene que haber al menos una persona para dividir el gasto.')
        return
      }
    } else if (aiResult.splitAmong && aiResult.splitAmong.length > 0) {
      const resolution = this.resolveMentionsWithTracking(aiResult.splitAmong, groupMembers)
      resolvedSplitAmong = resolution.resolvedUserIds
      displayNames = resolution.resolvedNames
      unresolvedNames = resolution.unresolvedNames

      if (aiResult.includesSender && !resolvedSplitAmong.includes(user.id)) {
        resolvedSplitAmong.push(user.id)
        displayNames.push(user.name)
      }
    }

    if (unresolvedNames.length > 0) {
      await sendMessage(from, formatUnresolvedNamesError(unresolvedNames, groupName))
      return
    }

    const category = this.categorizeFromDescription(aiResult.description)

    // Store as pending
    this.pendingAIExpenses.set(user.id, {
      from, originalText,
      expense: {
        amount: finalAmount, originalAmount, originalCurrency,
        description: aiResult.description, category,
        splitAmong: resolvedSplitAmong, displayNames,
        includesSender: aiResult.includesSender,
      },
      userId: user.id, userName: user.name,
      groupId, groupName, createdAt: new Date(),
    })

    await sendMessage(from, buildConfirmationRequest({
      mode: 'grupos', amount: finalAmount, originalAmount, originalCurrency,
      description: aiResult.description, category, groupName, displayNames,
    }))
  }

  private async saveConfirmedAIExpense(pending: PendingAIExpense): Promise<void> {
    await this.createExpense({
      userId: pending.userId, userName: pending.userName,
      amount: pending.expense.amount, originalAmount: pending.expense.originalAmount,
      originalCurrency: pending.expense.originalCurrency,
      originalInput: pending.originalText, description: pending.expense.description,
      category: pending.expense.category, splitAmong: pending.expense.splitAmong,
      groupId: pending.groupId, timestamp: new Date(),
    })
  }

  // ─── Audio processing ──────────────────────────────────────────

  private async processAudioMessage(from: string, audioId: string | undefined, user: User): Promise<void> {
    if (!audioId) return

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, '⚠️ Esta función no está disponible en este momento.')
      return
    }

    const media = await downloadMedia(audioId)
    if (!media) { await sendMessage(from, formatMediaError('descargar')); return }

    const group = await this.getGroupByUserId(user.id)
    const groupId = group?.id || null

    await sendMessage(from, '🎤 Procesando audio...')
    const transcription = await this.gemini.transcribeAudio(media.base64, media.mimeType)
    if (!transcription || !transcription.transcription) {
      await sendMessage(from, formatMediaError('procesar'))
      return
    }

    // Feed transcription into existing NLP pipeline
    if (groupId) {
      const groupMembers = await this.getGroupMembers(groupId)
      const memberInfos: MemberInfo[] = groupMembers.map(m => ({ name: m.name, aliases: m.aliases || [] }))

      // Try parsing the transcribed text
      const textToParse = transcription.transcription
      const aiResult = await this.gemini.parseExpenseNL(textToParse, memberInfos)
      const threshold = this.gemini.getConfidenceThreshold()

      if (aiResult.type === 'expense' && aiResult.confidence >= threshold && aiResult.amount > 0) {
        await this.handleAIExpense(from, aiResult, user, groupId, group?.name || '', textToParse)
        // Append transcription context to the pending expense
        const pending = this.pendingAIExpenses.get(user.id)
        if (pending) {
          await sendMessage(from, `_"${transcription.transcription}"_`)
        }
        return
      }

      if (aiResult.type === 'payment' && aiResult.confidence >= threshold) {
        await this.handleAIPayment(from, aiResult as AIPaymentResult, user, groupId, group?.name || '')
        return
      }
    }

    // Could not parse — show transcription and ask to retry
    await sendMessage(from, `⚠️ No pude determinar el gasto del audio.\n\n_"${transcription.transcription}"_\n\nProbá escribirlo directamente.`)
  }

  // ─── Image processing ──────────────────────────────────────────

  private async processImageMessage(from: string, imageId: string | undefined, caption: string | undefined, user: User): Promise<void> {
    if (!imageId) return

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, '⚠️ Esta función no está disponible en este momento.')
      return
    }

    const media = await downloadMedia(imageId)
    if (!media) { await sendMessage(from, formatMediaError('descargar')); return }

    const group = await this.getGroupByUserId(user.id)
    const groupId = group?.id || null

    if (!groupId) {
      await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
      return
    }

    await sendMessage(from, '📷 Procesando imagen...')
    const transferData = await this.gemini.parseTransferImage(media.base64, media.mimeType)
    if (!transferData) { await sendMessage(from, formatMediaError('procesar')); return }

    const amount = parseFloat(String(transferData.amount)) || 0
    if (amount <= 0) {
      await sendMessage(from, '⚠️ No pude determinar el monto del comprobante.')
      return
    }

    // Build description from transfer data or caption
    const label = caption || transferData.recipientName || transferData.concept || 'Comprobante'
    const description = typeof label === 'string' ? label : 'Comprobante'

    // Create a pseudo-AI expense result and enter the confirmation flow
    const pseudoExpense: AIExpenseResult = {
      type: 'expense',
      amount,
      currency: 'ARS',
      description,
      splitAmong: [],
      includesSender: true,
      excludeFromSplit: [],
      confidence: 0.9,
    }

    await this.handleAIExpense(from, pseudoExpense, user, groupId, group?.name || '', `[imagen] ${description}`)
  }

  // ─── AI payment handling ────────────────────────────────────────

  private async handleAIPayment(from: string, aiResult: AIPaymentResult, user: User, groupId: string, groupName: string): Promise<void> {
    if (aiResult.amount <= 0) {
      await sendMessage(from, formatPaymentError('invalid_amount'))
      return
    }

    const groupMembers = await this.getGroupMembers(groupId)
    const mentionedUser = this.matchMention(aiResult.person, groupMembers)

    if (!mentionedUser) {
      await sendMessage(from, formatPaymentError('invalid_mention'))
      return
    }
    if (mentionedUser.id === user.id) {
      await sendMessage(from, formatPaymentError('self_payment'))
      return
    }

    let amount = aiResult.amount
    if (aiResult.currency !== 'ARS') {
      amount = await this.convertToARS(aiResult.amount, aiResult.currency)
    }

    const [fromUserId, toUserId, confirmDir, notifyDir] = aiResult.direction === 'paid'
      ? [user.id, mentionedUser.id, 'to' as const, 'paid_to_you' as const]
      : [mentionedUser.id, user.id, 'from' as const, 'received_from_you' as const]

    try {
      await this.createPayment({ groupId, fromUserId, toUserId, amount, recordedBy: user.id, createdAt: new Date() })
      await sendMessage(from, formatPaymentConfirmation(amount, mentionedUser.name, groupName, confirmDir))

      const otherUser = await this.getUserById(mentionedUser.id)
      if (otherUser?.phone) {
        await sendMessage(otherUser.phone, formatPaymentNotification(amount, user.name, groupName, notifyDir))
      }
    } catch (error) {
      console.error('Error creating AI payment:', error)
      await sendMessage(from, formatSaveError('pago'))
    }
  }

  // ─── Payment handling (regex) ───────────────────────────────────

  private async handlePaymentMessage(from: string, text: string, user: User, groupId: string | null, groupName?: string): Promise<void> {
    if (!groupId) {
      await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
      return
    }

    const parsed = this.parsePaymentMessage(text)
    if (!parsed || parsed.amount <= 0) {
      await sendMessage(from, formatPaymentError('invalid_amount'))
      return
    }

    const groupMembers = await this.getGroupMembers(groupId)
    const mentionedUser = this.matchMention(parsed.mention, groupMembers)

    if (!mentionedUser) {
      await sendMessage(from, formatPaymentError('invalid_mention'))
      return
    }
    if (mentionedUser.id === user.id) {
      await sendMessage(from, formatPaymentError('self_payment'))
      return
    }

    const [fromUserId, toUserId, confirmDir, notifyDir] = parsed.type === 'paid'
      ? [user.id, mentionedUser.id, 'to' as const, 'paid_to_you' as const]
      : [mentionedUser.id, user.id, 'from' as const, 'received_from_you' as const]

    try {
      await this.createPayment({ groupId, fromUserId, toUserId, amount: parsed.amount, recordedBy: user.id, createdAt: new Date() })
      await sendMessage(from, formatPaymentConfirmation(parsed.amount, mentionedUser.name, groupName || '', confirmDir))

      const otherUser = await this.getUserById(mentionedUser.id)
      if (otherUser?.phone) {
        await sendMessage(otherUser.phone, formatPaymentNotification(parsed.amount, user.name, groupName || '', notifyDir))
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      await sendMessage(from, formatSaveError('pago'))
    }
  }

  // ─── Pending state helpers ──────────────────────────────────────

  private hasPendingAIExpense(userId: string): boolean {
    const p = this.pendingAIExpenses.get(userId)
    if (!p) return false
    if (p.createdAt.getTime() < Date.now() - this.AI_EXPENSE_TIMEOUT) {
      this.pendingAIExpenses.delete(userId)
      return false
    }
    return true
  }

  private getPendingAIExpense(userId: string): PendingAIExpense | null {
    const p = this.pendingAIExpenses.get(userId)
    if (!p || p.createdAt.getTime() < Date.now() - this.AI_EXPENSE_TIMEOUT) {
      this.pendingAIExpenses.delete(userId)
      return null
    }
    return p
  }

  private hasPendingExpense(userId: string): boolean {
    const p = this.pendingExpenses.get(userId)
    if (!p) return false
    if (p.expiresAt < Date.now()) { this.pendingExpenses.delete(userId); return false }
    return true
  }

  private getPendingExpense(userId: string): PendingExpense | null {
    const p = this.pendingExpenses.get(userId)
    if (!p || p.expiresAt < Date.now()) { this.pendingExpenses.delete(userId); return null }
    return p
  }

  private hasPendingGroupSelection(userId: string): boolean {
    const p = this.pendingGroupSelections.get(userId)
    if (!p) return false
    if (p.expiresAt < Date.now()) { this.pendingGroupSelections.delete(userId); return false }
    return true
  }

  private async handleGroupSelectionResponse(userId: string, text: string): Promise<string | null> {
    const pending = this.pendingGroupSelections.get(userId)
    if (!pending || pending.expiresAt < Date.now()) {
      this.pendingGroupSelections.delete(userId)
      return null
    }

    const trimmed = text.trim()
    const number = parseInt(trimmed, 10)

    if (isNaN(number) || number < 1 || number > pending.groups.length) {
      if (/^\d+$/.test(trimmed)) {
        return `⚠️ Número inválido. Elegí un número entre 1 y ${pending.groups.length}.`
      }
      this.pendingGroupSelections.delete(userId)
      return null
    }

    const selectedGroup = pending.groups[number - 1]
    await this.updateUserActiveGroup(userId, selectedGroup.id)
    this.pendingGroupSelections.delete(userId)
    return `✅ Grupo activo cambiado a: *${selectedGroup.name}*\n\nTus próximos gastos se registrarán en este grupo.\n\n${appFooter()}`
  }

  // ─── Mention matching (Fuse.js) ────────────────────────────────

  private matchMention(mention: string, groupMembers: User[]): User | null {
    if (!mention || !groupMembers.length) return null
    const normalized = normalizeText(mention)
    if (normalized.length < 2) return null

    const searchable = groupMembers.map(u => ({
      user: u,
      aliases: (u.aliases || []).map(a => normalizeText(a)),
      normalizedName: normalizeText(u.name),
    }))

    const fuse = new Fuse(searchable, FUSE_OPTIONS)
    const results = fuse.search(normalized)

    if (results.length === 0) return null
    const best = results[0]
    if (best.score !== undefined && best.score > MENTION_CONFIDENCE_THRESHOLD) return null
    return best.item.user
  }

  private resolveMentionsToUserIds(mentions: string[], groupMembers: User[]): string[] {
    const matchedIds: string[] = []
    const seen = new Set<string>()

    for (const mention of mentions) {
      const matched = this.matchMention(mention, groupMembers)
      if (matched && !seen.has(matched.id)) {
        matchedIds.push(matched.id)
        seen.add(matched.id)
      }
    }
    return matchedIds
  }

  private resolveMentionsWithTracking(mentions: string[], groupMembers: User[]): { resolvedUserIds: string[]; resolvedNames: string[]; unresolvedNames: string[] } {
    const resolvedUserIds: string[] = []
    const resolvedNames: string[] = []
    const unresolvedNames: string[] = []
    const seen = new Set<string>()

    for (const mention of mentions) {
      const matched = this.matchMention(mention, groupMembers)
      if (matched && !seen.has(matched.id)) {
        resolvedUserIds.push(matched.id)
        resolvedNames.push(matched.name)
        seen.add(matched.id)
      } else if (!matched) {
        unresolvedNames.push(mention)
      }
    }
    return { resolvedUserIds, resolvedNames, unresolvedNames }
  }

  // ─── Exchange rate service ──────────────────────────────────────

  private async getExchangeRates(): Promise<{ USD: number; EUR: number; BRL: number }> {
    if (this.ratesCache && (Date.now() - this.ratesCache.lastUpdated) < this.CACHE_DURATION) {
      return { USD: this.ratesCache.USD, EUR: this.ratesCache.EUR, BRL: this.ratesCache.BRL }
    }

    try {
      const [usd, eur, brl] = await Promise.all([
        axios.get('https://dolarapi.com/v1/dolares/blue', { timeout: 5000 }),
        axios.get('https://dolarapi.com/v1/cotizaciones/eur', { timeout: 5000 }),
        axios.get('https://dolarapi.com/v1/cotizaciones/brl', { timeout: 5000 }),
      ])

      const rates = { USD: usd.data.venta, EUR: eur.data.venta, BRL: brl.data.venta }
      this.ratesCache = { ...rates, lastUpdated: Date.now() }
      return rates
    } catch {
      if (this.ratesCache) return { USD: this.ratesCache.USD, EUR: this.ratesCache.EUR, BRL: this.ratesCache.BRL }
      return this.FALLBACK_RATES
    }
  }

  private async convertToARS(amount: number, currency: string): Promise<number> {
    if (currency === 'ARS') return amount
    const rates = await this.getExchangeRates()
    const rate = (rates as Record<string, number>)[currency]
    return rate ? amount * rate : amount
  }

  // ─── Message parsing (regex) ────────────────────────────────────

  private parseExpenseMessage(message: string): { amount: number; description: string; category?: string; splitAmong: string[]; needsReview: boolean } {
    const normalized = message.trim()
    const mentions: string[] = []
    const cleanMessage = normalized.replace(/@([a-zA-Z0-9_]+)/g, (_, name) => {
      mentions.push(name)
      return ''
    }).trim()

    const match = cleanMessage.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/i)
    if (!match) return { amount: 0, description: message, splitAmong: [], needsReview: true }

    const amount = parseFloat(match[1].replace(',', '.'))
    const description = match[2].trim()
    const category = this.categorizeFromDescription(description)

    return { amount, description, category, splitAmong: mentions, needsReview: false }
  }

  private extractCurrency(message: string): { amount: number; currency: string } | null {
    const p1 = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${CURRENCY_PATTERN})\\b`, 'i')
    const p2 = new RegExp(`\\b(${CURRENCY_PATTERN})\\s*(\\d+(?:[.,]\\d+)?)`, 'i')

    const m1 = message.match(p1)
    const m2 = message.match(p2)

    let amount: number, rawCurrency: string
    if (m1) { amount = parseFloat(m1[1].replace(',', '.')); rawCurrency = m1[2].toLowerCase() }
    else if (m2) { rawCurrency = m2[1].toLowerCase(); amount = parseFloat(m2[2].replace(',', '.')) }
    else return null

    const currency = CURRENCY_WORDS[rawCurrency] || rawCurrency.toUpperCase()
    return currency === 'ARS' ? null : { amount, currency }
  }

  private stripCurrencyFromDescription(description: string): string {
    return description.replace(new RegExp(`\\b(${CURRENCY_PATTERN})\\b`, 'gi'), '').replace(/\s+/g, ' ').trim()
  }

  private isPaymentMessage(message: string): boolean {
    const n = message.trim().toLowerCase()
    return ['pagué', 'pague', 'le pagué', 'le pague', 'recibí', 'recibi', 'me pagó', 'me pago'].some(k => n.startsWith(k))
  }

  private parsePaymentMessage(message: string): { type: 'paid' | 'received'; amount: number; mention: string } | null {
    const n = message.trim().toLowerCase()

    let type: 'paid' | 'received' | null = null
    for (const k of ['pagué', 'pague', 'le pagué', 'le pague']) {
      if (n.startsWith(k)) { type = 'paid'; break }
    }
    if (!type) {
      for (const k of ['recibí', 'recibi', 'me pagó', 'me pago']) {
        if (n.startsWith(k)) { type = 'received'; break }
      }
    }
    if (!type) return null

    const mentions: string[] = []
    let m
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    while ((m = mentionRegex.exec(message)) !== null) mentions.push(m[1])

    const amountMatch = message.match(/(\d+(?:[.,]\d+)?)/g)
    if (!amountMatch?.length) return null

    const amount = parseFloat(amountMatch[0].replace(',', '.'))
    if (isNaN(amount) || amount <= 0 || mentions.length !== 1) return null

    return { type, amount, mention: mentions[0] }
  }

  // ─── Validation ─────────────────────────────────────────────────

  private validateExpenseInput(amount: number, description: string): { valid: boolean; error?: string } {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return { valid: false, error: 'El monto debe ser mayor a cero' }
    if (!description?.trim() || description.trim().length < 1) return { valid: false, error: 'Falta la descripción del gasto' }
    if (description.trim().length > 500) return { valid: false, error: 'La descripción es muy larga (máximo 500 caracteres)' }
    return { valid: true }
  }

  // ─── Categorization ─────────────────────────────────────────────

  private categorizeFromDescription(description: string): string {
    const keywords: Record<string, string[]> = {
      food: ['lunch', 'almuerzo', 'dinner', 'cena', 'breakfast', 'desayuno', 'comida', 'restaurant', 'restaurante', 'pizza', 'burger', 'coffee', 'café', 'beer', 'cerveza', 'birra', 'drink', 'bebida', 'snack', 'groceries', 'supermercado', 'market', 'mercado', 'morfi'],
      transport: ['taxi', 'uber', 'cabify', 'bus', 'colectivo', 'bondi', 'train', 'tren', 'metro', 'subte', 'subway', 'flight', 'vuelo', 'car', 'auto', 'rental', 'alquiler', 'gas', 'nafta', 'parking', 'estacionamiento'],
      accommodation: ['hotel', 'airbnb', 'hostel', 'alojamiento', 'lodging', 'rent', 'alquiler', 'house', 'casa', 'apartment', 'apartamento', 'depto'],
      entertainment: ['ticket', 'entrada', 'show', 'espectaculo', 'museum', 'museo', 'tour', 'excursion', 'excursión', 'activity', 'actividad', 'game', 'juego', 'movie', 'cine', 'theater', 'teatro', 'club', 'bar', 'disco', 'party', 'fiesta', 'boliche'],
    }
    const lower = description.toLowerCase()
    for (const [cat, words] of Object.entries(keywords)) {
      for (const w of words) { if (lower.includes(w)) return cat }
    }
    return 'general'
  }

  // ─── Response helpers ───────────────────────────────────────────

  isCommand(text: string): boolean { return text.trim().startsWith('/') }

  private parseCommand(text: string): { command: string; args: string } | null {
    const trimmed = text.trim()
    if (!trimmed.startsWith('/')) return null
    const parts = trimmed.split(/\s+/)
    return { command: parts[0].toLowerCase(), args: parts.slice(1).join(' ') }
  }


  private getWelcomeMessage(userName: string, groups: Group[] = []): string {
    const firstName = userName?.split(' ')[0] || 'Hola'
    let groupInfo = ''
    if (groups.length === 1) groupInfo = `\n📍 Estás en el grupo: *${groups[0].name}*\n`
    else if (groups.length > 1) groupInfo = `\n📍 Estás en los grupos: *${groups.map(g => g.name).join(', ')}*\nUsá /grupo para cambiar entre ellos.\n`

    return `¡Hola ${firstName}! 👋 Bienvenido a *Text The Check*\n\nSoy tu bot para dividir gastos entre amigos.${groupInfo}\n\n💬 *Simplemente contame qué pagaste:*\n"Puse 5 lucas en el súper"\n"Pagué la cena, 12000"\n"Gasté 50 dólares en nafta con Juan"\n\nLa IA entiende lo que escribas y te pide confirmar antes de guardar.\n\n💸 *Para registrar pagos entre ustedes:*\n"Le pagué 5000 a María"\n"Recibí 3000 de Juan"\n\n⚡ *Comandos:*\n/balance → quién debe a quién\n/lista → ver últimos gastos\n/ayuda → más opciones\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Desde el dashboard podés agregar, editar y eliminar gastos:\nhttps://textthecheck.app\n\n¡Empezá a cargar gastos! 🎉`
  }

  private async getGroupMessage(userId: string, activeGroupId: string | null): Promise<{ message: string; groups: Group[] }> {
    const groups = await this.getAllGroupsByUserId(userId)
    if (groups.length === 0) return { message: '⚠️ No pertenecés a ningún grupo.', groups: [] }
    if (groups.length === 1) return { message: `📍 Tu grupo: *${groups[0].name}*\n\n_(Solo pertenecés a un grupo)_`, groups }

    let msg = '📍 *Tus grupos:*\n\n'
    groups.forEach((g, i) => { msg += `${i + 1}. ${g.name}${g.id === activeGroupId ? ' ✓' : ''}\n` })
    const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0]
    msg += `\nGrupo activo: *${activeGroup.name}*\n\n_Respondé con el número para cambiar de grupo._`
    return { message: msg, groups }
  }

  private getExpenseGroupPromptMessage(groups: Group[]): string {
    let msg = '📍 *¿En qué grupo registrar este gasto?*\n\n'
    groups.forEach((g, i) => { msg += `${i + 1}. ${g.name}\n` })
    msg += '\n_Respondé con el número del grupo._'
    return msg
  }

  // ─── Balance calculation ────────────────────────────────────────

  private async getBalanceMessage(groupId: string): Promise<string> {
    const members = await this.getGroupMembers(groupId)
    if (members.length === 0) return '⚠️ No se encontraron miembros en el grupo.'

    const expenses = await this.getAllExpensesByGroup(groupId)
    const payments = await this.getPaymentsByGroup(groupId)

    const balances = new Map<string, { paid: number; share: number; paymentAdj: number }>()
    members.forEach(u => balances.set(u.id, { paid: 0, share: 0, paymentAdj: 0 }))

    for (const expense of expenses) {
      const payer = balances.get(expense.userId)
      if (payer) payer.paid += expense.amount

      let splitUserIds: string[]
      if (expense.splitAmong?.length) {
        splitUserIds = expense.splitAmong.filter((id: string) => members.some(u => u.id === id))
        if (splitUserIds.length === 0) splitUserIds = members.map(u => u.id)
      } else {
        splitUserIds = members.map(u => u.id)
      }

      const shareAmount = expense.amount / splitUserIds.length
      splitUserIds.forEach(uid => { const p = balances.get(uid); if (p) p.share += shareAmount })
    }

    for (const payment of payments) {
      const from = balances.get(payment.fromUserId)
      const to = balances.get(payment.toUserId)
      if (from) from.paymentAdj += payment.amount
      if (to) to.paymentAdj -= payment.amount
    }

    const hasExpenses = [...balances.values()].some(b => b.paid > 0 || b.share > 0)
    if (!hasExpenses) return formatBalance([])

    const entries: BalanceEntry[] = members.map(u => {
      const d = balances.get(u.id)!
      return { name: u.name, net: d.paid - d.share + d.paymentAdj }
    }).sort((a, b) => b.net - a.net)

    return formatBalance(entries)
  }

  private async getExpenseListMessage(groupId: string): Promise<string> {
    const expenses = await this.getExpensesByGroup(groupId, 10)
    if (expenses.length === 0) return formatExpenseList([])

    this.recentExpenseCache.set(groupId, expenses.map(e => e.id!))
    const entries: ExpenseListEntry[] = expenses.map(e => ({
      amount: e.amount, description: e.description,
      userName: e.userName, timestamp: e.timestamp,
    }))
    return formatExpenseList(entries)
  }

  // ─── Firestore operations ──────────────────────────────────────

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const usersRef = db.collection('ttc_user')
      const candidates = generatePhoneCandidates(phoneNumber)

      for (const candidate of candidates) {
        const snapshot = await usersRef.where('phone', '==', candidate).limit(1).get()
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          return { id: doc.id, ...doc.data() } as User
        }
      }

      // Legacy fallback
      for (const candidate of candidates) {
        const snapshot = await usersRef.where('phoneNumber', '==', candidate).limit(1).get()
        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()
          return { id: doc.id, name: data.name, phone: data.phoneNumber, email: data.email || null, aliases: data.aliases || [], ...data } as User
        }
      }

      return null
    } catch (error) {
      console.error('Error getting user by phone:', error)
      return null
    }
  }

  private async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await db.collection('ttc_user').doc(userId).get()
      if (!doc.exists) return null
      return { id: doc.id, ...doc.data() } as User
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  private async markUserAsWelcomed(userId: string): Promise<void> {
    try { await db.collection('ttc_user').doc(userId).update({ welcomedAt: new Date() }) }
    catch (error) { console.error('Error marking user as welcomed:', error) }
  }

  private async getGroupByUserId(userId: string): Promise<Group | null> {
    try {
      const user = await this.getUserById(userId)
      if (user?.activeGroupId) {
        const doc = await db.collection('ttc_group').doc(user.activeGroupId).get()
        if (doc.exists) {
          const group = { id: doc.id, ...doc.data() } as Group
          if (group.members.includes(userId)) return group
        }
        await this.updateUserActiveGroup(userId, null)
      }

      const snapshot = await db.collection('ttc_group').where('members', 'array-contains', userId).limit(1).get()
      if (snapshot.empty) return null
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Group
    } catch (error) {
      console.error('Error getting group by user ID:', error)
      return null
    }
  }

  async getAllGroupsByUserId(userId: string): Promise<Group[]> {
    try {
      const snapshot = await db.collection('ttc_group').where('members', 'array-contains', userId).get()
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[]
    } catch (error) {
      console.error('Error getting groups:', error)
      return []
    }
  }

  private async getGroupMembers(groupId: string): Promise<User[]> {
    try {
      const groupDoc = await db.collection('ttc_group').doc(groupId).get()
      if (!groupDoc.exists) return []

      const memberIds = (groupDoc.data() as Group).members || []
      if (memberIds.length === 0) return []

      const members: User[] = []
      for (let i = 0; i < memberIds.length; i += 10) {
        const chunk = memberIds.slice(i, i + 10)
        const snapshot = await db.collection('ttc_user').where('__name__', 'in', chunk).get()
        snapshot.docs.forEach(doc => { members.push({ id: doc.id, ...doc.data() } as User) })
      }
      return members
    } catch (error) {
      console.error('Error getting group members:', error)
      return []
    }
  }

  private async updateUserActiveGroup(userId: string, groupId: string | null): Promise<void> {
    try { await db.collection('ttc_user').doc(userId).update({ activeGroupId: groupId }) }
    catch (error) { console.error('Error updating active group:', error) }
  }

  private async createExpense(expense: Expense): Promise<string> {
    const payload: Record<string, unknown> = {
      userId: expense.userId, userName: expense.userName,
      amount: expense.amount, originalInput: expense.originalInput,
      description: expense.description, category: expense.category,
      splitAmong: expense.splitAmong || [],
      timestamp: FieldValue.serverTimestamp(),
    }
    if (expense.originalAmount !== undefined) payload.originalAmount = expense.originalAmount
    if (expense.originalCurrency !== undefined) payload.originalCurrency = expense.originalCurrency
    if (expense.groupId !== undefined) payload.groupId = expense.groupId

    const docRef = await db.collection('ttc_expense').add(payload)
    return docRef.id
  }

  private async getExpensesByGroup(groupId: string, limit = 10): Promise<Expense[]> {
    const snapshot = await db.collection('ttc_expense')
      .where('groupId', '==', groupId).orderBy('timestamp', 'desc').limit(limit).get()
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return { id: doc.id, ...data, timestamp: data.timestamp?.toDate?.() || new Date() } as Expense
    })
  }

  private async getAllExpensesByGroup(groupId: string): Promise<Expense[]> {
    const snapshot = await db.collection('ttc_expense')
      .where('groupId', '==', groupId).orderBy('timestamp', 'desc').get()
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return { id: doc.id, ...data, timestamp: data.timestamp?.toDate?.() || new Date() } as Expense
    })
  }

  private async createPayment(payment: Omit<Payment, 'id'>): Promise<string> {
    const payload: Record<string, unknown> = {
      groupId: payment.groupId, fromUserId: payment.fromUserId,
      toUserId: payment.toUserId, amount: payment.amount,
      recordedBy: payment.recordedBy, createdAt: FieldValue.serverTimestamp(),
    }
    const docRef = await db.collection('ttc_payment').add(payload)
    return docRef.id
  }

  private async getPaymentsByGroup(groupId: string): Promise<Payment[]> {
    const snapshot = await db.collection('ttc_payment')
      .where('groupId', '==', groupId).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return { id: doc.id, ...data, createdAt: data.createdAt?.toDate?.() || new Date() } as Payment
    })
  }
}
