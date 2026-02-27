#!/usr/bin/env tsx
/**
 * Test Harmonization Script
 *
 * Verifies WhatsApp bot harmonization scenarios against the REAL
 * handler-class architecture (GruposHandler + FinanzasHandler).
 *
 *   1. BARE COMMANDS       — both handlers accept commands without slash
 *   2. /BALANCE ALIAS      — FinanzasHandler: /balance → /resumen with tip
 *   3. PENDING STATE CLEAR — clearPendingStates() on both handlers
 *   4. UNKNOWN COMMANDS    — both handlers suggest /ayuda
 *   5. EMPTY MESSAGES      — empty/whitespace handled gracefully
 *   6. UNSUPPORTED TYPE    — sticker → formatUnsupportedMessageType()
 *   7. RESPONSE CONSISTENCY — no "PayTrackr", brand = "text the check"
 *
 * Run: npm run test:harmonization
 */

// ── Env vars (before imports) ──────────────────────────────────────────
process.env.ALLOWED_PHONE_NUMBERS = '+5491234567890'
process.env.AI_ENABLED = 'false'
process.env.GEMINI_API_KEY = ''
process.env.NODE_ENV = 'test'

// ── Imports ────────────────────────────────────────────────────────────
import GruposHandler from '../handlers/GruposHandler.js'
import FinanzasHandler from '../handlers/FinanzasHandler.js'
import {
  isAffirmativeResponse, isNegativeResponse, isGreeting,
  formatHelpMessage, formatUnknownCommand, formatParseError,
  formatUnsupportedMessageType, formatNotLinkedError,
  formatModeSwitchPendingCleared,
  buildConfirmationRequest, buildConfirmationSuccess, buildConfirmationCancelled,
  formatValidationError, formatPaymentError, formatSaveError,
  formatPaymentConfirmation, formatPaymentNotification,
  formatWelcomeMessage, formatBalance, formatExpenseList,
  formatGreetingResponse, formatDashboardRedirect,
  formatNoGroupError, formatUnresolvedNamesError,
  formatExcludeAllError, formatCategoryList, formatEmptyState,
  formatMonthlySummary, formatRecurringSummary,
  formatTransferConfirmation,
} from '../helpers/responseFormatter.js'

// ── Test runner ────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function group(name: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${name}`)
  console.log('═'.repeat(60))
}

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) { passed++; console.log(`  ✅ ${label}`) }
  else { failed++; console.log(`  ❌ ${label}`); if (detail) console.log(`     → ${detail}`) }
}

function assertContains(text: string, sub: string, label: string) {
  assert(text.toLowerCase().includes(sub.toLowerCase()), label,
    `Expected "${sub}" in: "${text.slice(0, 100)}…"`)
}

function assertNotContains(text: string, sub: string, label: string) {
  assert(!text.toLowerCase().includes(sub.toLowerCase()), label,
    `Should NOT contain "${sub}" but it does`)
}

function clearCaptured() { globalThis.__testCapturedMessages = [] }
function getCaptured() { return [...globalThis.__testCapturedMessages] }
function lastCapturedText(): string {
  const msgs = getCaptured()
  return msgs.length > 0 ? msgs[msgs.length - 1].text : ''
}

// ── Mock Gemini ────────────────────────────────────────────────────────
const mockGemini = {
  isAIEnabled: () => false,
  getConfidenceThreshold: () => 0.7,
  parseExpenseNL: async () => ({ type: 'unknown' as const, confidence: 0 }),
  parsePersonalExpenseNL: async () => ({ type: 'unknown' as const, confidence: 0 }),
  transcribeAudio: async () => null,
  parseTransferImage: async () => null,
  parseTransferPDF: async () => null,
  categorizeExpense: async () => null,
  getFinancialAnalysis: async () => null,
  getWeeklyInsight: async () => null,
}

// ── Seed Firestore data ────────────────────────────────────────────────
function seedData() {
  const users = new Map<string, Record<string, any>>()
  users.set('user-1', {
    name: 'Test User', phone: '+5491234567890', email: 'test@test.com',
    aliases: ['test'], activeGroupId: 'group-1', welcomedAt: new Date(),
  })
  users.set('user-2', {
    name: 'Maria Lopez', phone: '+5499876543210', email: 'maria@test.com',
    aliases: ['maria'], activeGroupId: 'group-1', welcomedAt: new Date(),
  })
  globalThis.__testFirestoreData.set('ttc_user', users)

  const groups = new Map<string, Record<string, any>>()
  groups.set('group-1', { name: 'Test Group', members: ['user-1', 'user-2'], createdBy: 'user-1' })
  globalThis.__testFirestoreData.set('ttc_group', groups)

  globalThis.__testFirestoreData.set('ttc_expense', new Map())
  globalThis.__testFirestoreData.set('ttc_payment', new Map())
}

function seedFinanzasLinkedUser() {
  const links = new Map<string, Record<string, any>>()
  links.set('+5491234567890', {
    userId: 'firebase-uid-1', status: 'linked', finanzasWelcomedAt: new Date(),
  })
  // Also add digits-only variant
  links.set('5491234567890', {
    userId: 'firebase-uid-1', status: 'linked', finanzasWelcomedAt: new Date(),
  })
  globalThis.__testFirestoreData.set('pt_whatsapp_link', links)

  // Empty finanzas collections
  globalThis.__testFirestoreData.set('pt_payment', new Map())
  globalThis.__testFirestoreData.set('pt_expense_category', new Map())
  globalThis.__testFirestoreData.set('pt_recurrent', new Map())
}

// Collect all captured messages for final consistency check
const allCapturedMessages: string[] = []

// ═══════════════════════════════════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════════════════════════════════

async function runTests() {
  seedData()

  const mockUser = {
    id: 'user-1', name: 'Test User', phone: '+5491234567890',
    email: 'test@test.com', aliases: ['test'], activeGroupId: 'group-1',
    welcomedAt: new Date(),
  }

  const gruposHandler = new GruposHandler(mockGemini as any)
  const finanzasHandler = new FinanzasHandler(mockGemini as any)

  // ──────────────────────────────────────────────────────────────────
  // 1. BARE COMMANDS
  // ──────────────────────────────────────────────────────────────────
  group('1. BARE COMMANDS')

  // Grupos bare commands
  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'text', { text: { body: 'ayuda' } }, mockUser, 'Test')
  assertContains(lastCapturedText(), '/balance', 'Grupos "ayuda" (bare) → help mentions /balance')
  assertContains(lastCapturedText(), '/lista', 'Grupos "ayuda" (bare) → help mentions /lista')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  // Finanzas bare commands
  seedFinanzasLinkedUser()

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: 'ayuda' } }, 'Test')
  assertContains(lastCapturedText(), '/resumen', 'Finanzas "ayuda" (bare) → help mentions /resumen')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: 'resumen' } }, 'Test')
  {
    const text = lastCapturedText()
    // With no payments it should still work (monthly summary or NOT_LINKED)
    assert(text.length > 0, 'Finanzas "resumen" (bare) → produces response')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: 'categorias' } }, 'Test')
  {
    const text = lastCapturedText()
    assert(text.length > 0, 'Finanzas "categorias" (bare) → produces response')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: 'fijos' } }, 'Test')
  {
    const text = lastCapturedText()
    assert(text.length > 0, 'Finanzas "fijos" (bare) → produces response')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  // "lista de compras" should NOT match /lista (multi-word, not a bare command)
  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'text', { text: { body: 'lista de compras' } }, mockUser, 'Test')
  {
    const text = lastCapturedText()
    // Should get parse error, not expense list
    assertNotContains(text, 'Últimos gastos', '"lista de compras" does NOT trigger /lista')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. /BALANCE ALIAS
  // ──────────────────────────────────────────────────────────────────
  group('2. /BALANCE ALIAS')

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: '/balance' } }, 'Test')
  {
    const text = lastCapturedText()
    assertContains(text, 'Tip: en Finanzas, este comando se llama /resumen', '/balance → includes tip line')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: '/resumen' } }, 'Test')
  {
    const text = lastCapturedText()
    assertNotContains(text, 'Tip: en Finanzas', '/resumen → does NOT include tip')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. MODE SWITCH PENDING CLEAR
  // ──────────────────────────────────────────────────────────────────
  group('3. MODE SWITCH PENDING CLEAR')

  // No pending → returns false
  assert(gruposHandler.clearPendingStates('no-pending') === false, 'Grupos: clearPendingStates(no-pending) → false')
  assert(finanzasHandler.clearPendingStates('no-pending') === false, 'Finanzas: clearPendingStates(no-pending) → false')

  // Set pending on grupos handler (via internal map access)
  const gruposAny = gruposHandler as any
  gruposAny.pendingAIExpenses.set('user-1', {
    from: '+5491234567890', originalText: '50 pizza',
    expense: { amount: 5000, description: 'pizza', category: 'food', splitAmong: [], displayNames: [], includesSender: true },
    userId: 'user-1', userName: 'Test', groupId: 'group-1', groupName: 'Test Group', createdAt: new Date(),
  })
  assert(gruposHandler.clearPendingStates('user-1') === true, 'Grupos: clearPendingStates(with-pending) → true')
  assert(gruposHandler.clearPendingStates('user-1') === false, 'Grupos: clearPendingStates(again) → false')

  // Set pending on finanzas handler
  const finanzasAny = finanzasHandler as any
  finanzasAny.pendingAIExpenses.set('firebase-uid-1', {
    phone: '+5491234567890', userId: 'firebase-uid-1', originalText: '1500 café',
    type: 'expense', expense: { amount: 1500, title: 'café', categoryId: 'cat-1', categoryName: 'Comida', description: '', isRecurrent: false, frequency: null },
    source: 'text', createdAt: new Date(),
  })
  assert(finanzasHandler.clearPendingStates('firebase-uid-1') === true, 'Finanzas: clearPendingStates(with-pending) → true')
  assert(finanzasHandler.clearPendingStates('firebase-uid-1') === false, 'Finanzas: clearPendingStates(again) → false')

  // Verify the mode switch message formatter
  const pendingClearedMsg = formatModeSwitchPendingCleared()
  assert(pendingClearedMsg.length > 0, 'formatModeSwitchPendingCleared() returns non-empty')
  assertContains(pendingClearedMsg, 'descartado', 'Pending cleared message mentions "descartado"')

  // ──────────────────────────────────────────────────────────────────
  // 4. UNKNOWN COMMANDS
  // ──────────────────────────────────────────────────────────────────
  group('4. UNKNOWN COMMANDS')

  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'text', { text: { body: '/asdf' } }, mockUser, 'Test')
  assertContains(lastCapturedText(), 'ayuda', 'Grupos /asdf → suggests ayuda')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: '/asdf' } }, 'Test')
  assertContains(lastCapturedText(), 'ayuda', 'Finanzas /asdf → suggests ayuda')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  // Direct formatter test
  const unknownMsg = formatUnknownCommand('/xyz')
  assertContains(unknownMsg, '/xyz', 'formatUnknownCommand echoes the command')
  assertContains(unknownMsg, 'ayuda', 'formatUnknownCommand suggests /ayuda')

  // ──────────────────────────────────────────────────────────────────
  // 5. EMPTY MESSAGES
  // ──────────────────────────────────────────────────────────────────
  group('5. EMPTY MESSAGES')

  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'text', { text: { body: '' } }, mockUser, 'Test')
  {
    const text = lastCapturedText()
    assert(text.length > 0, 'Grupos empty → sends response (no crash)')
    assertContains(text, 'No pude entender', 'Grupos empty → parse error')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'text', { text: { body: '   ' } }, mockUser, 'Test')
  assert(lastCapturedText().length > 0, 'Grupos whitespace → sends response (no crash)')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: '' } }, 'Test')
  {
    const text = lastCapturedText()
    assert(text.length > 0, 'Finanzas empty → sends response (no crash)')
    assertContains(text, 'No pude entender', 'Finanzas empty → parse error')
    allCapturedMessages.push(...getCaptured().map(m => m.text))
  }

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'text', { text: { body: '   ' } }, 'Test')
  assert(lastCapturedText().length > 0, 'Finanzas whitespace → sends response (no crash)')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  // ──────────────────────────────────────────────────────────────────
  // 6. UNSUPPORTED MESSAGE TYPE
  // ──────────────────────────────────────────────────────────────────
  group('6. UNSUPPORTED MESSAGE TYPE')

  const expectedUnsupported = formatUnsupportedMessageType()
  assert(expectedUnsupported.length > 0, 'formatUnsupportedMessageType() is non-empty')

  clearCaptured()
  await gruposHandler.handleMessage('+5491234567890', 'sticker', { sticker: { mime_type: 'image/webp' } }, mockUser, 'Test')
  assert(lastCapturedText() === expectedUnsupported, 'Grupos sticker → formatUnsupportedMessageType()')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  clearCaptured()
  await finanzasHandler.handleMessage('+5491234567890', 'sticker', { sticker: { mime_type: 'image/webp' } }, 'Test')
  assert(lastCapturedText() === expectedUnsupported, 'Finanzas sticker → formatUnsupportedMessageType()')
  allCapturedMessages.push(...getCaptured().map(m => m.text))

  // ──────────────────────────────────────────────────────────────────
  // 7. RESPONSE CONSISTENCY
  // ──────────────────────────────────────────────────────────────────
  group('7. RESPONSE CONSISTENCY')

  // Collect all formatter outputs
  const allOutputs: string[] = [
    formatHelpMessage('grupos'),
    formatHelpMessage('finanzas'),
    formatUnknownCommand('/test'),
    formatParseError('grupos'),
    formatParseError('finanzas'),
    formatUnsupportedMessageType(),
    formatNotLinkedError(),
    formatModeSwitchPendingCleared(),
    formatWelcomeMessage('grupos', { userName: 'Test', groups: [{ name: 'Group1' }] }),
    formatWelcomeMessage('finanzas', { userName: 'Test' }),
    formatGreetingResponse('grupos', { groupName: 'Group1' }),
    formatGreetingResponse('finanzas'),
    buildConfirmationRequest({ mode: 'grupos', amount: 5000, description: 'pizza', category: 'food', groupName: 'Group1', displayNames: ['Test'] }),
    buildConfirmationRequest({ mode: 'finanzas', amount: 1500, title: 'café', categoryName: 'Comida' }),
    buildConfirmationSuccess({ mode: 'grupos', amount: 5000, description: 'pizza', category: 'food', displayNames: ['Test'], groupName: 'Group1' }),
    buildConfirmationSuccess({ mode: 'finanzas', title: 'café', amount: 1500, categoryName: 'Comida' }),
    buildConfirmationCancelled(),
    formatValidationError('Monto inválido'),
    formatPaymentError('no_mention'),
    formatPaymentError('invalid_mention'),
    formatPaymentError('invalid_amount'),
    formatPaymentError('self_payment'),
    formatSaveError('gasto'),
    formatSaveError('pago'),
    formatPaymentConfirmation(5000, 'Maria Lopez', 'Group1', 'to'),
    formatPaymentConfirmation(3000, 'Juan Perez', 'Group1', 'from'),
    formatPaymentNotification(5000, 'Test User', 'Group1', 'paid_to_you'),
    formatPaymentNotification(3000, 'Test User', 'Group1', 'received_from_you'),
    formatNoGroupError(),
    formatDashboardRedirect(),
    formatBalance([{ name: 'Test User', net: 5000 }, { name: 'Maria', net: -5000 }]),
    formatBalance([{ name: 'Test', net: 0 }]),
    formatExpenseList([]),
    formatUnresolvedNamesError(['Juan'], 'Group1'),
    formatExcludeAllError(),
    formatCategoryList(['Comida', 'Transporte']),
    formatEmptyState('categories'),
    formatEmptyState('recurrents'),
    formatMonthlySummary({ monthName: 'Enero', year: 2026, total: 150000, paymentCount: 12 }),
    formatRecurringSummary({ totalMonthly: 50000, pending: [{ title: 'Netflix', amount: 5000, daysUntilDue: 3 }], paid: [{ title: 'Spotify', amount: 2000 }] }),
    formatTransferConfirmation({ title: 'Alquiler', amount: 200000, categoryName: 'Vivienda', needsRevision: false }),
  ]

  // Add all captured integration messages
  allOutputs.push(...allCapturedMessages)

  // No "PayTrackr" anywhere
  let paytrackrCount = 0
  for (const output of allOutputs) {
    if (output.toLowerCase().includes('paytrackr')) {
      paytrackrCount++
      console.log(`  ❌ Found "PayTrackr" in: "${output.slice(0, 80)}…"`)
    }
  }
  assert(paytrackrCount === 0, `No "PayTrackr" found in ${allOutputs.length} outputs`)

  // Brand name should be "text the check" (lowercase) in the BRAND_NAME constant
  // (title case in WhatsApp bold headings is acceptable)
  const brandOutputs = allOutputs.filter(o => o.toLowerCase().includes('text the check'))
  assert(brandOutputs.length > 0, `Brand "text the check" found in ${brandOutputs.length} outputs`)

  // Dashboard URLs should use https
  const dashboardOutputs = allOutputs.filter(o => o.includes('textthecheck.app'))
  assert(dashboardOutputs.length > 0, `${dashboardOutputs.length} outputs reference textthecheck.app`)
  for (const output of dashboardOutputs) {
    assert(output.includes('https://textthecheck.app'), `Dashboard uses https: "${output.slice(0, 60)}…"`)
  }

  // ── Shared formatter unit tests ──────────────────────────────────
  group('BONUS: Shared Formatter Unit Tests')

  // Affirmative / negative / greeting detection
  for (const word of ['si', 'sí', 'dale', 'ok', 'va', 'bueno', 'listo', 'confirmo', '  SI  ']) {
    assert(isAffirmativeResponse(word), `"${word.trim()}" is affirmative`)
  }
  assert(!isAffirmativeResponse('no'), '"no" is NOT affirmative')
  assert(!isAffirmativeResponse('hola'), '"hola" is NOT affirmative')

  for (const word of ['no', 'n', 'cancelar', 'cancel', 'nope', 'na', 'nel', ' NO ']) {
    assert(isNegativeResponse(word), `"${word.trim()}" is negative`)
  }
  assert(!isNegativeResponse('si'), '"si" is NOT negative')

  assert(isGreeting('hola'), '"hola" is greeting')
  assert(isGreeting('buenas'), '"buenas" is greeting')
  assert(!isGreeting('pizza'), '"pizza" is NOT greeting')

  // ── Summary ──────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`)
  console.log('═'.repeat(60))

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('\n  All tests passed!\n')
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('\n  Test runner crashed:', err)
  process.exit(2)
})
