/**
 * WhatsApp Bot Command Service
 * Handles all slash commands for the Text The Check bot
 */

import { getExpensesByGroup, getAllExpensesByGroup, getExpenseById, deleteExpense } from './expenseService.js'
import { getPaymentsByGroup } from './paymentService.js'
import { getGroupMembers, getAllGroupsByUserId, updateUserActiveGroup } from './userService.js'
import type { User, Group } from '../types/index.js'

interface CommandResult {
  success: boolean
  message: string
}

interface Balance {
  userId: string
  userName: string
  paid: number
  share: number
  net: number
}

interface PendingGroupSelection {
  userId: string
  groups: Group[]
  expiresAt: number
}

interface PendingExpense {
  userId: string
  phone: string
  text: string
  groups: Group[]
  expiresAt: number
}

/**
 * Pending AI expense awaiting user confirmation
 * Stores all expense data until user confirms with "si" or cancels with "no"
 */
export interface PendingAIExpense {
  from: string              // WhatsApp number
  originalText: string      // Original message text for Firestore
  expense: {
    amount: number
    originalAmount?: number
    originalCurrency?: string
    description: string
    category: string
    splitAmong: string[]    // Resolved user IDs
    displayNames: string[]  // Names to show in confirmation
    unresolvedNames: string[] // Names that couldn't be matched
    includesSender: boolean
  }
  userId: string            // Sender's user ID
  userName: string          // Sender's name
  groupId: string
  groupName: string
  createdAt: Date           // For auto-expiry
}

// Store recent expense list for /borrar command reference
// Key: groupId, Value: array of expense IDs (most recent first)
const recentExpenseCache = new Map<string, string[]>()

// Store pending group selections (for /grupo number response)
// Key: userId, Value: { groups: Group[], expiresAt: timestamp }
const pendingGroupSelections = new Map<string, PendingGroupSelection>()

// Store pending expenses (waiting for group selection)
// Key: userId, Value: { phone, text, groups[], expiresAt }
const pendingExpenses = new Map<string, PendingExpense>()

// Store pending AI expenses (waiting for user confirmation)
// Key: userId, Value: PendingAIExpense
const pendingAIExpenses = new Map<string, PendingAIExpense>()

// 2 minute timeout for group selection
const GROUP_SELECTION_TIMEOUT_MS = 2 * 60 * 1000

// 5 minute timeout for AI expense confirmation
const AI_EXPENSE_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Clean up expired group selection states, pending expenses, and pending AI expenses
 */
function cleanupExpiredPendingStates() {
  const now = Date.now()
  for (const [userId, pending] of pendingGroupSelections.entries()) {
    if (pending.expiresAt < now) {
      pendingGroupSelections.delete(userId)
    }
  }
  for (const [userId, pending] of pendingExpenses.entries()) {
    if (pending.expiresAt < now) {
      pendingExpenses.delete(userId)
    }
  }
  // Clean up expired AI expense confirmations (5 minute timeout)
  const fiveMinutesAgo = now - AI_EXPENSE_TIMEOUT_MS
  for (const [userId, pending] of pendingAIExpenses.entries()) {
    if (pending.createdAt.getTime() < fiveMinutesAgo) {
      pendingAIExpenses.delete(userId)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredPendingStates, 60 * 1000)

/**
 * Format help message
 */
export function getHelpMessage(): string {
  return `📖 *Cómo usar Text The Check*

💬 *Contame qué pagaste:*
"Puse 150 en la pizza"
"Pagué 50 dólares la cena"
"Gasté 5 lucas en el taxi"

Por defecto se divide entre todos.
Si mencionás personas, se divide solo entre ellas.

💸 *Registrar pagos:*
"Le pagué 5000 a María"
"Recibí 3000 de Juan"

💱 *Monedas:* USD, EUR, BRL → se convierten a ARS

⚡ *Comandos:*
/balance - Ver quién debe a quién
/lista - Ver últimos gastos
/grupo - Cambiar de grupo

━━━━━━━━━━━━━━━━━━━━━━

📊 Agregar, editar o eliminar gastos:
https://textthecheck.app`
}

/**
 * Calculate balances for a group (Splitwise-style)
 * Now includes payments to adjust balances
 */
export async function calculateGroupBalances(groupId: string, members: User[]): Promise<Balance[]> {
  const expenses = await getAllExpensesByGroup(groupId)
  const payments = await getPaymentsByGroup(groupId)

  // Initialize balances map
  const balances = new Map<string, { paid: number; share: number; paymentAdjustment: number }>()
  members.forEach(u => balances.set(u.id, { paid: 0, share: 0, paymentAdjustment: 0 }))

  // Process each expense
  expenses.forEach(expense => {
    // 1. Add to payer's 'paid' amount
    const payer = balances.get(expense.userId)
    if (payer) {
      payer.paid += expense.amount
    }

    // 2. Determine who splits this expense
    let splitUserIds: string[] = []

    if (expense.splitAmong && expense.splitAmong.length > 0) {
      // splitAmong contains user IDs directly - use ONLY those specified
      // The payer is NOT auto-included; they must be explicitly listed
      // This allows logging expenses on behalf of others
      splitUserIds = expense.splitAmong.filter(id =>
        members.some(u => u.id === id)
      )

      // If no valid users found, fallback to everyone
      if (splitUserIds.length === 0) {
        splitUserIds = members.map(u => u.id)
      }
    } else {
      // Default: Everyone (when no specific mentions)
      splitUserIds = members.map(u => u.id)
    }

    // 3. Add to 'share' amount for each splitter
    const shareAmount = expense.amount / splitUserIds.length
    splitUserIds.forEach(uid => {
      const person = balances.get(uid)
      if (person) {
        person.share += shareAmount
      }
    })
  })

  // Process payments
  // When A pays B: A's net goes up (they're settling debt), B's net goes down
  payments.forEach(payment => {
    const fromUser = balances.get(payment.fromUserId)
    const toUser = balances.get(payment.toUserId)

    if (fromUser) {
      // Person who paid has their net balance increase (less debt)
      fromUser.paymentAdjustment += payment.amount
    }
    if (toUser) {
      // Person who received has their net balance decrease (received settlement)
      toUser.paymentAdjustment -= payment.amount
    }
  })

  // Convert map to array with user names
  return members.map(user => {
    const data = balances.get(user.id) || { paid: 0, share: 0, paymentAdjustment: 0 }
    return {
      userId: user.id,
      userName: user.name,
      paid: data.paid,
      share: data.share,
      net: data.paid - data.share + data.paymentAdjustment
    }
  }).sort((a, b) => b.net - a.net) // Sort by net (creditors first)
}

/**
 * Format balance message
 */
export async function getBalanceMessage(groupId: string): Promise<string> {
  const members = await getGroupMembers(groupId)

  if (members.length === 0) {
    return '⚠️ No se encontraron miembros en el grupo.'
  }

  const balances = await calculateGroupBalances(groupId, members)

  // Check if there are any expenses
  const hasExpenses = balances.some(b => b.paid > 0 || b.share > 0)
  if (!hasExpenses) {
    return '💰 *Balances del grupo*\n\nNo hay gastos registrados todavía.'
  }

  let message = '💰 *Balances del grupo*\n\n'

  balances.forEach(balance => {
    const firstName = balance.userName.split(' ')[0]
    const netAmount = Math.abs(balance.net)
    const formattedAmount = formatCurrency(netAmount)

    if (balance.net > 0) {
      message += `${firstName}: +${formattedAmount} (le deben)\n`
    } else if (balance.net < 0) {
      message += `${firstName}: -${formattedAmount} (debe)\n`
    } else {
      message += `${firstName}: $0 (al día)\n`
    }
  })

  message += '\n\n📊 Ver detalles en https://textthecheck.app'

  return message.trim()
}

/**
 * Format relative date in Spanish
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'hoy'
  } else if (diffDays === 1) {
    return 'ayer'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`
  } else {
    const months = Math.floor(diffDays / 30)
    return `hace ${months} mes${months > 1 ? 'es' : ''}`
  }
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * Get expense list message
 */
export async function getExpenseListMessage(groupId: string): Promise<string> {
  const expenses = await getExpensesByGroup(groupId, 10)

  if (expenses.length === 0) {
    return '📋 *Últimos gastos*\n\nNo hay gastos registrados todavía.'
  }

  // Cache expense IDs for /borrar command
  recentExpenseCache.set(groupId, expenses.map(e => e.id!))

  let message = '📋 *Últimos gastos*\n\n'

  expenses.forEach((expense, index) => {
    const amount = formatCurrency(expense.amount)
    const date = formatRelativeDate(expense.timestamp)
    const firstName = expense.userName.split(' ')[0]

    message += `${index + 1}. ${amount} ${expense.description} - ${firstName} (${date})\n`
  })

  message += '\n\n📊 Ver historial completo en https://textthecheck.app'

  return message.trim()
}

/**
 * Delete expense command
 * @param indexOrId - Either a number (1-based index from /lista) or expense ID
 * @param userId - The user requesting deletion (must be the creator)
 * @param groupId - The group the expense belongs to
 */
export async function deleteExpenseCommand(
  indexOrId: string,
  userId: string,
  groupId: string
): Promise<CommandResult> {
  let expenseId: string | null = null

  // Check if it's a number (index from /lista)
  const index = parseInt(indexOrId, 10)
  if (!isNaN(index) && index > 0) {
    // Get from cache
    const cachedIds = recentExpenseCache.get(groupId)
    if (cachedIds && cachedIds[index - 1]) {
      expenseId = cachedIds[index - 1]
    } else {
      // Refresh cache and try again
      const expenses = await getExpensesByGroup(groupId, 10)
      recentExpenseCache.set(groupId, expenses.map(e => e.id!))

      if (expenses[index - 1]) {
        expenseId = expenses[index - 1].id!
      }
    }

    if (!expenseId) {
      return {
        success: false,
        message: `⚠️ No encontré el gasto #${index}. Usá /lista para ver los gastos disponibles.`
      }
    }
  } else {
    // Assume it's an expense ID
    expenseId = indexOrId
  }

  // Get the expense
  const expense = await getExpenseById(expenseId)

  if (!expense) {
    return {
      success: false,
      message: '⚠️ No encontré ese gasto. ¿Quizás ya fue eliminado?'
    }
  }

  // Check if the user is the creator
  if (expense.userId !== userId) {
    const creatorFirstName = expense.userName.split(' ')[0]
    return {
      success: false,
      message: `⚠️ Solo ${creatorFirstName} puede eliminar este gasto.`
    }
  }

  // Delete the expense
  try {
    await deleteExpense(expenseId)

    // Update cache
    const cachedIds = recentExpenseCache.get(groupId)
    if (cachedIds) {
      const newIds = cachedIds.filter(id => id !== expenseId)
      recentExpenseCache.set(groupId, newIds)
    }

    return {
      success: true,
      message: `✅ *Gasto eliminado*\n\n${formatCurrency(expense.amount)} ${expense.description}`
    }
  } catch (error) {
    console.error('Error deleting expense:', error)
    return {
      success: false,
      message: '❌ Error al eliminar el gasto. Por favor intentá de nuevo.'
    }
  }
}

/**
 * Unknown command message
 */
export function getUnknownCommandMessage(command: string): string {
  return `❓ Comando no reconocido: ${command}\n\nEscribí /ayuda para ver los comandos disponibles.\n\n📊 O visitá https://textthecheck.app`
}

/**
 * Parse a command from text
 * Returns null if it's not a command
 */
export function parseCommand(text: string): { command: string; args: string } | null {
  const trimmed = text.trim()

  if (!trimmed.startsWith('/')) {
    return null
  }

  const parts = trimmed.split(/\s+/)
  const command = parts[0].toLowerCase()
  const args = parts.slice(1).join(' ')

  return { command, args }
}

/**
 * Check if text is a command
 */
export function isCommand(text: string): boolean {
  return text.trim().startsWith('/')
}

/**
 * Get group command message
 * Shows user's groups and active group, or message for single group
 */
export async function getGroupMessage(userId: string, activeGroupId: string | null): Promise<{ message: string, groups: Group[] }> {
  const groups = await getAllGroupsByUserId(userId)

  if (groups.length === 0) {
    return {
      message: '⚠️ No pertenecés a ningún grupo.',
      groups: []
    }
  }

  if (groups.length === 1) {
    return {
      message: `📍 Tu grupo: *${groups[0].name}*\n\n_(Solo pertenecés a un grupo)_`,
      groups
    }
  }

  // Multiple groups - show numbered list with active group marked
  let message = '📍 *Tus grupos:*\n\n'

  groups.forEach((group, index) => {
    const isActive = group.id === activeGroupId
    message += `${index + 1}. ${group.name}${isActive ? ' ✓' : ''}\n`
  })

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0]
  message += `\nGrupo activo: *${activeGroup.name}*\n\n_Respondé con el número para cambiar de grupo._`

  return { message, groups }
}

/**
 * Set up pending group selection for a user
 */
export function setPendingGroupSelection(userId: string, groups: Group[]): void {
  pendingGroupSelections.set(userId, {
    userId,
    groups,
    expiresAt: Date.now() + GROUP_SELECTION_TIMEOUT_MS
  })
}

/**
 * Check if user has a pending group selection
 */
export function hasPendingGroupSelection(userId: string): boolean {
  const pending = pendingGroupSelections.get(userId)
  if (!pending) return false

  // Check if expired
  if (pending.expiresAt < Date.now()) {
    pendingGroupSelections.delete(userId)
    return false
  }

  return true
}

/**
 * Handle number response for group selection
 * Returns CommandResult if this was a group selection, null if not applicable
 */
export async function handleGroupSelectionResponse(
  userId: string,
  text: string
): Promise<CommandResult | null> {
  const pending = pendingGroupSelections.get(userId)

  if (!pending || pending.expiresAt < Date.now()) {
    pendingGroupSelections.delete(userId)
    return null
  }

  // Check if the message is just a number
  const trimmed = text.trim()
  const number = parseInt(trimmed, 10)

  if (isNaN(number) || number < 1 || number > pending.groups.length) {
    // Not a valid number, treat as normal message (expense)
    // But only clear pending state if it's definitely not a number attempt
    if (/^\d+$/.test(trimmed)) {
      // They entered a number but it's out of range
      return {
        success: false,
        message: `⚠️ Número inválido. Elegí un número entre 1 y ${pending.groups.length}.`
      }
    }
    // Not a number at all, clear pending and let it be processed as expense
    pendingGroupSelections.delete(userId)
    return null
  }

  // Valid selection - update the user's active group
  const selectedGroup = pending.groups[number - 1]
  const success = await updateUserActiveGroup(userId, selectedGroup.id)

  // Clear pending state
  pendingGroupSelections.delete(userId)

  if (!success) {
    return {
      success: false,
      message: '❌ Error al cambiar de grupo. Por favor intentá de nuevo.'
    }
  }

  return {
    success: true,
    message: `✅ Grupo activo cambiado a: *${selectedGroup.name}*\n\nTus próximos gastos se registrarán en este grupo.\n\n📊 Ver detalles en https://textthecheck.app`
  }
}

/**
 * Clear pending group selection (for cleanup)
 */
export function clearPendingGroupSelection(userId: string): void {
  pendingGroupSelections.delete(userId)
}

/**
 * Set up pending expense for a user (waiting for group selection)
 */
export function setPendingExpense(userId: string, phone: string, text: string, groups: Group[]): void {
  pendingExpenses.set(userId, {
    userId,
    phone,
    text,
    groups,
    expiresAt: Date.now() + GROUP_SELECTION_TIMEOUT_MS
  })
}

/**
 * Check if user has a pending expense
 */
export function hasPendingExpense(userId: string): boolean {
  const pending = pendingExpenses.get(userId)
  if (!pending) return false

  if (pending.expiresAt < Date.now()) {
    pendingExpenses.delete(userId)
    return false
  }

  return true
}

/**
 * Get pending expense for a user
 */
export function getPendingExpense(userId: string): PendingExpense | null {
  const pending = pendingExpenses.get(userId)
  if (!pending || pending.expiresAt < Date.now()) {
    pendingExpenses.delete(userId)
    return null
  }
  return pending
}

/**
 * Clear pending expense
 */
export function clearPendingExpense(userId: string): void {
  pendingExpenses.delete(userId)
}

/**
 * Get prompt message for group selection when sending expense
 */
export function getExpenseGroupPromptMessage(groups: Group[]): string {
  let message = '📍 *¿En qué grupo registrar este gasto?*\n\n'

  groups.forEach((group, index) => {
    message += `${index + 1}. ${group.name}\n`
  })

  message += '\n_Respondé con el número del grupo._'

  return message
}

// ========================================
// Pending AI Expense Functions
// ========================================

/**
 * Set up a pending AI expense awaiting user confirmation
 */
export function setPendingAIExpense(userId: string, data: PendingAIExpense): void {
  pendingAIExpenses.set(userId, data)
}

/**
 * Check if user has a pending AI expense awaiting confirmation
 */
export function hasPendingAIExpense(userId: string): boolean {
  const pending = pendingAIExpenses.get(userId)
  if (!pending) return false

  // Check if expired (5 minutes)
  const fiveMinutesAgo = Date.now() - AI_EXPENSE_TIMEOUT_MS
  if (pending.createdAt.getTime() < fiveMinutesAgo) {
    pendingAIExpenses.delete(userId)
    return false
  }

  return true
}

/**
 * Get pending AI expense for a user
 */
export function getPendingAIExpense(userId: string): PendingAIExpense | null {
  const pending = pendingAIExpenses.get(userId)
  if (!pending) return null

  // Check if expired
  const fiveMinutesAgo = Date.now() - AI_EXPENSE_TIMEOUT_MS
  if (pending.createdAt.getTime() < fiveMinutesAgo) {
    pendingAIExpenses.delete(userId)
    return null
  }

  return pending
}

/**
 * Clear pending AI expense for a user
 */
export function clearPendingAIExpense(userId: string): void {
  pendingAIExpenses.delete(userId)
}

/**
 * Check if text is an affirmative response (yes/si/etc.)
 */
export function isAffirmativeResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  const affirmatives = ['si', 'sí', 'yes', 's', 'ok', 'dale', 'va', 'bueno', 'listo', 'confirmo']
  return affirmatives.includes(normalized)
}

/**
 * Check if text is a negative response (no/cancel/etc.)
 */
export function isNegativeResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  const negatives = ['no', 'n', 'cancelar', 'cancel', 'nope', 'na', 'nel']
  return negatives.includes(normalized)
}
