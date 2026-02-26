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
  recipientName?: string
  isTransfer?: boolean
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
const GREETING_WORDS = ['hola', 'hello', 'hi', 'hey', 'buenas', 'buen dia', 'buen día', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'que tal', 'qué tal', 'ey', 'ea', 'wena']

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

export function isGreeting(text: string): boolean {
  return GREETING_WORDS.includes(text.trim().toLowerCase())
}

export function formatGreetingResponse(mode: AppMode, context?: { groupName?: string; groupCount?: number }): string {
  if (mode === 'grupos') {
    const groupLine = context?.groupName ? `\n📁 Grupo activo: ${bold(context.groupName)}` : ''
    const switchLine = (context?.groupCount ?? 0) > 1 ? `\n\nTenés ${context!.groupCount} grupos. Escribí /grupo para cambiar.` : ''
    return `👋 *¡Hola!*\n\nEstás en modo ${bold('grupos')} 👥${groupLine}\nContame qué pagaste y lo divido.${switchLine}\n\n${italic('Escribí /ayuda para ver todas las opciones.')}`
  }

  return `👋 *¡Hola!*\n\nEstás en modo ${bold('finanzas')} 📊\nContame qué pagaste o enviá un comprobante.\n\n${italic('Escribí /ayuda para ver todas las opciones.')}`
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
  const headerText = options.isTransfer ? '¿Guardar esta transferencia?' : '¿Guardar este gasto?'
  const actionText = options.isTransfer ? 'Guardar transferencia' : 'Guardar gasto'
  let msg = `🔍 ${bold(headerText)}\n\n`
  msg += `💵 ${formatAmountFull(options.amount)} ARS\n`
  msg += `📝 ${options.title}\n`
  msg += `🏷️ #${options.categoryName.toLowerCase()}\n`
  if (options.description) msg += `${italic(options.description)}\n`
  if (options.recipientName) msg += `${italic(`Destinatario: ${options.recipientName}`)}\n`
  msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n⬇️ ${bold('RESPONDÉ PARA CONFIRMAR')} ⬇️\n\n✅  ${bold('si')}  → ${actionText}\n❌  ${bold('no')}  → Cancelar`
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
  let msg = `✅ ${bold('Gasto registrado')}\n\n`
  msg += `💵 ${formatAmountFull(options.amount)} ARS\n`
  msg += `📝 ${options.title}\n`
  msg += `🏷️ #${options.categoryName.toLowerCase()}\n`
  if (options.description) msg += `${italic(options.description)}\n`
  msg += `\n${appFooter()}`
  return msg
}

export function buildConfirmationCancelled(): string {
  return `❌ Gasto cancelado.\n\nPodés intentar de nuevo o cargarlo desde ${APP_URL}`
}

// ─── Error Messages ─────────────────────────────────────────────

export function formatParseError(mode: AppMode, context?: { groupName?: string }): string {
  if (mode === 'grupos') {
    const groupLine = context?.groupName ? `📁 Grupo activo: ${bold(context.groupName)}\n` : ''
    return `⚠️ ${bold('No pude entender el mensaje')}\n\n${groupLine}Probá decirlo de otra forma, por ejemplo:\n• "Puse 50 en el almuerzo"\n• "Pagué 1500 del taxi"\n• "Gasté 20 dólares en la cena con Juan"\n\n${italic('Escribí /ayuda para más info')}\n\n${appFooter('También podés cargar gastos en')}`
  }

  // finanzas
  return `⚠️ ${bold('No pude entender el mensaje')}\n\n📊 Modo: ${bold('finanzas')}\n\nProbá decirlo de otra forma, por ejemplo:\n• "1500 café"\n• "Gasté 5 lucas en el super"\n• "50 dólares la cena"\n\n${italic('Escribí /ayuda para más info')}\n\n${appFooter('También podés cargar gastos en')}`
}

export function formatValidationError(error: string): string {
  return `⚠️ ${bold(error)}\n\nProbá de nuevo o agregá el gasto desde el dashboard:\n${APP_URL}`
}

export function formatNotLinkedError(): string {
  return `🔗 Este número no está vinculado a ninguna cuenta.\n\nPara vincular tu cuenta:\n1. Registrate en ${APP_URL}\n2. Andá a tu Perfil\n3. Tocá "Generar código" en la sección WhatsApp\n4. Enviá acá: *VINCULAR <código>*`
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
  if (action === 'descargar') return '⚠️ Error al descargar. Intentá nuevamente.'
  return '⚠️ No pude procesar. Intentá de nuevo o registrá manualmente.'
}

// ─── Help Messages ──────────────────────────────────────────────

export function formatHelpMessage(mode: AppMode, categories?: string[]): string {
  const modeSection = `\n━━━━━━━━━━━━━━━━━━━━━━\n\n🔄 ${bold(`${BRAND_NAME} tiene 2 modos:`)}\n👥 ${bold('grupos')} — Dividir gastos con amigos\n📊 ${bold('finanzas')} — Registrar gastos personales\n\nEscribí /modo para cambiar.\n\n${appFooter()}`

  if (mode === 'grupos') {
    return `📖 ${bold(`Cómo usar ${BRAND_NAME}`)}\n\n👥 Modo actual: ${bold('grupos')}\n\n💬 ${bold('Contame qué pagaste:')}\n"Puse 150 en la pizza"\n"Pagué 50 dólares la cena"\n"Gasté 5 lucas en el taxi"\n\nPor defecto se divide entre todos.\nSi mencionás personas, se divide solo entre ellas.\n\n💸 ${bold('Registrar pagos:')}\n"Le pagué 5000 a María"\n"Recibí 3000 de Juan"\n\n💱 ${bold('Monedas:')} USD, EUR, BRL → se convierten a ARS\n\n⚡ ${bold('Comandos:')}\n/balance - Ver quién debe a quién\n/lista - Ver últimos gastos\n/grupo - Cambiar de grupo${modeSection}`
  }

  // finanzas
  return `📖 ${bold(`Cómo usar ${BRAND_NAME}`)}\n\n📊 Modo actual: ${bold('finanzas')}\n\n💬 ${bold('Contame qué pagaste:')}\n"1500 café"\n"Gasté 2 lucas en uber"\n"50 dólares la cena"\n\n🏷️ ${bold('Categorías:')} se detectan automáticamente\nTambién podés agregar: "1500 café #comida"\n\n🎤 ${bold('También podés enviar:')}\n- Audio describiendo tu gasto\n- Foto de comprobante\n- PDF de comprobante\n\n⚡ ${bold('Comandos:')}\n/resumen - Resumen del mes\n/lista - Últimos gastos\n/fijos - Gastos fijos\n/categorias - Ver categorías${modeSection}`
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
  let msg = `📊 ${bold(`${options.monthName} ${options.year}`)}\n\n`
  msg += `💵 Gastaste: ${formatAmount(options.total)}\n`
  msg += `📋 ${options.paymentCount} pagos registrados\n`
  if (options.comparison) msg += `📈 ${options.comparison}\n`

  if (options.topCategories && options.topCategories.length > 0) {
    msg += `\n🏷️ ${bold('Top categorías:')}\n`
    msg += options.topCategories.map(c => `#${c.name.toLowerCase()} ${formatAmount(c.amount)}`).join('\n')
  }

  if (options.pendingRecurrents && options.pendingRecurrents > 0) {
    msg += `\n\n⏰ Fijos pendientes: ${options.pendingRecurrents}`
  }

  return msg
}

export function formatRecurringSummary(options: RecurringSummaryOptions): string {
  let msg = `📌 ${bold(`Gastos fijos: ${formatAmount(options.totalMonthly)}/mes`)}\n`
  if (options.pending.length > 0) {
    msg += `\n⏰ ${bold(`Pendientes (${options.pending.length}):`)}\n`
    options.pending.forEach(p => { msg += `${p.title} ${formatAmount(p.amount)}\n  ${italic(formatDueDate(p.daysUntilDue))}\n` })
  }
  if (options.paid.length > 0) {
    msg += `\n✅ ${bold(`Pagados (${options.paid.length}):`)}\n`
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
  let msg = `✅ ${bold('Transferencia registrada')}\n\n`
  msg += `💵 ${formatAmountFull(options.amount)} ARS\n`
  msg += `📝 ${options.title}\n`
  msg += `🏷️ #${options.categoryName.toLowerCase()}\n`
  if (options.recipientName) msg += `${italic(`Destinatario: ${options.recipientName}`)}\n`
  if (options.needsRevision) msg += `\n${italic('Revisá el título y categoría desde la app.')}\n`
  msg += `\n${appFooter()}`
  return msg
}

// ─── Welcome Messages ───────────────────────────────────────────

export function formatWelcomeMessage(mode: AppMode, context?: { userName?: string; groups?: Array<{ name: string }> }): string {
  const firstName = context?.userName?.split(' ')[0] || ''
  const greeting = firstName ? `¡Hola ${firstName}! 👋` : '¡Hola! 👋'

  if (mode === 'grupos') {
    let groupInfo = ''
    if (context?.groups?.length === 1) groupInfo = `\n📍 Estás en el grupo: ${bold(context.groups[0].name)}\n`
    else if (context?.groups && context.groups.length > 1) groupInfo = `\n📍 Estás en los grupos: ${bold(context.groups.map(g => g.name).join(', '))}\nUsá /grupo para cambiar entre ellos.\n`

    return `${greeting} Bienvenido a ${bold(BRAND_NAME)}\n\nSoy tu bot para dividir gastos entre amigos.${groupInfo}\n\n💬 ${bold('Simplemente contame qué pagaste:')}\n"Puse 5 lucas en el súper"\n"Pagué la cena, 12000"\n"Gasté 50 dólares en nafta con Juan"\n\nLa IA entiende lo que escribas y te pide confirmar antes de guardar.\n\n💸 ${bold('Para registrar pagos entre ustedes:')}\n"Le pagué 5000 a María"\n"Recibí 3000 de Juan"\n\n⚡ ${bold('Comandos:')}\n/balance → quién debe a quién\n/lista → ver últimos gastos\n/ayuda → más opciones\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Desde el dashboard podés agregar, editar y eliminar gastos:\n${APP_URL}\n\n¡Empezá a cargar gastos! 🎉`
  }

  // finanzas
  return `${greeting} Bienvenido a ${bold(BRAND_NAME)}\n\nSoy tu bot para registrar gastos personales.\n\n💬 ${bold('Simplemente contame qué pagaste:')}\n"1500 café"\n"Gasté 2 lucas en uber"\n"50 dólares la cena"\n\nLa IA entiende lo que escribas y te pide confirmar antes de guardar.\n\n🎤 ${bold('También podés enviar:')}\n- Audio describiendo tu gasto\n- Foto de comprobante\n- PDF de comprobante\n\n⚡ ${bold('Comandos:')}\n/resumen → resumen del mes\n/lista → últimos gastos\n/ayuda → más opciones\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Desde el dashboard podés ver y editar tus gastos:\n${APP_URL}\n\n¡Empezá a cargar gastos! 🎉`
}

// ─── Shared Inline Replacements ─────────────────────────────────

export function formatServiceUnavailable(): string {
  return '⚠️ Esta función no está disponible en este momento.'
}

export function formatGenericError(): string {
  return '⚠️ Ocurrió un error. Intentá de nuevo.'
}

export function formatFetchError(entity: string): string {
  return `⚠️ Error al obtener ${entity}. Intentá nuevamente.`
}

export function formatProcessingStatus(type: 'audio' | 'image' | 'pdf' | 'analisis'): string {
  const labels: Record<string, string> = {
    audio: '🎤 Procesando audio...',
    image: '📷 Procesando imagen...',
    pdf: '📄 Procesando PDF...',
    analisis: '🤖 Analizando tus finanzas...',
  }
  return labels[type]
}

export function formatAudioParseError(transcription?: string): string {
  let msg = '⚠️ No pude determinar el gasto del audio.'
  if (transcription) msg = `${italic(`"${transcription}"`)}\n\n${msg}`
  msg += '\n\nProbá escribirlo directamente.'
  return msg
}

export function formatReceiptParseError(): string {
  return '⚠️ No pude determinar el monto del comprobante.'
}

export function formatUnsupportedMessageType(): string {
  return '⚠️ Solo acepto texto, audio, fotos y PDFs.'
}

export function formatNoGroupError(): string {
  return `⚠️ No pertenecés a ningún grupo.\n\nCreá uno desde la app: ${APP_URL}`
}

export function formatUnknownCommand(command: string): string {
  return `❓ Comando no reconocido: ${command}\n\nEscribí /ayuda para ver los comandos disponibles.\n\n${appFooter('O visitá')}`
}

export function formatGroupSwitched(groupName: string): string {
  return `✅ Grupo activo cambiado a: ${bold(groupName)}\n\nTus próximos gastos se registrarán en este grupo.\n\n${appFooter()}`
}

export function formatCategoryList(categories: string[]): string {
  const formatted = categories.map(n => `#${n.toLowerCase()}`).join('\n')
  return `🏷️ ${bold('Tus categorías:')}\n\n${formatted}\n\n💡 ${bold('Tip:')} Podés escribir solo parte del nombre y se detecta automáticamente.\n\nEjemplos:\n#super → Supermercado\n#sal → Salidas\n#trans → Transporte`
}

export function formatEmptyState(entity: 'categories' | 'recurrents'): string {
  if (entity === 'categories') return `📋 No tenés categorías configuradas en tu cuenta.\n\nPodés crearlas desde la app: ${APP_URL}`
  return `📌 No tenés gastos fijos configurados.\n\nPodés agregarlos desde la app en la sección "Fijos": ${APP_URL}`
}

export function formatUnsupportedDocument(): string {
  return '⚠️ Solo se aceptan documentos PDF.'
}

export function formatExcludeAllError(): string {
  return '⚠️ No podés excluir a todo el grupo. Tiene que haber al menos una persona para dividir el gasto.'
}

export function formatInvalidNumberSelection(max: number): string {
  return `⚠️ Número inválido. Elegí un número entre 1 y ${max}.`
}

export function formatDashboardRedirect(): string {
  return `✏️ Para agregar, editar o eliminar gastos manualmente, usá el dashboard:\n\n${appFooter()}`
}

export function formatModeSwitchPendingCleared(): string {
  return '⚠️ Tenías un gasto pendiente de confirmar que fue descartado al cambiar de modo.'
}
