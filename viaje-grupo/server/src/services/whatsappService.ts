/**
 * WhatsApp Cloud API Service
 * Handles outbound messaging to users
 */

interface SendMessageResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Normalize phone number for WhatsApp API
 * Handles Argentina's special "15" mobile prefix format
 * @param phoneNumber - Phone number in any format
 * @returns Normalized phone number with + prefix
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove any spaces, dashes, or parentheses
  let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '')

  // Add + prefix if missing
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized
  }

  // Handle Argentina mobile numbers
  // WhatsApp sends: 5493794702813 (format: 54 + 9 + area + number)
  // Meta expects: 543791547028013 (format: 54 + area + 15 + number)
  // We need to insert "15" after the area code
  if (normalized.startsWith('+549')) {
    // Argentina mobile number
    // Extract: +549 + [area code] + [number]
    // Convert to: +54 + [area code] + 15 + [number]

    // Remove the '9' after country code and add '15' after area code
    // Area codes in Argentina are 2-4 digits
    // For Corrientes (379), it's 3 digits

    // Pattern: +549[area code][local number]
    // Try matching in order: 3-digit area (most common), then 4-digit, then 2-digit
    const withoutPrefix = normalized.substring(3) // Remove "+54"

    // Try different area code lengths in order of likelihood
    let match =
      withoutPrefix.match(/^9(\d{3})(\d{7})$/) ||  // 3-digit area + 7-digit number
      withoutPrefix.match(/^9(\d{4})(\d{6})$/) ||  // 4-digit area + 6-digit number
      withoutPrefix.match(/^9(\d{2})(\d{8})$/)     // 2-digit area + 8-digit number (Buenos Aires)

    if (match) {
      const areaCode = match[1]
      const localNumber = match[2]

      // Reconstruct: +54 + area + 15 + number
      normalized = `+54${areaCode}15${localNumber}`

      console.log(`🇦🇷 Argentina number detected: +549${areaCode}${localNumber} → ${normalized}`)
    }
  }

  return normalized
}

/**
 * Send a text message to a WhatsApp user
 * @param phoneNumber - Recipient phone number (format: +5491112345678)
 * @param text - Message text to send
 * @returns Promise with success status and message ID
 */
export async function sendMessage(
  phoneNumber: string,
  text: string
): Promise<SendMessageResponse> {
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!apiToken) {
    console.error('❌ WHATSAPP_API_TOKEN not configured')
    return { success: false, error: 'API token not configured' }
  }

  if (!phoneNumberId) {
    console.error('❌ WHATSAPP_PHONE_NUMBER_ID not configured')
    return { success: false, error: 'Phone number ID not configured' }
  }

  // Normalize phone number to ensure + prefix
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  console.log(`📤 Sending message to: ${phoneNumber} → normalized: ${normalizedPhone}`)

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedPhone,
    type: 'text',
    text: {
      preview_url: true,
      body: text,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: any = await response.json()

    if (!response.ok) {
      console.error('❌ WhatsApp API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Unknown API error',
      }
    }

    console.log('✅ Message sent successfully:', data.messages?.[0]?.id)

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Format amount in Argentine peso format
 * Uses period for thousands, comma for decimals: $1.702,46
 */
function formatARS(amount: number): string {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Format amount in international format (USD, EUR, BRL)
 * Uses comma for thousands, period for decimals: 1,702.46
 */
function formatInternational(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Format a success confirmation message for expense creation
 */
export function formatExpenseConfirmation(
  amount: number,
  originalAmount: number | undefined,
  originalCurrency: string | undefined,
  description: string,
  category: string,
  splitAmong: string[],
  groupName?: string
): string {
  let message = '✅ *Gasto registrado*'

  // Show group name if provided
  if (groupName) {
    message += ` en *${groupName}*`
  }
  message += '\n\n'

  // Amount line - use correct format for each currency
  if (originalCurrency && originalCurrency !== 'ARS') {
    message += `💰 ${originalCurrency} ${formatInternational(originalAmount || 0)} → $${formatARS(amount)} ARS\n`
  } else {
    message += `💰 $${formatARS(amount)} ARS\n`
  }

  message += `📝 ${description}\n`
  message += `🏷️ ${getCategoryEmoji(category)} ${category}\n`

  // Split details
  if (splitAmong && splitAmong.length > 0) {
    message += `👥 Dividido entre: ${splitAmong.join(', ')}\n`
  } else {
    message += `👥 Dividido entre todos\n`
  }

  // Dashboard link (full URL for WhatsApp to make it clickable)
  message += `\n📊 Ver detalles en https://textthecheck.app`

  return message
}

/**
 * Format confirmation REQUEST message for AI-parsed expenses
 * Shows expense details and asks user to confirm with "si" or cancel with "no"
 * Note: Unresolved names are rejected earlier, so this only shows valid expenses
 */
export function formatExpenseConfirmationRequest(
  amount: number,
  originalAmount: number | undefined,
  originalCurrency: string | undefined,
  description: string,
  category: string,
  groupName: string,
  displayNames: string[]
): string {
  let message = `🔍 *¿Guardar este gasto?*\n\n`
  message += `📁 *Grupo: ${groupName}*\n\n`

  // Amount line - use correct format for each currency
  if (originalCurrency && originalCurrency !== 'ARS') {
    message += `💵 ${originalCurrency} ${formatInternational(originalAmount || 0)} → $${formatARS(amount)} ARS\n`
  } else {
    message += `💵 $${formatARS(amount)} ARS\n`
  }

  message += `📝 ${description}\n`

  if (category) {
    message += `🏷️ ${getCategoryEmoji(category)} ${category}\n`
  }

  // Who splits
  if (displayNames && displayNames.length > 0) {
    message += `👥 Dividido entre: ${displayNames.join(', ')}\n`
  } else {
    message += `👥 Dividido entre: Todo el grupo\n`
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`
  message += `⬇️ *RESPONDÉ PARA CONFIRMAR* ⬇️\n\n`
  message += `✅  *si*  → Guardar gasto\n`
  message += `❌  *no*  → Cancelar`

  return message
}

/**
 * Format cancellation message for AI expenses
 */
export function formatExpenseCancelledMessage(): string {
  return `❌ Gasto cancelado.\n\nPodés intentar de nuevo o cargarlo desde https://textthecheck.app`
}

/**
 * Format error message for parsing failures
 */
export function formatParseErrorMessage(): string {
  return `⚠️ *No pude entender el mensaje*\n\n` +
    `Probá decirlo de otra forma, por ejemplo:\n` +
    `• "Puse 50 en el almuerzo"\n` +
    `• "Pagué 1500 del taxi"\n` +
    `• "Gasté 20 dólares en la cena con Juan"\n\n` +
    `_Escribí /ayuda para más info_\n\n` +
    `📊 También podés cargar gastos en https://textthecheck.app`
}

/**
 * Format error message for validation failures
 */
export function formatValidationErrorMessage(error: string): string {
  return `⚠️ *${error}*\n\n` +
    `Probá de nuevo o agregá el gasto desde el dashboard:\n` +
    `https://textthecheck.app`
}

/**
 * Format error message for unknown @mention
 */
export function formatUnknownMentionMessage(mention: string, suggestion?: string): string {
  if (suggestion) {
    return `⚠️ No encontré a *@${mention}*. ¿Quisiste decir *@${suggestion}*?`
  }
  return `⚠️ No encontré a *@${mention}* en el grupo.`
}

/**
 * Get emoji for expense category
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    food: '🍽️',
    transport: '🚗',
    accommodation: '🏨',
    entertainment: '🎉',
    general: '📌',
  }

  return emojiMap[category] || '📌'
}

/**
 * Format payment confirmation message for the person who recorded it
 */
export function formatPaymentConfirmation(
  amount: number,
  otherPersonName: string,
  groupName: string,
  direction: 'to' | 'from'
): string {
  const formattedAmount = formatARS(amount)
  const directionLabel = direction === 'to' ? 'Para' : 'De'

  return `✅ *Pago registrado*

Monto: $${formattedAmount}
${directionLabel}: ${otherPersonName}
Grupo: ${groupName}

Tu balance con ${otherPersonName.split(' ')[0]} se actualizó.

📊 Ver detalles en https://textthecheck.app`
}

/**
 * Format payment notification message for the other party
 */
export function formatPaymentNotification(
  amount: number,
  recorderName: string,
  groupName: string,
  direction: 'paid_to_you' | 'received_from_you'
): string {
  const formattedAmount = formatARS(amount)
  const firstName = recorderName.split(' ')[0]

  let message: string
  if (direction === 'paid_to_you') {
    message = `${firstName} registró un pago de $${formattedAmount} hacia vos.`
  } else {
    message = `${firstName} registró que recibió $${formattedAmount} de vos.`
  }

  return `💸 *Pago registrado*

${message}
Grupo: ${groupName}

📊 Ver detalles en https://textthecheck.app`
}

/**
 * Format payment error messages
 */
export function formatPaymentErrorMessage(errorType: 'no_mention' | 'invalid_mention' | 'multiple_mentions' | 'invalid_amount' | 'self_payment'): string {
  const messages: Record<string, string> = {
    no_mention: "⚠️ Indicá a quién le pagaste. Ejemplo: pagué 5000 @Maria",
    invalid_mention: "⚠️ No encontré a esa persona en este grupo",
    multiple_mentions: "⚠️ Solo podés registrar un pago a una persona por vez",
    invalid_amount: "⚠️ El monto debe ser un número positivo",
    self_payment: "⚠️ No podés registrar un pago a vos mismo"
  }

  const baseMessage = messages[errorType] || "⚠️ Error al procesar el pago"
  return `${baseMessage}\n\n📊 También podés registrar pagos en https://textthecheck.app`
}
