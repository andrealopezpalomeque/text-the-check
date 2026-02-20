/**
 * FinanzasHandler — all finanzas (personal finance) domain logic.
 *
 * Commands, expense parsing, account linking, audio/image/PDF processing,
 * category matching, monthly summary, recurring payments, AI analysis.
 *
 * Firestore collections: p_t_whatsapp_link, p_t_payment, p_t_expense_category, p_t_recurrent
 */

import admin from 'firebase-admin'
import * as Sentry from '@sentry/node'
import { db } from '../config/firebase.js'
import { sendMessage, downloadMedia } from '../helpers/whatsapp.js'
import type GeminiHandler from './GeminiHandler.js'

// ─── Constants ─────────────────────────────────────────────────────

const COLLECTIONS = {
  WHATSAPP_LINKS: 'p_t_whatsapp_link',
  PAYMENTS: 'p_t_payment',
  CATEGORIES: 'p_t_expense_category',
  RECURRENTS: 'p_t_recurrent',
}

const FALLBACK_CATEGORIES = ['supermercado', 'salidas', 'transporte', 'servicios', 'suscripciones']

const NOT_LINKED_MSG = 'Este número no está vinculado a ninguna cuenta.\n\nPara vincular tu cuenta:\n1. Registrate en https://textthecheck.app\n2. Andá a tu Perfil\n3. Tocá "Generar código" en la sección WhatsApp\n4. Enviá acá: VINCULAR <código>'

// ─── Helpers ───────────────────────────────────────────────────────

function logError(message: string, error: unknown): void {
  const detail = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null
      ? JSON.stringify(error).slice(0, 200)
      : String(error ?? '')
  console.error(`[ERROR] ${message} ${detail}`)
  if (error instanceof Error) Sentry.captureException(error)
  else Sentry.captureMessage(message, { level: 'error', extra: { detail: error } })
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

function formatAmountFull(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function parseDateOrNow(dateStr: string | null | undefined): admin.firestore.FieldValue | admin.firestore.Timestamp {
  if (!dateStr) return admin.firestore.FieldValue.serverTimestamp()
  const parsed = new Date(dateStr + 'T12:00:00')
  if (isNaN(parsed.getTime())) return admin.firestore.FieldValue.serverTimestamp()
  return admin.firestore.Timestamp.fromDate(parsed)
}

// ─── Handler class ─────────────────────────────────────────────────

export default class FinanzasHandler {
  private gemini: GeminiHandler

  constructor(gemini: GeminiHandler) {
    this.gemini = gemini
  }

  // ─── Main entry point ──────────────────────────────────────────

  async handleMessage(from: string, messageType: string, messageData: any, contactName: string): Promise<void> {
    try {
      if (messageType === 'text') {
        const text = messageData.text?.body || messageData
        await this.processTextMessage(from, typeof text === 'string' ? text : String(text), contactName)
      } else if (messageType === 'audio') {
        await this.processAudioMessage(from, messageData.audio.id, contactName)
      } else if (messageType === 'image') {
        await this.processImageMessage(from, messageData.image.id, messageData.image?.caption, contactName)
      } else if (messageType === 'document') {
        const mimeType = messageData.document?.mime_type || ''
        if (mimeType === 'application/pdf') {
          await this.processPDFMessage(from, messageData.document.id, messageData.document?.caption, contactName)
        } else {
          await sendMessage(from, 'Solo se aceptan documentos PDF.')
        }
      }
    } catch (error) {
      logError('Error in FinanzasHandler:', error)
    }
  }

  // ─── Text message routing ──────────────────────────────────────

  private async processTextMessage(from: string, text: string, contactName: string): Promise<void> {
    const normalized = text.trim().toLowerCase()

    if (normalized === 'ayuda' || normalized === 'help') { await this.sendHelpMessage(from); return }
    if (normalized === 'categorias') { await this.handleCategoriesCommand(from); return }
    if (normalized === 'resumen') { await this.handleResumenCommand(from); return }
    if (normalized === 'fijos') { await this.handleFijosCommand(from); return }
    if (normalized === 'analisis') { await this.handleAnalisisCommand(from); return }

    await this.handleExpenseMessage(from, text)
  }

  /** Check if phone is linked. Returns userId (Firebase Auth UID) or null. */
  async checkLinked(phone: string): Promise<string | null> {
    const linkDoc = await db.collection(COLLECTIONS.WHATSAPP_LINKS).doc(phone).get()
    if (linkDoc.exists && linkDoc.data()?.status === 'linked') {
      return linkDoc.data()!.userId
    }
    return null
  }

  // ─── Commands ──────────────────────────────────────────────────

  private async sendHelpMessage(phone: string): Promise<void> {
    let commonCats = FALLBACK_CATEGORIES
    const userId = await this.checkLinked(phone)
    if (userId) commonCats = await this.getUserCommonCategories(userId)

    const catsFormatted = commonCats.map(c => `#${c}`).join('\n')

    await sendMessage(phone, `*PayTrackr - Ayuda*\n\n*Formato:*\n\`\`\`\n$<monto> <titulo> #<cat>\n\`\`\`\n\n*Ejemplos:*\n\`$500 Super #supermercado\`\n\`$1500 Cena #salidas d:Cumple\`\n\`$2000 Uber\` (sin cat = Otros)\n\n*Tus categorias frecuentes:*\n${catsFormatted}\n\nPodes escribir parte del nombre:\n#super -> Supermercado\n#sal -> Salidas\n\n*Tambien podes enviar:*\n- Audio describiendo un gasto\n- Foto de comprobante de transferencia\n- PDF de comprobante de transferencia\n\n*Comandos:*\nRESUMEN - Tu mes actual\nFIJOS - Gastos fijos\nANALISIS - Feedback con IA\nCATEGORIAS - Ver todas\nAYUDA - Ver este mensaje`)
  }

  private async handleCategoriesCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const snapshot = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
      if (snapshot.empty) {
        await sendMessage(phone, 'No tenes categorias configuradas en tu cuenta.')
        return
      }

      const names = snapshot.docs.map(d => d.data().name).filter(Boolean).sort()
      const formatted = names.map(n => `#${n.toLowerCase()}`).join('\n')

      await sendMessage(phone, `*Tus categorias:*\n\n${formatted}\n\n*Tip:* Podes escribir solo parte del nombre y se detecta automaticamente.\n\nEjemplos:\n#super -> Supermercado\n#sal -> Salidas\n#trans -> Transporte`)
    } catch (error) {
      logError('Error fetching categories:', error)
      await sendMessage(phone, 'Error al obtener las categorias.')
    }
  }

  private async handleResumenCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      const [currentSnap, prevSnap, catsSnap, pendingSnap] = await Promise.all([
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', currentMonthStart).where('createdAt', '<=', currentMonthEnd).get(),
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', prevMonthStart).where('createdAt', '<=', prevMonthEnd).get(),
        db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get(),
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('paymentType', '==', 'recurrent').where('isPaid', '==', false).get(),
      ])

      const currentPayments = currentSnap.docs.map(d => d.data())
      const currentTotal = currentPayments.reduce((s, p) => s + (p.amount || 0), 0)
      const prevTotal = prevSnap.docs.map(d => d.data()).reduce((s, p) => s + (p.amount || 0), 0)

      const categoryMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { categoryMap[d.id] = d.data().name })

      const byCategory: Record<string, number> = {}
      currentPayments.forEach(p => {
        const name = categoryMap[p.categoryId] || 'Otros'
        byCategory[name] = (byCategory[name] || 0) + (p.amount || 0)
      })

      const topCats = Object.entries(byCategory).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3)
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

      let comparison = ''
      if (prevTotal > 0) {
        const diff = currentTotal - prevTotal
        const pct = Math.round((diff / prevTotal) * 100)
        comparison = `vs mes anterior: ${diff >= 0 ? '+' : ''}${pct}% (${diff >= 0 ? '+' : ''}${formatAmount(diff)})`
      }

      let topCatsText = ''
      if (topCats.length > 0) {
        topCatsText = '\n\n*Top categorias:*\n' + topCats.map(([name, amt]) => `#${name.toLowerCase()} ${formatAmount(amt as number)}`).join('\n')
      }

      const pendingText = pendingSnap.size > 0 ? `\n\nFijos pendientes: ${pendingSnap.size}` : ''

      await sendMessage(phone, `*${monthNames[now.getMonth()]} ${now.getFullYear()}*\n\nGastaste: ${formatAmount(currentTotal)}\n${currentPayments.length} pagos registrados\n${comparison}${topCatsText}${pendingText}`)
    } catch (error) {
      logError('Error in RESUMEN command:', error)
      await sendMessage(phone, 'Error al obtener el resumen. Intenta nuevamente.')
    }
  }

  private async handleFijosCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    try {
      const recurrentSnap = await db.collection(COLLECTIONS.RECURRENTS).where('userId', '==', userId).get()
      if (recurrentSnap.empty) {
        await sendMessage(phone, 'No tenes gastos fijos configurados.\n\nPodes agregarlos desde la app en la seccion "Fijos".')
        return
      }

      const recurrents = recurrentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const instancesSnap = await db.collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId).where('paymentType', '==', 'recurrent')
        .where('createdAt', '>=', monthStart).where('createdAt', '<=', monthEnd).get()

      const instanceMap: Record<string, any> = {}
      instancesSnap.docs.forEach(d => { const data = d.data(); if (data.recurrentId) instanceMap[data.recurrentId] = data })

      const pending: any[] = []
      const paid: any[] = []

      recurrents.forEach(r => {
        const isPaid = instanceMap[r.id]?.isPaid ?? false
        const dueDateDay = parseInt(r.dueDateDay) || 1
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDateDay)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        const item = { title: r.title, amount: r.amount, daysUntilDue }
        if (isPaid) paid.push(item); else pending.push(item)
      })

      pending.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      const total = recurrents.reduce((s, r) => s + (r.amount || 0), 0)

      const formatDue = (d: number) => {
        if (d < 0) return `vencido hace ${Math.abs(d)} dias`
        if (d === 0) return 'vence hoy'
        if (d === 1) return 'vence manana'
        return `vence en ${d} dias`
      }

      let msg = `*Gastos fijos: ${formatAmount(total)}/mes*\n`
      if (pending.length > 0) {
        msg += `\n*Pendientes (${pending.length}):*\n`
        pending.forEach(p => { msg += `${p.title} ${formatAmount(p.amount)}\n  _${formatDue(p.daysUntilDue)}_\n` })
      }
      if (paid.length > 0) {
        msg += `\n*Pagados (${paid.length}):*\n`
        paid.forEach(p => { msg += `${p.title} ${formatAmount(p.amount)}\n` })
      }

      await sendMessage(phone, msg.trim())
    } catch (error) {
      logError('Error in FIJOS command:', error)
      await sendMessage(phone, 'Error al obtener los gastos fijos. Intenta nuevamente.')
    }
  }

  private async handleAnalisisCommand(phone: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(phone, 'El analisis con IA no esta disponible en este momento.')
      return
    }

    try {
      await sendMessage(phone, 'Analizando tus finanzas... esto puede tomar unos segundos.')

      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

      const [paymentsSnap, recurrentSnap, catsSnap] = await Promise.all([
        db.collection(COLLECTIONS.PAYMENTS).where('userId', '==', userId).where('createdAt', '>=', threeMonthsAgo).orderBy('createdAt', 'desc').get(),
        db.collection(COLLECTIONS.RECURRENTS).where('userId', '==', userId).get(),
        db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get(),
      ])

      const categoryMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { categoryMap[d.id] = d.data().name })

      const payments = paymentsSnap.docs.map(d => {
        const data = d.data()
        return { amount: data.amount, category: categoryMap[data.categoryId] || 'Otros', month: data.createdAt?.toDate()?.toISOString().slice(0, 7) || 'unknown' }
      })

      const monthlyData: Record<string, { total: number; byCategory: Record<string, number>; count: number }> = {}
      payments.forEach(p => {
        if (!monthlyData[p.month]) monthlyData[p.month] = { total: 0, byCategory: {}, count: 0 }
        monthlyData[p.month].total += p.amount
        monthlyData[p.month].count++
        monthlyData[p.month].byCategory[p.category] = (monthlyData[p.month].byCategory[p.category] || 0) + p.amount
      })

      const recurrents = recurrentSnap.docs.map(d => ({
        title: d.data().title, amount: d.data().amount,
        category: categoryMap[d.data().categoryId] || 'Otros',
      }))

      const analysis = await this.gemini.getFinancialAnalysis({
        monthlyData,
        totalRecurrent: recurrents.reduce((s, r) => s + (r.amount || 0), 0),
        recurrentCount: recurrents.length,
        recurrents: recurrents.slice(0, 10),
        totalPayments: payments.length,
        months: Object.keys(monthlyData).sort(),
      })

      await sendMessage(phone, analysis)
    } catch (error) {
      logError('Error in ANALISIS command:', error)
      await sendMessage(phone, 'Error al analizar tus finanzas. Intenta nuevamente.')
    }
  }

  // ─── Expense message parsing ───────────────────────────────────

  private async handleExpenseMessage(phone: string, text: string): Promise<void> {
    const userId = await this.checkLinked(phone)
    if (!userId) { await sendMessage(phone, NOT_LINKED_MSG); return }

    const parsed = this.parseExpenseMessage(text)
    if (!parsed) {
      const commonCats = await this.getUserCommonCategories(userId)
      const catsFormatted = commonCats.slice(0, 3).map(c => `#${c}`).join(' ')
      await sendMessage(phone, `No pude entender el mensaje.\n\n*Formato:*\n\`$<monto> <titulo> #<cat>\`\n\n*Ejemplos:*\n\`$500 Super #supermercado\`\n\`$1500 Cena #salidas\`\n\n*Categorias sugeridas:*\n${catsFormatted}\n\nEscribi AYUDA para mas info.`)
      return
    }

    try {
      const categoryResult = await this.findCategoryId(userId, parsed.category)
      await db.collection(COLLECTIONS.PAYMENTS).add({
        title: parsed.title,
        description: parsed.description,
        amount: parsed.amount,
        categoryId: categoryResult.id,
        isPaid: true,
        paidDate: admin.firestore.FieldValue.serverTimestamp(),
        paymentType: 'one-time',
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: admin.firestore.FieldValue.serverTimestamp(),
        recurrentId: null,
        isWhatsapp: true,
        status: 'pending',
        source: 'whatsapp-text',
        needsRevision: false,
        recipient: null,
        audioTranscription: null,
      })

      let msg = `Gasto registrado!\n\n*${parsed.title}*\n${formatAmountFull(parsed.amount)}\n#${categoryResult.name.toLowerCase()}`
      if (parsed.description) msg += `\n_${parsed.description}_`
      await sendMessage(phone, msg)
    } catch (error) {
      logError('Error creating payment:', error)
      await sendMessage(phone, 'Error al registrar el gasto. Intenta nuevamente.')
    }
  }

  // ─── Audio processing ──────────────────────────────────────────

  private async processAudioMessage(from: string, audioId: string, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, 'Esta funcion no esta disponible en este momento.')
      return
    }

    const media = await downloadMedia(audioId)
    if (!media) { await sendMessage(from, 'Error al descargar. Intenta nuevamente.'); return }

    const catsSnap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
    const categoryNames = catsSnap.docs.map(d => d.data().name).filter(Boolean)

    await sendMessage(from, 'Procesando audio...')
    const transcription = await this.gemini.transcribeAudio(media.base64, media.mimeType, categoryNames)
    if (!transcription) { await sendMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.'); return }

    const amount = parseFloat(String(transcription.totalAmount)) || 0
    if (amount <= 0) {
      let msg = 'No pude determinar el gasto.'
      if (transcription.transcription) msg = `_"${transcription.transcription}"_\n\n${msg}`
      await sendMessage(from, msg)
      return
    }

    const categoryResult = await this.findCategoryId(userId, transcription.category)
    const paymentDate = parseDateOrNow(transcription.date)

    await db.collection(COLLECTIONS.PAYMENTS).add({
      title: transcription.title || 'Gasto por audio',
      description: transcription.description || '',
      amount,
      categoryId: categoryResult.id,
      isPaid: true,
      paidDate: paymentDate,
      paymentType: 'one-time',
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      dueDate: paymentDate,
      recurrentId: null,
      isWhatsapp: true,
      status: 'pending',
      source: 'whatsapp-audio',
      needsRevision: false,
      recipient: null,
      audioTranscription: transcription.transcription || null,
    })

    let msg = `Gasto registrado por audio!\n\n*${transcription.title || 'Gasto por audio'}*\n${formatAmountFull(amount)}\n#${categoryResult.name.toLowerCase()}`
    if (transcription.transcription) msg += `\n_"${transcription.transcription}"_`
    await sendMessage(from, msg)
  }

  // ─── Image processing ──────────────────────────────────────────

  private async processImageMessage(from: string, imageId: string, caption: string | undefined, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, 'Esta funcion no esta disponible en este momento.')
      return
    }

    const media = await downloadMedia(imageId)
    if (!media) { await sendMessage(from, 'Error al descargar. Intenta nuevamente.'); return }

    await sendMessage(from, 'Procesando imagen...')
    const transferData = await this.gemini.parseTransferImage(media.base64, media.mimeType)
    if (!transferData) { await sendMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.'); return }

    await this.processTransferData(from, userId, transferData, caption, 'whatsapp-image')
  }

  // ─── PDF processing ────────────────────────────────────────────

  private async processPDFMessage(from: string, docId: string, caption: string | undefined, _contactName: string): Promise<void> {
    const userId = await this.checkLinked(from)
    if (!userId) { await sendMessage(from, NOT_LINKED_MSG); return }

    if (!this.gemini.isAIEnabled()) {
      await sendMessage(from, 'Esta funcion no esta disponible en este momento.')
      return
    }

    const media = await downloadMedia(docId)
    if (!media) { await sendMessage(from, 'Error al descargar. Intenta nuevamente.'); return }

    await sendMessage(from, 'Procesando PDF...')
    const transferData = await this.gemini.parseTransferPDF(media.base64, media.mimeType)
    if (!transferData) { await sendMessage(from, 'No pude procesar. Intenta de nuevo o registra manualmente.'); return }

    await this.processTransferData(from, userId, transferData, caption, 'whatsapp-pdf')
  }

  // ─── Transfer data processing ──────────────────────────────────

  private async processTransferData(phone: string, userId: string, transferData: any, caption: string | undefined, source: string): Promise<void> {
    const amount = parseFloat(transferData.amount) || 0
    if (amount <= 0) {
      await sendMessage(phone, 'No pude determinar el monto del comprobante.')
      return
    }

    const recipient = {
      name: transferData.recipientName || null,
      cbu: transferData.recipientCBU || null,
      alias: transferData.recipientAlias || null,
      bank: transferData.recipientBank || null,
    }

    const history = await this.findRecipientHistory(userId, transferData)

    let title: string
    let categoryId: string
    let needsRevision: boolean

    if (history?.suggestedTitle) {
      title = history.suggestedTitle
      categoryId = history.suggestedCategoryId
      needsRevision = false
    } else {
      const label = transferData.recipientName || transferData.recipientAlias || 'desconocido'
      title = `Transferencia a ${label}`
      const otros = await this.findOtrosCategory(userId)
      categoryId = otros.id
      needsRevision = true
    }

    // Caption override
    if (caption) {
      const parsed = this.parseExpenseMessage(`$${amount} ${caption}`)
      if (parsed) {
        title = parsed.title || title
        if (parsed.category) {
          const catResult = await this.findCategoryId(userId, parsed.category)
          categoryId = catResult.id
          needsRevision = false
        }
      }
    }

    const paymentDate = parseDateOrNow(transferData.date)

    await db.collection(COLLECTIONS.PAYMENTS).add({
      title, description: transferData.concept || '', amount,
      categoryId: categoryId || '', isPaid: true, paidDate: paymentDate,
      paymentType: 'one-time', userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      dueDate: paymentDate, recurrentId: null,
      isWhatsapp: true, status: 'pending', source,
      needsRevision, recipient, audioTranscription: null,
    })

    // Get category name for display
    let categoryName = 'Otros'
    if (categoryId) {
      const catDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get()
      if (catDoc.exists) categoryName = catDoc.data()!.name
    }

    let msg = `Transferencia registrada!\n\n*${title}*\n${formatAmountFull(amount)}\n#${categoryName.toLowerCase()}`
    if (transferData.recipientName) msg += `\n_Destinatario: ${transferData.recipientName}_`
    if (needsRevision) msg += '\n\n_Revisa el titulo y categoria desde la app._'
    await sendMessage(phone, msg)
  }

  // ─── Category matching ─────────────────────────────────────────

  private async findCategoryId(userId: string, categoryInput: string | null): Promise<{ id: string; name: string }> {
    if (!categoryInput) return this.findOtrosCategory(userId)

    const normalized = categoryInput.toLowerCase()
    const snap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()
    if (snap.empty) return { id: '', name: 'Otros' }

    const categories = snap.docs.map(d => ({ id: d.id, name: d.data().name || '' }))

    // 4-level fallback: exact → startsWith → contains → Otros
    const exact = categories.find(c => c.name.toLowerCase() === normalized)
    if (exact) return exact
    const starts = categories.find(c => c.name.toLowerCase().startsWith(normalized))
    if (starts) return starts
    const contains = categories.find(c => c.name.toLowerCase().includes(normalized))
    if (contains) return contains

    return this.findOtrosCategory(userId)
  }

  private async findOtrosCategory(userId: string): Promise<{ id: string; name: string }> {
    const snap = await db.collection(COLLECTIONS.CATEGORIES)
      .where('userId', '==', userId).where('name', '==', 'Otros').limit(1).get()
    if (!snap.empty) return { id: snap.docs[0].id, name: 'Otros' }
    return { id: '', name: 'Otros' }
  }

  // ─── Expense message parsing ───────────────────────────────────

  private parseExpenseMessage(text: string): { amount: number; title: string; category: string | null; description: string } | null {
    const clean = text.trim()
    const match = clean.match(/^\$?\s*([\d.,]+)\s+(.+)$/i)
    if (!match) return null

    // Argentine format: remove thousand separators (.), convert decimal comma to dot
    let amountStr = match[1].replace(/\./g, '').replace(',', '.')
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return null

    let rest = match[2].trim()

    // Extract category (#hashtag)
    let category: string | null = null
    const catMatch = rest.match(/#(\S+)/)
    if (catMatch) { category = catMatch[1].toLowerCase(); rest = rest.replace(/#\S+/, '').trim() }

    // Extract description (d:)
    let description = ''
    const descMatch = rest.match(/d:(.+?)(?=#|$)/i)
    if (descMatch) { description = descMatch[1].trim(); rest = rest.replace(/d:.+?(?=#|$)/i, '').trim() }

    const title = capitalizeFirst(rest.trim())
    if (!title) return null

    return { amount, title, category, description }
  }

  // ─── Recipient history ─────────────────────────────────────────

  private async findRecipientHistory(userId: string, recipientData: any): Promise<{ suggestedTitle: string; suggestedCategoryId: string } | null> {
    try {
      let query: FirebaseFirestore.Query | null = null

      if (recipientData.recipientName) {
        query = db.collection(COLLECTIONS.PAYMENTS)
          .where('userId', '==', userId).where('recipient.name', '==', recipientData.recipientName)
          .orderBy('createdAt', 'desc').limit(5)
      } else if (recipientData.recipientCBU) {
        query = db.collection(COLLECTIONS.PAYMENTS)
          .where('userId', '==', userId).where('recipient.cbu', '==', recipientData.recipientCBU)
          .orderBy('createdAt', 'desc').limit(5)
      }

      if (!query) return null
      const snap = await query.get()
      if (snap.empty) return null

      const pastPayments = snap.docs.map(d => d.data())
      const titleCounts: Record<string, number> = {}
      const catCounts: Record<string, number> = {}

      pastPayments.forEach(p => {
        if (p.title) titleCounts[p.title] = (titleCounts[p.title] || 0) + 1
        if (p.categoryId) catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1
      })

      const suggestedTitle = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const suggestedCategoryId = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

      if (!suggestedTitle) return null
      return { suggestedTitle, suggestedCategoryId: suggestedCategoryId || '' }
    } catch (error) {
      logError('Error finding recipient history:', error)
      return null
    }
  }

  // ─── User common categories ────────────────────────────────────

  private async getUserCommonCategories(userId: string): Promise<string[]> {
    try {
      const paymentsSnap = await db.collection(COLLECTIONS.PAYMENTS)
        .where('userId', '==', userId).orderBy('createdAt', 'desc').limit(10).get()

      if (paymentsSnap.empty) return FALLBACK_CATEGORIES

      const categoryIds = paymentsSnap.docs.map(d => d.data().categoryId).filter(Boolean)
      if (categoryIds.length === 0) return FALLBACK_CATEGORIES

      const uniqueIds = [...new Set(categoryIds)]
      const catsSnap = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', userId).get()

      const catMap: Record<string, string> = {}
      catsSnap.docs.forEach(d => { catMap[d.id] = d.data().name })

      const names = uniqueIds.map(id => catMap[id]).filter(n => n && n.toLowerCase() !== 'otros').slice(0, 5).map(n => n.toLowerCase())
      return names.length > 0 ? names : FALLBACK_CATEGORIES
    } catch (error) {
      logError('Error getting common categories:', error)
      return FALLBACK_CATEGORIES
    }
  }
}
