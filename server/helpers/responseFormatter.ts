/**
 * responseFormatter — shared WhatsApp message formatting for Grupos & Finanzas.
 *
 * Amount formatting, confirmation flow, error messages, help messages,
 * balance/summary display, payment messages. Used by both handlers.
 */

// ─── Types & Constants ──────────────────────────────────────────

export type AppMode = 'grupos' | 'finanzas'

export interface AmountDisplay {
  amount: number
  originalAmount?: number
  originalCurrency?: string
}

export interface BalanceEntry {
  name: string
  net: number
}

export interface ExpenseListEntry {
  amount: number
  description: string
  userName: string
  timestamp: Date
}

export interface MonthlySummaryOptions {
  monthName: string
  year: number
  total: number
  paymentCount: number
  comparison?: string
  topCategories?: Array<{ name: string; amount: number }>
  pendingRecurrents?: number
}

export interface RecurringSummaryOptions {
  totalMonthly: number
  pending: Array<{ title: string; amount: number; daysUntilDue: number }>
  paid: Array<{ title: string; amount: number }>
}

export interface GruposConfirmationRequest {
  mode: 'grupos'
  amount: number
  originalAmount?: number
  originalCurrency?: string
  description: string
  category: string
  groupName: string
  displayNames: string[]
}

export interface FinanzasConfirmationRequest {
  mode: 'finanzas'
  amount: number
  title: string
  categoryName: string
  description?: string
}

export type ConfirmationRequestOptions = GruposConfirmationRequest | FinanzasConfirmationRequest

export interface GruposConfirmationSuccess {
  mode: 'grupos'
  amount: number
  originalAmount?: number
  originalCurrency?: string
  description: string
  category: string
  displayNames: string[]
  groupName?: string
}

export interface FinanzasConfirmationSuccess {
  mode: 'finanzas'
  title: string
  amount: number
  categoryName: string
  description?: string
}

export type ConfirmationSuccessOptions = GruposConfirmationSuccess | FinanzasConfirmationSuccess

export interface TransferConfirmationOptions {
  title: string
  amount: number
  categoryName: string
  recipientName?: string
  needsRevision: boolean
}

const APP_URL = 'https://textthecheck.app'
const BRAND_NAME = 'text the check'

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️', transport: '🚗', accommodation: '🏨', entertainment: '🎉', general: '📌',
}

const AFFIRMATIVE_WORDS = ['si', 'sí', 'yes', 's', 'ok', 'dale', 'va', 'bueno', 'listo', 'confirmo']
const NEGATIVE_WORDS = ['no', 'n', 'cancelar', 'cancel', 'nope', 'na', 'nel']

// ─── Amount Formatting ──────────────────────────────────────────

export function formatAmount(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatAmountFull(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatInternational(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatAmountLine(display: AmountDisplay): string {
  if (display.originalCurrency && display.originalCurrency !== 'ARS') {
    return `${display.originalCurrency} ${formatInternational(display.originalAmount || 0)} → ${formatAmountFull(display.amount)} ARS`
  }
  return `${formatAmountFull(display.amount)} ARS`
}

// ─── WhatsApp Helpers ───────────────────────────────────────────

export function bold(text: string): string { return `*${text}*` }
export function italic(text: string): string { return `_${text}_` }

export function appFooter(action?: string): string {
  return `📊 ${action || 'Ver detalles en'} ${APP_URL}`
}

export function formatRelativeDate(date: Date): string {
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) { const w = Math.floor(diffDays / 7); return `hace ${w} semana${w > 1 ? 's' : ''}` }
  const m = Math.floor(diffDays / 30); return `hace ${m} mes${m > 1 ? 'es' : ''}`
}

export function formatDueDate(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `vencido hace ${Math.abs(daysUntilDue)} dias`
  if (daysUntilDue === 0) return 'vence hoy'
  if (daysUntilDue === 1) return 'vence manana'
  return `vence en ${daysUntilDue} dias`
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || '📌'
}

// ─── Confirmation Flow ──────────────────────────────────────────

export function isAffirmativeResponse(text: string): boolean {
  return AFFIRMATIVE_WORDS.includes(text.trim().toLowerCase())
}

export function isNegativeResponse(text: string): boolean {
  return NEGATIVE_WORDS.includes(text.trim().toLowerCase())
}

export function buildConfirmationRequest(options: ConfirmationRequestOptions): string {
  if (options.mode === 'grupos') {
    let msg = `🔍 ${bold('¿Guardar este gasto?')}\n\n📁 ${bold(`Grupo: ${options.groupName}`)}\n\n`
    msg += `💵 ${formatAmountLine({ amount: options.amount, originalAmount: options.originalAmount, originalCurrency: options.originalCurrency })}\n`
    msg += `📝 ${options.description}\n`
    if (options.category) msg += `🏷️ ${getCategoryEmoji(options.category)} ${options.category}\n`
    msg += options.displayNames.length > 0 ? `👥 Dividido entre: ${options.displayNames.join(', ')}\n` : '👥 Dividido entre: Todo el grupo\n'
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n⬇️ ${bold('RESPONDÉ PARA CONFIRMAR')} ⬇️\n\n✅  ${bold('si')}  → Guardar gasto\n❌  ${bold('no')}  → Cancelar`
    return msg
  }

  // finanzas
  let msg = `🔍 ${bold('¿Guardar este gasto?')}\n\n`
  msg += `💵 ${formatAmountFull(options.amount)} ARS\n`
  msg += `📝 ${options.title}\n`
  msg += `🏷️ #${options.categoryName.toLowerCase()}\n`
  if (options.description) msg += `${italic(options.description)}\n`
  msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n⬇️ ${bold('RESPONDÉ PARA CONFIRMAR')} ⬇️\n\n✅  ${bold('si')}  → Guardar gasto\n❌  ${bold('no')}  → Cancelar`
  return msg
}

export function buildConfirmationSuccess(options: ConfirmationSuccessOptions): string {
  if (options.mode === 'grupos') {
    let msg = `✅ ${bold('Gasto registrado')}`
    if (options.groupName) msg += ` en ${bold(options.groupName)}`
    msg += '\n\n'
    msg += `💰 ${formatAmountLine({ amount: options.amount, originalAmount: options.originalAmount, originalCurrency: options.originalCurrency })}\n`
    msg += `📝 ${options.description}\n🏷️ ${getCategoryEmoji(options.category)} ${options.category}\n`
    msg += options.displayNames.length > 0 ? `👥 Dividido entre: ${options.displayNames.join(', ')}\n` : '👥 Dividido entre todos\n'
    msg += `\n${appFooter()}`
    return msg
  }

  // finanzas
  let msg = `✅ Gasto registrado!\n\n${bold(options.title)}\n${formatAmountFull(options.amount)}\n#${options.categoryName.toLowerCase()}`
  if (options.description) msg += `\n${italic(options.description)}`
  return msg
}

export function buildConfirmationCancelled(): string {
  return `❌ Gasto cancelado.\n\nPodés intentar de nuevo o cargarlo desde ${APP_URL}`
}

// ─── Error Messages ─────────────────────────────────────────────

export function formatParseError(mode: AppMode, suggestedCategories?: string[]): string {
  if (mode === 'grupos') {
    return `⚠️ ${bold('No pude entender el mensaje')}\n\nProbá decirlo de otra forma, por ejemplo:\n• "Puse 50 en el almuerzo"\n• "Pagué 1500 del taxi"\n• "Gasté 20 dólares en la cena con Juan"\n\n${italic('Escribí /ayuda para más info')}\n\n${appFooter('También podés cargar gastos en')}`
  }

  // finanzas
  const catsFormatted = suggestedCategories?.slice(0, 3).map(c => `#${c}`).join(' ') || ''
  return `No pude entender el mensaje.\n\n${bold('Formato:')}\n\`$<monto> <titulo> #<cat>\`\n\n${bold('Ejemplos:')}\n\`$500 Super #supermercado\`\n\`$1500 Cena #salidas\`\n\n${bold('Categorias sugeridas:')}\n${catsFormatted}\n\nEscribi AYUDA para mas info.`
}

export function formatValidationError(error: string): string {
  return `⚠️ ${bold(error)}\n\nProbá de nuevo o agregá el gasto desde el dashboard:\n${APP_URL}`
}

export function formatNotLinkedError(): string {
  return `Este número no está vinculado a ninguna cuenta.\n\nPara vincular tu cuenta:\n1. Registrate en ${APP_URL}\n2. Andá a tu Perfil\n3. Tocá "Generar código" en la sección WhatsApp\n4. Enviá acá: VINCULAR <código>`
}

export function formatUnresolvedNamesError(names: string[], groupName: string): string {
  const isSingular = names.length === 1
  let msg = isSingular ? `⚠️ ${bold('No pude encontrar a esta persona en el grupo:')}\n` : `⚠️ ${bold('No pude encontrar a estas personas en el grupo:')}\n`
  for (const name of names) msg += `• ${name}\n`
  msg += `\n📁 Grupo actual: ${bold(groupName)}\n\n💡 ${bold('¿Qué podés hacer?')}\n• Revisá que el nombre esté bien escrito\n• Usá /grupo para cambiar de grupo\n• Volvé a enviar el gasto con los nombres correctos\n\n${appFooter('O cargalo desde')}`
  return msg
}

export function formatPaymentError(errorType: string): string {
  const messages: Record<string, string> = {
    no_mention: '⚠️ Indicá a quién le pagaste. Ejemplo: pagué 5000 @Maria',
    invalid_mention: '⚠️ No encontré a esa persona en este grupo',
    multiple_mentions: '⚠️ Solo podés registrar un pago a una persona por vez',
    invalid_amount: '⚠️ El monto debe ser un número positivo',
    self_payment: '⚠️ No podés registrar un pago a vos mismo',
  }
  return `${messages[errorType] || '⚠️ Error al procesar el pago'}\n\n${appFooter('También podés registrar pagos en')}`
}

export function formatSaveError(entityType: 'gasto' | 'pago' | 'transferencia'): string {
  const verb = entityType === 'gasto' ? 'guardar' : 'registrar'
  return `❌ ${bold(`Error al ${verb} el ${entityType}`)}\n\nOcurrió un error al procesar tu mensaje. Por favor intentá de nuevo.\n\n${appFooter(`También podés ${verb === 'guardar' ? 'cargarlo' : 'registrarlo'} desde`)}`
}

export function formatMediaError(action: 'descargar' | 'procesar'): string {
  if (action === 'descargar') return 'Error al descargar. Intenta nuevamente.'
  return 'No pude procesar. Intenta de nuevo o registra manualmente.'
}

// ─── Help Messages ──────────────────────────────────────────────

export function formatHelpMessage(mode: AppMode, categories?: string[]): string {
  if (mode === 'grupos') {
    return `📖 ${bold(`Cómo usar ${BRAND_NAME}`)}\n\n💬 ${bold('Contame qué pagaste:')}\n"Puse 150 en la pizza"\n"Pagué 50 dólares la cena"\n"Gasté 5 lucas en el taxi"\n\nPor defecto se divide entre todos.\nSi mencionás personas, se divide solo entre ellas.\n\n💸 ${bold('Registrar pagos:')}\n"Le pagué 5000 a María"\n"Recibí 3000 de Juan"\n\n💱 ${bold('Monedas:')} USD, EUR, BRL → se convierten a ARS\n\n⚡ ${bold('Comandos:')}\n/balance - Ver quién debe a quién\n/lista - Ver últimos gastos\n/grupo - Cambiar de grupo\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n${appFooter('Agregar, editar o eliminar gastos:')}`
  }

  // finanzas
  const catsFormatted = (categories || []).map(c => `#${c}`).join('\n')

  return `${bold(`${BRAND_NAME} - Ayuda`)}\n\n${bold('Formato:')}\n\`\`\`\n$<monto> <titulo> #<cat>\n\`\`\`\n\n${bold('Ejemplos:')}\n\`$500 Super #supermercado\`\n\`$1500 Cena #salidas d:Cumple\`\n\`$2000 Uber\` (sin cat = Otros)\n\n${bold('Tus categorias frecuentes:')}\n${catsFormatted}\n\nPodes escribir parte del nombre:\n#super -> Supermercado\n#sal -> Salidas\n\n${bold('Tambien podes enviar:')}\n- Audio describiendo un gasto\n- Foto de comprobante de transferencia\n- PDF de comprobante de transferencia\n\n${bold('Comandos:')}\nRESUMEN - Tu mes actual\nFIJOS - Gastos fijos\nANALISIS - Feedback con IA\nCATEGORIAS - Ver todas\nAYUDA - Ver este mensaje`
}

// ─── Balance & Summary ──────────────────────────────────────────

export function formatBalance(entries: BalanceEntry[]): string {
  if (entries.every(e => e.net === 0)) return `💰 ${bold('Balances del grupo')}\n\nNo hay gastos registrados todavía.`

  let msg = `💰 ${bold('Balances del grupo')}\n\n`
  for (const b of entries) {
    const firstName = b.name.split(' ')[0]
    const netAbs = Math.abs(b.net)
    if (b.net > 0) msg += `${firstName}: +${formatAmount(netAbs)} (le deben)\n`
    else if (b.net < 0) msg += `${firstName}: -${formatAmount(netAbs)} (debe)\n`
    else msg += `${firstName}: $0 (al día)\n`
  }
  msg += `\n\n${appFooter()}`
  return msg.trim()
}

export function formatExpenseList(entries: ExpenseListEntry[]): string {
  if (entries.length === 0) return `📋 ${bold('Últimos gastos')}\n\nNo hay gastos registrados todavía.`

  let msg = `📋 ${bold('Últimos gastos')}\n\n`
  entries.forEach((e, i) => {
    msg += `${i + 1}. ${formatAmount(e.amount)} ${e.description} - ${e.userName.split(' ')[0]} (${formatRelativeDate(e.timestamp)})\n`
  })
  msg += `\n\n${appFooter('Ver historial completo en')}`
  return msg.trim()
}

export function formatMonthlySummary(options: MonthlySummaryOptions): string {
  let msg = `${bold(`${options.monthName} ${options.year}`)}\n\nGastaste: ${formatAmount(options.total)}\n${options.paymentCount} pagos registrados\n${options.comparison || ''}`

  if (options.topCategories && options.topCategories.length > 0) {
    msg += `\n\n${bold('Top categorias:')}\n`
    msg += options.topCategories.map(c => `#${c.name.toLowerCase()} ${formatAmount(c.amount)}`).join('\n')
  }

  if (options.pendingRecurrents && options.pendingRecurrents > 0) {
    msg += `\n\nFijos pendientes: ${options.pendingRecurrents}`
  }

  return msg
}

export function formatRecurringSummary(options: RecurringSummaryOptions): string {
  let msg = `${bold(`Gastos fijos: ${formatAmount(options.totalMonthly)}/mes`)}\n`
  if (options.pending.length > 0) {
    msg += `\n${bold(`Pendientes (${options.pending.length}):`)}\n`
    options.pending.forEach(p => { msg += `${p.title} ${formatAmount(p.amount)}\n  ${italic(formatDueDate(p.daysUntilDue))}\n` })
  }
  if (options.paid.length > 0) {
    msg += `\n${bold(`Pagados (${options.paid.length}):`)}\n`
    options.paid.forEach(p => { msg += `${p.title} ${formatAmount(p.amount)}\n` })
  }
  return msg.trim()
}

// ─── Payment Messages ───────────────────────────────────────────

export function formatPaymentConfirmation(amount: number, otherName: string, groupName: string, direction: 'to' | 'from'): string {
  const dir = direction === 'to' ? 'Para' : 'De'
  return `✅ ${bold('Pago registrado')}\n\nMonto: ${formatAmountFull(amount)}\n${dir}: ${otherName}\nGrupo: ${groupName}\n\nTu balance con ${otherName.split(' ')[0]} se actualizó.\n\n${appFooter()}`
}

export function formatPaymentNotification(amount: number, recorderName: string, groupName: string, direction: 'paid_to_you' | 'received_from_you'): string {
  const firstName = recorderName.split(' ')[0]
  const msg = direction === 'paid_to_you'
    ? `${firstName} registró un pago de ${formatAmountFull(amount)} hacia vos.`
    : `${firstName} registró que recibió ${formatAmountFull(amount)} de vos.`
  return `💸 ${bold('Pago registrado')}\n\n${msg}\nGrupo: ${groupName}\n\n${appFooter()}`
}

export function formatTransferConfirmation(options: TransferConfirmationOptions): string {
  let msg = `✅ Transferencia registrada!\n\n${bold(options.title)}\n${formatAmountFull(options.amount)}\n#${options.categoryName.toLowerCase()}`
  if (options.recipientName) msg += `\n${italic(`Destinatario: ${options.recipientName}`)}`
  if (options.needsRevision) msg += `\n\n${italic('Revisa el titulo y categoria desde la app.')}`
  return msg
}
