/**
 * send-weekly-summary.ts — Cron script for weekly financial digest.
 *
 * Computes per-user stats (past/next week, paid/unpaid, one-time expenses),
 * generates AI insight via Gemini, saves summary to Firestore, and sends
 * FCM push notifications.
 *
 * Usage:
 *   npx tsx scripts/send-weekly-summary.ts
 */

import 'dotenv/config'
import '../instrument.js'

import * as Sentry from '@sentry/node'
import admin from 'firebase-admin'
import { db, messaging } from '../config/firebase.js'
import GeminiHandler from '../handlers/GeminiHandler.js'

// ─── Configuration ───────────────────────────────────────────────

const TIMEZONE = 'America/Argentina/Buenos_Aires'

const geminiHandler = process.env.GEMINI_API_KEY
  ? new GeminiHandler(process.env.GEMINI_API_KEY)
  : null

if (!geminiHandler) {
  console.warn('GEMINI_API_KEY not set — AI insights will be skipped')
  Sentry.captureMessage('Weekly summary: GEMINI_API_KEY not set', { level: 'warning' })
}

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

// ─── Main ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('========================================')
  console.log('Text The Check — Weekly Summary')
  console.log('========================================')

  // Current date in Argentina timezone
  const now = new Date()
  const argentinaDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const todayDay = argentinaDate.getDate()
  const todayMonth = argentinaDate.getMonth()
  const todayYear = argentinaDate.getFullYear()

  // Week boundaries
  const sevenDaysFromNow = new Date(argentinaDate)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const sevenDaysDay = sevenDaysFromNow.getDate()
  const sevenDaysMonth = sevenDaysFromNow.getMonth()

  const sevenDaysAgo = new Date(argentinaDate)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoDay = sevenDaysAgo.getDate()
  const sevenDaysAgoMonth = sevenDaysAgo.getMonth()

  // Current month boundaries
  const monthStart = new Date(todayYear, todayMonth, 1)
  const monthEnd = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999)

  console.log(`Time (ART): ${argentinaDate.toLocaleString('es-AR')}`)
  console.log(`Today: day ${todayDay}, past week from day ${sevenDaysAgoDay}, next week through day ${sevenDaysDay}`)
  console.log(`Month range: ${monthStart.toLocaleDateString('es-AR')} - ${monthEnd.toLocaleDateString('es-AR')}`)

  // ── Step 1: Fetch ALL recurrent templates ──

  console.log('\n--- Fetching recurrent templates ---')
  const recurrentsSnapshot = await db.collection('pt_recurrent').get()

  if (recurrentsSnapshot.empty) {
    console.log('No recurrent templates found')
    process.exit(0)
  }

  console.log(`Found ${recurrentsSnapshot.size} recurrent templates`)

  // Group by userId, filter expired
  const recurrentsByUser: Record<string, any[]> = {}
  for (const doc of recurrentsSnapshot.docs) {
    const recurrent: any = { id: doc.id, ...doc.data() }

    if (recurrent.endDate) {
      const endDate = new Date(recurrent.endDate)
      if (endDate < argentinaDate) continue
    }

    const userId = recurrent.userId
    if (!recurrentsByUser[userId]) recurrentsByUser[userId] = []
    recurrentsByUser[userId].push(recurrent)
  }

  const userIds = Object.keys(recurrentsByUser)
  console.log(`Active users with recurrents: ${userIds.length}`)

  if (userIds.length === 0) {
    console.log('No active users to notify')
    process.exit(0)
  }

  // ── Step 2: Per-user stats computation ──

  console.log('\n--- Computing per-user stats ---')

  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    const userRecurrents = recurrentsByUser[userId]

    // Past week recurrents (dueDateDay in [today-7..yesterday])
    const pastWeekRecurrents = userRecurrents.filter((r: any) => {
      const dueDay = parseInt(r.dueDateDay)
      if (sevenDaysAgoMonth === todayMonth) {
        return dueDay >= sevenDaysAgoDay && dueDay < todayDay
      } else {
        const daysInPrevMonth = new Date(todayYear, todayMonth, 0).getDate()
        return (dueDay >= sevenDaysAgoDay && dueDay <= daysInPrevMonth) || (dueDay >= 1 && dueDay < todayDay)
      }
    })

    // Next week recurrents (dueDateDay in [today..today+7])
    const nextWeekRecurrents = userRecurrents.filter((r: any) => {
      const dueDay = parseInt(r.dueDateDay)
      if (todayMonth === sevenDaysMonth) {
        return dueDay >= todayDay && dueDay <= sevenDaysDay
      } else {
        const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate()
        return (dueDay >= todayDay && dueDay <= daysInMonth) || (dueDay >= 1 && dueDay <= sevenDaysDay)
      }
    })

    // Current month payments
    const paymentsSnapshot = await db.collection('pt_payment')
      .where('userId', '==', userId)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(monthStart))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(monthEnd))
      .get()

    const monthPayments = paymentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }))
    const recurrentInstances = monthPayments.filter((p: any) => p.paymentType === 'recurrent')
    const oneTimePayments = monthPayments.filter((p: any) => p.paymentType === 'one-time')

    const paidRecurrents = recurrentInstances.filter((p: any) => p.isPaid)
    const unpaidRecurrents = recurrentInstances.filter((p: any) => !p.isPaid)

    // Recurrents with no instance this month count as unpaid
    const instanceRecurrentIds = new Set(recurrentInstances.map((p: any) => p.recurrentId))
    const noInstanceCount = userRecurrents.filter((r: any) => !instanceRecurrentIds.has(r.id)).length

    const totalPaidAmount = paidRecurrents.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const oneTimeAmount = oneTimePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const paidRecurrentIds = new Set(paidRecurrents.map((p: any) => p.recurrentId))

    const buildWeekStats = (weekRecurrents: any[]) => {
      const paid = weekRecurrents.filter((r: any) => paidRecurrentIds.has(r.id))
      const unpaid = weekRecurrents.filter((r: any) => !paidRecurrentIds.has(r.id))
      return {
        count: weekRecurrents.length,
        amount: weekRecurrents.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
        paidCount: paid.length,
        unpaidCount: unpaid.length,
        unpaidAmount: unpaid.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
      }
    }

    const pastWeek = buildWeekStats(pastWeekRecurrents)
    const nextWeek = buildWeekStats(nextWeekRecurrents)
    const totalUnpaidAmount = pastWeek.unpaidAmount + nextWeek.unpaidAmount

    const stats = {
      pastWeek,
      nextWeek,
      totalUnpaidAmount,
      paidThisMonth: paidRecurrents.length,
      unpaidThisMonth: unpaidRecurrents.length + noInstanceCount,
      totalPaidAmount,
      oneTimeCount: oneTimePayments.length,
      oneTimeAmount,
    }

    console.log(`\n   User ${userId.substring(0, 8)}...`)
    console.log(`   Past week: ${pastWeek.count} (${pastWeek.paidCount} paid, ${pastWeek.unpaidCount} unpaid)`)
    console.log(`   Next week: ${nextWeek.count} (${nextWeek.paidCount} paid, ${nextWeek.unpaidCount} unpaid)`)
    console.log(`   Total unpaid: $${totalUnpaidAmount.toLocaleString('es-AR')}`)
    console.log(`   Month: ${stats.paidThisMonth} paid, ${stats.unpaidThisMonth} unpaid`)
    console.log(`   One-time: ${stats.oneTimeCount} ($${stats.oneTimeAmount.toLocaleString('es-AR')})`)

    // ── Step 3: AI insight ──

    let aiInsight: string | null = null
    if (geminiHandler) {
      aiInsight = await geminiHandler.getWeeklyInsight(stats)
      if (aiInsight) {
        console.log(`   AI insight: ${aiInsight}`)
      } else {
        console.log('   AI insight: unavailable')
        Sentry.captureMessage('Weekly summary: AI insight returned null', {
          level: 'error',
          extra: { userId: userId.substring(0, 8), stats },
        })
      }
    }

    // ── Step 3.5: Persist weekly summary ──

    try {
      await db.collection('pt_weekly_summary').doc(userId).set({
        userId,
        stats,
        aiInsight,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      console.log(`   Saved weekly summary to Firestore`)
    } catch (err: any) {
      console.error(`   Failed to save weekly summary: ${err.message}`)
      Sentry.captureException(err, { extra: { userId: userId.substring(0, 8), context: 'saveWeeklySummary' } })
    }

    // ── Step 4: Build notification body ──

    let body = `Entrante: ${nextWeek.count} pago(s) por ${formatAmount(nextWeek.amount)}. Pendiente total: ${formatAmount(totalUnpaidAmount)}.`

    if (stats.oneTimeCount > 0) {
      body += ` Gastos únicos: ${stats.oneTimeCount} (${formatAmount(stats.oneTimeAmount)}).`
    }

    body += '\nVer resumen'

    // ── Step 5: Send FCM notifications ──

    const tokensSnapshot = await db.collection('pt_fcm_token')
      .where('userId', '==', userId)
      .where('notificationsEnabled', '==', true)
      .get()

    if (tokensSnapshot.empty) {
      console.log(`   No active tokens, skipping`)
      continue
    }

    const tokens = tokensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
    console.log(`   Sending to ${tokens.length} token(s)`)

    for (const tokenDoc of tokens) {
      try {
        await messaging.send({
          token: tokenDoc.token,
          notification: {
            title: 'Text The Check — Resumen Semanal',
            body,
          },
          data: {
            url: '/weekly-summary',
            type: 'weekly-summary',
          },
          webpush: {
            fcmOptions: { link: '/weekly-summary' },
            notification: {
              icon: '/img/new-logo.png',
              badge: '/img/new-logo.png',
            },
          },
        })
        console.log(`      Sent to token ${tokenDoc.id.substring(0, 8)}...`)
        totalSent++
      } catch (error: any) {
        console.error(`      Failed: ${error.message}`)
        totalFailed++
        Sentry.captureException(error, {
          extra: { userId: userId.substring(0, 8), tokenId: tokenDoc.id.substring(0, 8), context: 'fcmSendWeeklySummary' },
        })

        // Remove invalid tokens
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          await db.collection('pt_fcm_token').doc(tokenDoc.id).delete()
          console.log(`      Removed invalid token`)
        }
      }
    }
  }

  // ── Done ──

  console.log(`\n========================================`)
  console.log(`Summary: ${totalSent} sent, ${totalFailed} failed`)
  console.log('Done')
  await Sentry.flush(5000)
  process.exit(0)
}

main().catch(async (error) => {
  console.error('Fatal error:', error)
  Sentry.captureException(error)
  await Sentry.flush(5000)
  process.exit(1)
})
