import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { getUserByPhone, getUserById, isAuthorizedPhone, getGroupByUserId, getGroupMembers, getAllGroupsByUserId, updateUserActiveGroup, markUserAsWelcomed } from '../services/userService.js'
import { createExpense } from '../services/expenseService.js'
import { createPayment } from '../services/paymentService.js'
import { parseExpenseMessage, extractCurrency, stripCurrencyFromDescription, parsePaymentMessage, isPaymentMessage } from '../utils/messageParser.js'
import { convertToARS } from '../services/exchangeRateService.js'
import { resolveMentionsToUserIds, matchMention, resolveMentionsWithTracking } from '../services/mentionService.js'
import {
  sendMessage,
  formatExpenseConfirmation,
  formatParseErrorMessage,
  formatValidationErrorMessage,
  formatPaymentConfirmation,
  formatPaymentNotification,
  formatPaymentErrorMessage,
  formatExpenseConfirmationRequest,
  formatExpenseCancelledMessage,
} from '../services/whatsappService.js'
import {
  isCommand,
  parseCommand,
  getHelpMessage,
  getBalanceMessage,
  getExpenseListMessage,
  getUnknownCommandMessage,
  getGroupMessage,
  setPendingGroupSelection,
  hasPendingGroupSelection,
  handleGroupSelectionResponse,
  setPendingExpense,
  hasPendingExpense,
  getPendingExpense,
  clearPendingExpense,
  getExpenseGroupPromptMessage,
  // AI expense confirmation
  setPendingAIExpense,
  hasPendingAIExpense,
  getPendingAIExpense,
  clearPendingAIExpense,
  isAffirmativeResponse,
  isNegativeResponse,
} from '../services/commandService.js'
import {
  isAIEnabled,
  parseMessageWithAI,
  getConfidenceThreshold
} from '../services/aiService.js'

const router = Router()

/**
 * Message deduplication cache
 * Stores processed message IDs with timestamp for cleanup
 * Format: { messageId: timestamp }
 */
const processedMessageIds = new Map()

/**
 * Clean up old message IDs (older than 1 hour)
 * Runs periodically to prevent memory leak
 */
function cleanupProcessedMessages() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [messageId, timestamp] of processedMessageIds.entries()) {
    if (timestamp < oneHourAgo) {
      processedMessageIds.delete(messageId)
    }
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupProcessedMessages, 15 * 60 * 1000)

/**
 * Rate limiting middleware for webhook endpoint
 * Limit: 100 requests per minute per IP
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
})

/**
 * Verify WhatsApp webhook signature
 * Meta sends X-Hub-Signature-256 header with HMAC SHA256 signature
 *
 * Security: This function ALWAYS runs in production. The bypass ONLY works when:
 * 1. NODE_ENV is explicitly set to 'development' AND
 * 2. WHATSAPP_SKIP_SIGNATURE_VERIFICATION is explicitly set to 'true'
 */
function verifyWebhookSignature(req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const skipFlagEnabled = process.env.WHATSAPP_SKIP_SIGNATURE_VERIFICATION === 'true'

  // CRITICAL: Only allow bypass in development mode with explicit flag
  if (isDevelopment && skipFlagEnabled) {
    console.warn('WARNING: Skipping webhook signature verification (development only)')
    return next()
  }

  // In production or when skip flag is not set, ALWAYS verify
  // Ensure the bypass is explicitly disabled in production
  if (!isDevelopment && skipFlagEnabled) {
    console.error('SECURITY ERROR: WHATSAPP_SKIP_SIGNATURE_VERIFICATION is enabled in production')
    return res.status(500).json({ error: 'Invalid server configuration' })
  }

  const signature = req.headers['x-hub-signature-256']
  const appSecret = process.env.WHATSAPP_APP_SECRET

  if (!appSecret) {
    console.error('WHATSAPP_APP_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (!signature) {
    console.error('Missing X-Hub-Signature-256 header')
    return res.status(401).json({ error: 'Missing signature' })
  }

  // Signature format: sha256=<hash>
  const signatureHash = signature.split('=')[1]

  if (!signatureHash) {
    console.error('Invalid signature format')
    return res.status(401).json({ error: 'Invalid signature format' })
  }

  const rawBody = req.rawBody
  if (!rawBody) {
    console.warn('Missing req.rawBody; signature verification may fail')
  }

  // Calculate expected signature using HMAC SHA256
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody || JSON.stringify(req.body))
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  if (signatureHash !== expectedHash) {
    console.error('Invalid webhook signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Signature valid, proceed
  next()
}

/**
 * Get welcome message for new users
 * Sent on first WhatsApp interaction
 * @param userName - User's full name
 * @param groups - Array of groups the user belongs to
 */
function getWelcomeMessage(userName, groups = []) {
  const firstName = userName?.split(' ')[0] || 'Hola'

  // Build group info section
  let groupInfo = ''
  if (groups.length === 1) {
    groupInfo = `\n📍 Estás en el grupo: *${groups[0].name}*\n`
  } else if (groups.length > 1) {
    const groupNames = groups.map(g => g.name).join(', ')
    groupInfo = `\n📍 Estás en los grupos: *${groupNames}*\nUsá /grupo para cambiar entre ellos.\n`
  }

  return `¡Hola ${firstName}! 👋 Bienvenido a *Text The Check*

Soy tu bot para dividir gastos entre amigos.${groupInfo}

💬 *Simplemente contame qué pagaste:*
"Puse 5 lucas en el súper"
"Pagué la cena, 12000"
"Gasté 50 dólares en nafta con Juan"

La IA entiende lo que escribas y te pide confirmar antes de guardar.

💸 *Para registrar pagos entre ustedes:*
"Le pagué 5000 a María"
"Recibí 3000 de Juan"

⚡ *Comandos:*
/balance → quién debe a quién
/lista → ver últimos gastos
/ayuda → más opciones

━━━━━━━━━━━━━━━━━━━━━━

📊 Desde el dashboard podés agregar, editar y eliminar gastos:
https://textthecheck.app

¡Empezá a cargar gastos! 🎉`
}

/**
 * Test route to verify endpoint is reachable
 * GET /api/whatsapp/test
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'webhook route reachable',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Webhook verification (required by Meta/WhatsApp)
 * GET /api/whatsapp/webhook
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    console.error('Webhook verification failed:', {
      mode: mode || 'missing',
      tokenMatch: token === process.env.WHATSAPP_VERIFY_TOKEN,
      hasChallenge: !!challenge
    })
    res.sendStatus(403)
  }
})

/**
 * Webhook handler (receives messages from WhatsApp)
 * POST /api/whatsapp/webhook
 * - Rate limited to 100 requests/minute per IP
 * - Signature verified against WHATSAPP_APP_SECRET
 */
router.post('/webhook', webhookRateLimiter, verifyWebhookSignature, async (req, res) => {
  try {
    const payload = req.body

    // Respond immediately to WhatsApp (required)
    res.sendStatus(200)

    // Process the webhook asynchronously
    await processWebhook(payload)
  } catch (error) {
    console.error('Error processing webhook:', error)
  }
})

/**
 * Process WhatsApp webhook payload
 */
async function processWebhook(payload) {
  // Validate payload structure
  if (payload.object !== 'whatsapp_business_account') {
    return
  }

  if (!payload.entry) return

  for (const entry of payload.entry) {
    if (!entry.changes) continue

    for (const change of entry.changes) {
      const { value } = change

      // Only process messages
      if (!value.messages || value.messages.length === 0) {
        continue
      }

      for (const message of value.messages) {
        // Only handle text messages for now
        if (message.type !== 'text') {
          continue
        }

        await handleTextMessage(
          message.from,
          message.text.body,
          message.id
        )
      }
    }
  }
}

/**
 * Validate expense input
 * @returns {object} { valid: boolean, error?: string }
 */
function validateExpenseInput(amount, description) {
  // Amount must be a positive number
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'El monto debe ser un número positivo' }
  }

  if (amount <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a cero' }
  }

  // Description must be 1-500 characters
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Falta la descripción del gasto' }
  }

  const trimmedDescription = description.trim()

  if (trimmedDescription.length < 1) {
    return { valid: false, error: 'Falta la descripción del gasto' }
  }

  if (trimmedDescription.length > 500) {
    return { valid: false, error: 'La descripción es muy larga (máximo 500 caracteres)' }
  }

  return { valid: true }
}

/**
 * Handle incoming text message
 */
async function handleTextMessage(from, text, messageId) {
  // 0. Check for duplicate message
  if (processedMessageIds.has(messageId)) {
    return
  }

  // Mark message as processed
  processedMessageIds.set(messageId, Date.now())

  // 1. Check if phone number is authorized
  if (!isAuthorizedPhone(from)) {
    return
  }

  // 2. Get user from database
  const user = await getUserByPhone(from)

  if (!user) {
    console.error(`User not found for phone: ${from}`)
    return
  }

  // 3. Check if this is the user's first interaction (send welcome message)
  if (!user.welcomedAt) {
    // Get user's groups to include in welcome message
    const userGroups = await getAllGroupsByUserId(user.id)
    await sendMessage(from, getWelcomeMessage(user.name, userGroups))
    await markUserAsWelcomed(user.id)
    // Don't process first message - let them read the welcome first
    return
  }

  // 3.5. Check for pending AI expense confirmation (before all other checks)
  if (hasPendingAIExpense(user.id)) {
    // Check if user is confirming ("si") or cancelling ("no")
    if (isAffirmativeResponse(text)) {
      const pending = getPendingAIExpense(user.id)
      if (pending) {
        await saveConfirmedAIExpense(pending)
        clearPendingAIExpense(user.id)

        // Send success message
        const successMsg = formatExpenseConfirmation(
          pending.expense.amount,
          pending.expense.originalAmount,
          pending.expense.originalCurrency,
          pending.expense.description,
          pending.expense.category,
          pending.expense.displayNames,
          pending.groupName
        )
        await sendMessage(from, successMsg)
        return
      }
    }

    if (isNegativeResponse(text)) {
      clearPendingAIExpense(user.id)
      await sendMessage(from, formatExpenseCancelledMessage())
      return
    }

    // User sent something else (new expense, command, etc.)
    // Cancel the old pending and continue with normal processing
    clearPendingAIExpense(user.id)
    // Fall through to process new message...
  }

  // 4. Check for pending expense (user was asked which group for their expense)
  if (hasPendingExpense(user.id)) {
    const trimmed = text.trim()
    const number = parseInt(trimmed, 10)
    const pending = getPendingExpense(user.id)

    if (pending && /^\d+$/.test(trimmed)) {
      if (number >= 1 && number <= pending.groups.length) {
        // Valid selection - process the pending expense
        const selectedGroup = pending.groups[number - 1]
        clearPendingExpense(user.id)

        // Also set this as their active group for future expenses
        await updateUserActiveGroup(user.id, selectedGroup.id)

        // Process the original expense
        await handleExpenseMessage(from, pending.text, user, selectedGroup.id, selectedGroup.name)
        return
      } else {
        // Out of range number
        await sendMessage(from, `⚠️ Número inválido. Elegí un número entre 1 y ${pending.groups.length}.`)
        return
      }
    }
    // Not a number, clear pending expense and continue with normal processing
    clearPendingExpense(user.id)
  }

  // 5. Check for pending group selection (from /grupo command)
  if (hasPendingGroupSelection(user.id)) {
    const result = await handleGroupSelectionResponse(user.id, text)
    if (result) {
      // Was handled as group selection
      await sendMessage(from, result.message)
      return
    }
    // Not a group selection, continue with normal processing
  }

  // 6. Check if this is a command (before checking groups)
  if (isCommand(text)) {
    const group = await getGroupByUserId(user.id)
    const groupId = group?.id || null
    await handleCommand(from, text, user, groupId)
    return
  }

  // 7. For non-commands (expenses): check if multi-group user without activeGroupId
  const allGroups = await getAllGroupsByUserId(user.id)

  if (allGroups.length > 1 && !user.activeGroupId) {
    // User is in multiple groups but hasn't selected one yet
    // Store the expense and ask which group
    setPendingExpense(user.id, from, text, allGroups)
    await sendMessage(from, getExpenseGroupPromptMessage(allGroups))
    return
  }

  // 8. Get user's group (uses activeGroupId if set)
  const group = await getGroupByUserId(user.id)
  const groupId = group?.id || null

  // 9. Try AI parsing first (if enabled)
  if (isAIEnabled() && groupId) {
    try {
      const groupMembers = await getGroupMembers(groupId)
      // Pass member names WITH aliases so AI can recognize nicknames
      const memberInfos = groupMembers.map(m => ({
        name: m.name,
        aliases: m.aliases || []
      }))
      const aiResult = await parseMessageWithAI(text, memberInfos)

      const confidenceThreshold = getConfidenceThreshold()

      // Handle based on AI result
      if (aiResult.type === 'error') {
        // AI had an error - fall back to regex
        console.log('[AI] Error occurred, falling back to regex:', aiResult.error)
      } else if (aiResult.type === 'expense' && aiResult.confidence >= confidenceThreshold) {
        await handleAIExpense(from, aiResult, user, groupId, group?.name, text)
        return
      } else if (aiResult.type === 'payment' && aiResult.confidence >= confidenceThreshold) {
        await handleAIPayment(from, aiResult, user, groupId, group?.name)
        return
      } else if (aiResult.type === 'unknown' && aiResult.suggestion && aiResult.confidence < 0.5) {
        // AI couldn't understand - send helpful suggestion
        await sendMessage(from, `🤔 ${aiResult.suggestion}`)
        return
      } else {
        // If confidence is low, fall through to regex parsing
        console.log('[AI] Low confidence, falling back to regex parser')
      }
    } catch (error) {
      console.error('[AI] Parsing failed, falling back to regex:', error)
      // Fall through to regex parsing
    }
  }

  // 10. Check if this is a payment message (before expense processing) - regex fallback
  if (isPaymentMessage(text)) {
    await handlePaymentMessage(from, text, user, groupId, group?.name)
    return
  }

  // 11. Process as expense - regex fallback
  await handleExpenseMessage(from, text, user, groupId, group?.name)
}

/**
 * Handle bot commands
 */
async function handleCommand(from, text, user, groupId) {
  const parsed = parseCommand(text)

  if (!parsed) {
    return
  }

  const { command, args } = parsed

  switch (command) {
    case '/ayuda':
    case '/help':
      await sendMessage(from, getHelpMessage())
      break

    case '/grupo':
    case '/group':
      const { message: groupMessage, groups } = await getGroupMessage(user.id, user.activeGroupId || groupId)
      await sendMessage(from, groupMessage)
      // If user has multiple groups, set up pending selection
      if (groups.length > 1) {
        setPendingGroupSelection(user.id, groups)
      }
      break

    case '/balance':
    case '/saldo':
      if (!groupId) {
        await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
        return
      }
      const balanceMessage = await getBalanceMessage(groupId)
      await sendMessage(from, balanceMessage)
      break

    case '/lista':
    case '/list':
      if (!groupId) {
        await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
        return
      }
      const listMessage = await getExpenseListMessage(groupId)
      await sendMessage(from, listMessage)
      break

    case '/borrar':
    case '/delete':
      // Redirect to dashboard - edit/delete is dashboard-only
      await sendMessage(from, `✏️ Para agregar, editar o eliminar gastos manualmente, usá el dashboard:\n\nhttps://textthecheck.app`)
      break

    default:
      await sendMessage(from, getUnknownCommandMessage(command))
      break
  }
}

/**
 * Handle expense messages
 */
async function handleExpenseMessage(from, text, user, groupId, groupName) {
  // 1. Check for currency conversion
  const currencyInfo = extractCurrency(text)
  let finalAmount = 0
  let originalAmount
  let originalCurrency

  // 2. Parse the expense message
  const parsed = parseExpenseMessage(text)

  if (currencyInfo) {
    finalAmount = await convertToARS(currencyInfo.amount, currencyInfo.currency)
    originalAmount = currencyInfo.amount
    originalCurrency = currencyInfo.currency
  } else {
    finalAmount = parsed.amount
  }

  // 3. If parsing failed, send error message
  if (parsed.needsReview) {
    await sendMessage(from, formatParseErrorMessage())
    return
  }

  // 4. Clean description - remove currency words (euro, usd, etc.)
  const cleanDescription = stripCurrencyFromDescription(parsed.description)

  // 5. Validate input before creating expense
  const validation = validateExpenseInput(finalAmount, cleanDescription)

  if (!validation.valid) {
    await sendMessage(from, formatValidationErrorMessage(validation.error))
    return
  }

  // 6. Resolve @mentions to user IDs using fuzzy matching
  let resolvedSplitAmong = []
  let displayNames = [] // Names to show in confirmation message

  if (parsed.splitAmong && parsed.splitAmong.length > 0 && groupId) {
    // Get group members for fuzzy matching
    const groupMembers = await getGroupMembers(groupId)
    resolvedSplitAmong = resolveMentionsToUserIds(parsed.splitAmong, groupMembers)

    // Note: We do NOT auto-include the sender anymore.
    // If someone logs an expense for others (e.g., "@Juan @Maria"),
    // they must mention themselves to be included in the split.
    // This allows logging expenses on behalf of others.

    // Build display names from resolved mentions
    displayNames = parsed.splitAmong
  }

  // 7. Create expense in Firestore
  try {
    await createExpense({
      userId: user.id,
      userName: user.name,
      amount: finalAmount,
      originalAmount,
      originalCurrency,
      originalInput: text,
      description: cleanDescription,
      category: parsed.category || 'general',
      splitAmong: resolvedSplitAmong,
      groupId: groupId,
      timestamp: new Date()
    })

    // 8. Send confirmation message to user
    const confirmationMessage = formatExpenseConfirmation(
      finalAmount,
      originalAmount,
      originalCurrency,
      cleanDescription,
      parsed.category || 'general',
      displayNames, // Show sender + mentioned names
      groupName // Show which group the expense was registered in
    )

    await sendMessage(from, confirmationMessage)
  } catch (error) {
    console.error('Error creating expense:', error)
    await sendMessage(
      from,
      '❌ *Error al guardar el gasto*\n\nOcurrió un error al procesar tu mensaje. Por favor intentá de nuevo.\n\n📊 También podés cargarlo desde https://textthecheck.app'
    )
  }
}

/**
 * Save a confirmed AI expense to Firestore
 * Called when user confirms pending AI expense with "si"
 */
async function saveConfirmedAIExpense(pending) {
  await createExpense({
    userId: pending.userId,
    userName: pending.userName,
    amount: pending.expense.amount,
    originalAmount: pending.expense.originalAmount,
    originalCurrency: pending.expense.originalCurrency,
    originalInput: pending.originalText,  // Include original message
    description: pending.expense.description,
    category: pending.expense.category,
    splitAmong: pending.expense.splitAmong,
    groupId: pending.groupId,
    timestamp: new Date()
  })
}

/**
 * Handle payment messages
 * Processes "pagué X @Person" or "recibí X @Person" commands
 */
async function handlePaymentMessage(from, text, user, groupId, groupName) {
  // 1. Check if user is in a group
  if (!groupId) {
    await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
    return
  }

  // 2. Parse the payment message
  const parsed = parsePaymentMessage(text)

  if (!parsed) {
    await sendMessage(from, formatPaymentErrorMessage('invalid_amount'))
    return
  }

  // 3. Validate amount
  if (parsed.amount <= 0) {
    await sendMessage(from, formatPaymentErrorMessage('invalid_amount'))
    return
  }

  // 4. Get group members to resolve the mention
  const groupMembers = await getGroupMembers(groupId)

  // 5. Resolve the @mention to a user
  const mentionedUser = matchMention(parsed.mention, groupMembers)

  if (!mentionedUser) {
    await sendMessage(from, formatPaymentErrorMessage('invalid_mention'))
    return
  }

  // 6. Check for self-payment
  if (mentionedUser.id === user.id) {
    await sendMessage(from, formatPaymentErrorMessage('self_payment'))
    return
  }

  // 7. Determine fromUserId and toUserId based on payment type
  let fromUserId, toUserId
  let confirmationDirection, notificationDirection

  if (parsed.type === 'paid') {
    // User paid the mentioned person -> money goes FROM user TO mentioned
    fromUserId = user.id
    toUserId = mentionedUser.id
    confirmationDirection = 'to'
    notificationDirection = 'paid_to_you'
  } else {
    // User received from mentioned person -> money goes FROM mentioned TO user
    fromUserId = mentionedUser.id
    toUserId = user.id
    confirmationDirection = 'from'
    notificationDirection = 'received_from_you'
  }

  // 8. Create the payment record
  try {
    await createPayment({
      groupId,
      fromUserId,
      toUserId,
      amount: parsed.amount,
      recordedBy: user.id
    })

    // 9. Send confirmation to the person who recorded
    const confirmationMessage = formatPaymentConfirmation(
      parsed.amount,
      mentionedUser.name,
      groupName,
      confirmationDirection
    )
    await sendMessage(from, confirmationMessage)

    // 10. Send notification to the other party
    const otherUser = await getUserById(mentionedUser.id)
    if (otherUser?.phone) {
      const notificationMessage = formatPaymentNotification(
        parsed.amount,
        user.name,
        groupName,
        notificationDirection
      )
      await sendMessage(otherUser.phone, notificationMessage)
    }
  } catch (error) {
    console.error('Error creating payment:', error)
    await sendMessage(
      from,
      '❌ *Error al registrar el pago*\n\nOcurrió un error al procesar tu mensaje. Por favor intentá de nuevo.\n\n📊 También podés registrarlo desde https://textthecheck.app'
    )
  }
}

/**
 * Handle AI-parsed expense
 * Instead of saving directly, stores as pending and asks for user confirmation
 * This catches wrong group and unresolved name issues before saving
 */
async function handleAIExpense(from, aiResult, user, groupId, groupName, originalText) {
  // 1. Convert currency if needed
  let finalAmount = aiResult.amount
  let originalAmount
  let originalCurrency

  if (aiResult.currency !== 'ARS') {
    finalAmount = await convertToARS(aiResult.amount, aiResult.currency)
    originalAmount = aiResult.amount
    originalCurrency = aiResult.currency
  }

  // 2. Validate input
  const validation = validateExpenseInput(finalAmount, aiResult.description)

  if (!validation.valid) {
    await sendMessage(from, formatValidationErrorMessage(validation.error))
    return
  }

  // 3. Resolve mentions WITH TRACKING of unresolved names
  const groupMembers = await getGroupMembers(groupId)
  let resolvedSplitAmong = []
  let displayNames = []
  let unresolvedNames = []

  // Handle exclusion pattern: "todos menos [names]"
  if (aiResult.excludeFromSplit && aiResult.excludeFromSplit.length > 0) {
    // This is an exclusion pattern - start with all group members
    const allMemberIds = groupMembers.map(m => m.id)
    const allMemberNames = groupMembers.map(m => m.name)

    // Resolve excluded names to IDs
    const excludeResolution = resolveMentionsWithTracking(aiResult.excludeFromSplit, groupMembers)

    // Check for unresolved exclusion names
    if (excludeResolution.unresolvedNames.length > 0) {
      const isSingular = excludeResolution.unresolvedNames.length === 1
      let errorMsg = isSingular
        ? `⚠️ *No pude encontrar a esta persona en el grupo:*\n`
        : `⚠️ *No pude encontrar a estas personas en el grupo:*\n`
      for (const name of excludeResolution.unresolvedNames) {
        errorMsg += `• ${name}\n`
      }
      errorMsg += `\n📁 Grupo actual: *${groupName}*\n`
      errorMsg += `\n💡 *¿Qué podés hacer?*\n`
      errorMsg += `• Revisá que el nombre esté bien escrito\n`
      errorMsg += `• Usá /grupo para cambiar de grupo\n`
      errorMsg += `• Volvé a enviar el gasto con los nombres correctos\n`
      errorMsg += `\n📊 O cargalo desde https://textthecheck.app`

      await sendMessage(from, errorMsg)
      return
    }

    // Filter out excluded members
    resolvedSplitAmong = allMemberIds.filter(id => !excludeResolution.resolvedUserIds.includes(id))
    displayNames = allMemberNames.filter((name, i) => !excludeResolution.resolvedUserIds.includes(allMemberIds[i]))

    // Handle includesSender for exclusion patterns
    if (!aiResult.includesSender && resolvedSplitAmong.includes(user.id)) {
      resolvedSplitAmong = resolvedSplitAmong.filter(id => id !== user.id)
      displayNames = displayNames.filter(name => name !== user.name)
    }

    // Check if we have anyone left to split with
    if (resolvedSplitAmong.length === 0) {
      await sendMessage(from, '⚠️ No podés excluir a todo el grupo. Tiene que haber al menos una persona para dividir el gasto.')
      return
    }
  } else if (aiResult.splitAmong && aiResult.splitAmong.length > 0) {
    // Normal mention pattern (not exclusion)
    // Use the new tracking function to capture unresolved names
    const resolution = resolveMentionsWithTracking(aiResult.splitAmong, groupMembers)
    resolvedSplitAmong = resolution.resolvedUserIds
    displayNames = resolution.resolvedNames
    unresolvedNames = resolution.unresolvedNames

    // If includesSender is true (natural language like "con Juan"),
    // add the sender to the split if not already included
    if (aiResult.includesSender && !resolvedSplitAmong.includes(user.id)) {
      resolvedSplitAmong.push(user.id)
      displayNames.push(user.name)
    }
  } else if (aiResult.includesSender) {
    // No mentions but includesSender is true - sender is part of the group split
    // Don't add to displayNames, will show "Todo el grupo"
  }

  // 4. REJECT if there are unresolved names (don't allow partial splits)
  if (unresolvedNames.length > 0) {
    const isSingular = unresolvedNames.length === 1
    let errorMsg = isSingular
      ? `⚠️ *No pude encontrar a esta persona en el grupo:*\n`
      : `⚠️ *No pude encontrar a estas personas en el grupo:*\n`
    for (const name of unresolvedNames) {
      errorMsg += `• ${name}\n`
    }
    errorMsg += `\n📁 Grupo actual: *${groupName}*\n`
    errorMsg += `\n💡 *¿Qué podés hacer?*\n`
    errorMsg += `• Revisá que el nombre esté bien escrito\n`
    errorMsg += `• Usá /grupo para cambiar de grupo\n`
    errorMsg += `• Volvé a enviar el gasto con los nombres correctos\n`
    errorMsg += `\n📊 O cargalo desde https://textthecheck.app`

    await sendMessage(from, errorMsg)
    return
  }

  // 5. Auto-categorize based on description
  const category = categorizeFromDescription(aiResult.description)

  // 6. Store as PENDING (don't save yet!)
  setPendingAIExpense(user.id, {
    from,
    originalText,  // Store original message for Firestore
    expense: {
      amount: finalAmount,
      originalAmount,
      originalCurrency,
      description: aiResult.description,
      category,
      splitAmong: resolvedSplitAmong,
      displayNames,
      includesSender: aiResult.includesSender
    },
    userId: user.id,
    userName: user.name,
    groupId,
    groupName,
    createdAt: new Date()
  })

  // 7. Send confirmation REQUEST (not confirmation)
  const confirmationRequestMsg = formatExpenseConfirmationRequest(
    finalAmount,
    originalAmount,
    originalCurrency,
    aiResult.description,
    category,
    groupName,
    displayNames
  )

  await sendMessage(from, confirmationRequestMsg)
}

/**
 * Handle AI-parsed payment
 * Processes payment data extracted by AI from natural language
 */
async function handleAIPayment(from, aiResult, user, groupId, groupName) {
  // 1. Check if user is in a group
  if (!groupId) {
    await sendMessage(from, '⚠️ No pertenecés a ningún grupo.')
    return
  }

  // 2. Validate amount
  if (aiResult.amount <= 0) {
    await sendMessage(from, formatPaymentErrorMessage('invalid_amount'))
    return
  }

  // 3. Get group members to resolve the mention
  const groupMembers = await getGroupMembers(groupId)

  // 4. Resolve the person name to a user
  const mentionedUser = matchMention(aiResult.person, groupMembers)

  if (!mentionedUser) {
    await sendMessage(from, formatPaymentErrorMessage('invalid_mention'))
    return
  }

  // 5. Check for self-payment
  if (mentionedUser.id === user.id) {
    await sendMessage(from, formatPaymentErrorMessage('self_payment'))
    return
  }

  // 6. Convert currency if needed
  let amount = aiResult.amount
  if (aiResult.currency !== 'ARS') {
    amount = await convertToARS(aiResult.amount, aiResult.currency)
  }

  // 7. Determine fromUserId and toUserId based on direction
  let fromUserId, toUserId
  let confirmationDirection, notificationDirection

  if (aiResult.direction === 'paid') {
    // User paid the mentioned person
    fromUserId = user.id
    toUserId = mentionedUser.id
    confirmationDirection = 'to'
    notificationDirection = 'paid_to_you'
  } else {
    // User received from mentioned person
    fromUserId = mentionedUser.id
    toUserId = user.id
    confirmationDirection = 'from'
    notificationDirection = 'received_from_you'
  }

  // 8. Create the payment record
  try {
    await createPayment({
      groupId,
      fromUserId,
      toUserId,
      amount,
      recordedBy: user.id
    })

    // 9. Send confirmation to the person who recorded
    const confirmationMessage = formatPaymentConfirmation(
      amount,
      mentionedUser.name,
      groupName,
      confirmationDirection
    )
    await sendMessage(from, confirmationMessage)

    // 10. Send notification to the other party
    const otherUser = await getUserById(mentionedUser.id)
    if (otherUser?.phone) {
      const notificationMessage = formatPaymentNotification(
        amount,
        user.name,
        groupName,
        notificationDirection
      )
      await sendMessage(otherUser.phone, notificationMessage)
    }
  } catch (error) {
    console.error('Error creating AI payment:', error)
    await sendMessage(
      from,
      '❌ *Error al registrar el pago*\n\nOcurrió un error al procesar tu mensaje. Por favor intentá de nuevo.\n\n📊 También podés registrarlo desde https://textthecheck.app'
    )
  }
}

/**
 * Simple categorization based on description keywords
 * Used for AI-parsed expenses
 */
function categorizeFromDescription(description) {
  const keywords = {
    food: [
      'lunch', 'almuerzo', 'dinner', 'cena', 'breakfast', 'desayuno',
      'comida', 'restaurant', 'restaurante', 'pizza', 'burger',
      'coffee', 'café', 'beer', 'cerveza', 'birra', 'drink', 'bebida',
      'snack', 'groceries', 'supermercado', 'market', 'mercado', 'morfi'
    ],
    transport: [
      'taxi', 'uber', 'cabify', 'bus', 'colectivo', 'bondi', 'train', 'tren',
      'metro', 'subte', 'subway', 'flight', 'vuelo', 'car', 'auto',
      'rental', 'alquiler', 'gas', 'nafta', 'parking', 'estacionamiento'
    ],
    accommodation: [
      'hotel', 'airbnb', 'hostel', 'alojamiento', 'lodging',
      'rent', 'alquiler', 'house', 'casa', 'apartment', 'apartamento', 'depto'
    ],
    entertainment: [
      'ticket', 'entrada', 'show', 'espectaculo', 'museum', 'museo',
      'tour', 'excursion', 'excursión', 'activity', 'actividad',
      'game', 'juego', 'movie', 'cine', 'theater', 'teatro',
      'club', 'bar', 'disco', 'party', 'fiesta', 'boliche'
    ]
  }

  const lowerDesc = description.toLowerCase()

  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowerDesc.includes(word)) {
        return category
      }
    }
  }

  return 'general'
}

export default router