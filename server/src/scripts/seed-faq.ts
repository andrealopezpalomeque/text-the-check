/**
 * seed-faq.ts — Populate the ttc_faq Firestore collection with FAQ entries.
 *
 * Usage: npx tsx src/scripts/seed-faq.ts
 *
 * Idempotent: deletes all existing FAQ docs and re-creates them.
 */

import 'dotenv/config'
import { db } from '../config/firebase.js'

const COLLECTION = 'ttc_faq'

interface FaqEntry {
  topic: string
  order: number
  question: string
  answer: string
}

const FAQ_ENTRIES: FaqEntry[] = [
  // ─── Gastos (Grupos) ────────────────────────────────────────
  {
    topic: 'Registrar gastos',
    order: 1,
    question: '¿Cómo agrego un gasto en modo Grupos?',
    answer: 'Mandá un mensaje por WhatsApp describiendo qué pagaste. Ejemplos: "Puse 150 en la pizza", "Gasté 5 lucas en el taxi", "50 dólares la cena". La IA lo entiende y te pide confirmar antes de guardarlo. Por defecto se divide entre todo el grupo.',
  },
  {
    topic: 'Registrar gastos',
    order: 2,
    question: '¿Cómo divido un gasto entre personas específicas?',
    answer: 'Podés mencionar a las personas en el mensaje. Con "con" se incluye al que envía: "150 pizza con Juan". Con @ no se incluye: "150 pizza @Juan". También podés usar "todos menos X" para excluir a alguien: "200 cena todos menos Pedro".',
  },
  {
    topic: 'Registrar gastos',
    order: 3,
    question: '¿Cómo registro un pago a otra persona?',
    answer: 'Escribí quién pagó a quién. Ejemplos: "Le pagué 5000 a María", "Recibí 3000 de Juan". El balance se actualiza automáticamente.',
  },
  {
    topic: 'Registrar gastos',
    order: 4,
    question: '¿Cómo borro un gasto que cargué mal?',
    answer: 'Escribí /borrar y se elimina el último gasto o pago que registraste. También podés borrar o editar gastos desde el dashboard en textthecheck.app.',
  },

  // ─── Grupos ─────────────────────────────────────────────────
  {
    topic: 'Grupos',
    order: 5,
    question: '¿Cómo creo o me uno a un grupo?',
    answer: 'Cuando te registrás por primera vez, el bot te guía para crear tu primer grupo. Para unirte a un grupo existente, pedile a alguien del grupo que te comparta el link de invitación. También podés crear grupos desde la app en textthecheck.app.',
  },
  {
    topic: 'Grupos',
    order: 6,
    question: '¿Cómo cambio de grupo si tengo varios?',
    answer: 'Escribí /grupo y el bot te muestra la lista de tus grupos para que elijas en cuál registrar los próximos gastos.',
  },
  {
    topic: 'Grupos',
    order: 7,
    question: '¿Cómo veo quién debe a quién?',
    answer: 'Escribí /balance para ver el resumen de deudas del grupo. Muestra cuánto debe o le deben a cada persona. También podés ver el balance detallado en el dashboard.',
  },
  {
    topic: 'Grupos',
    order: 8,
    question: '¿Qué son los miembros fantasma?',
    answer: 'Son personas que agregás al grupo desde la app pero que no tienen cuenta ni WhatsApp vinculado. Sirven para incluirlas en los gastos cuando no usan la app. Sus gastos los carga otro miembro mencionándolos.',
  },

  // ─── Multi-moneda ───────────────────────────────────────────
  {
    topic: 'Monedas',
    order: 9,
    question: '¿Puedo registrar gastos en dólares, euros o reales?',
    answer: 'Sí. Indicá la moneda en el mensaje: "50 dólares la cena", "30 euros el regalo", "100 reales el almuerzo". Se convierte automáticamente a pesos argentinos usando la cotización del momento. Monedas soportadas: USD, EUR, BRL.',
  },

  // ─── Finanzas ───────────────────────────────────────────────
  {
    topic: 'Finanzas personales',
    order: 10,
    question: '¿Cómo registro un gasto personal?',
    answer: 'En modo Finanzas, mandá un mensaje con el monto y descripción: "1500 café", "5 lucas uber", "50 dólares la cena". También podés enviar un audio describiendo el gasto, una foto de comprobante o un PDF de transferencia.',
  },
  {
    topic: 'Finanzas personales',
    order: 11,
    question: '¿Cómo funcionan los gastos fijos/recurrentes?',
    answer: 'Los gastos fijos se detectan automáticamente (alquiler, netflix, prepaga, etc.) o los podés crear desde la app. Escribí /fijos para ver el estado de tus gastos fijos del mes: cuáles están pagados y cuáles pendientes.',
  },

  // ─── Modos y configuración ──────────────────────────────────
  {
    topic: 'Configuración',
    order: 12,
    question: '¿Cómo cambio entre modo Grupos y Finanzas?',
    answer: 'Escribí /modo grupos o /modo finanzas para cambiar. Cuando cambiás de modo, cualquier gasto pendiente de confirmar se descarta. Escribí /modo sin argumento para ver en qué modo estás.',
  },
  {
    topic: 'Configuración',
    order: 13,
    question: '¿Cómo vinculo mi cuenta de WhatsApp?',
    answer: 'Andá a tu Perfil en textthecheck.app, tocá "Generar código" en la sección WhatsApp, y después mandá por WhatsApp: VINCULAR <código>. El código dura 10 minutos. Para desvincular, escribí DESVINCULAR.',
  },

  // ─── Comandos ───────────────────────────────────────────────
  {
    topic: 'Comandos',
    order: 14,
    question: '¿Qué comandos tiene el bot?',
    answer: 'Comandos generales: /ayuda (esta ayuda), /modo (cambiar modo). En Grupos: /balance (ver deudas), /lista (últimos gastos), /grupo (cambiar grupo), /borrar (borrar último). En Finanzas: /resumen (resumen del mes), /lista (últimos gastos), /fijos (gastos fijos), /categorias (ver categorías), /analisis (análisis financiero con IA).',
  },
]

async function seedFaq(): Promise<void> {
  console.log(`[SEED] Seeding ${FAQ_ENTRIES.length} FAQ entries into ${COLLECTION}...`)

  // Delete existing docs
  const existing = await db.collection(COLLECTION).get()
  if (!existing.empty) {
    const batch = db.batch()
    existing.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    console.log(`[SEED] Deleted ${existing.size} existing FAQ entries`)
  }

  // Create new docs
  const batch = db.batch()
  for (const entry of FAQ_ENTRIES) {
    const ref = db.collection(COLLECTION).doc()
    batch.set(ref, {
      ...entry,
      createdAt: new Date(),
    })
  }
  await batch.commit()

  console.log(`[SEED] Done! ${FAQ_ENTRIES.length} FAQ entries created.`)
  process.exit(0)
}

seedFaq().catch(error => {
  console.error('[SEED] Error:', error)
  process.exit(1)
})
