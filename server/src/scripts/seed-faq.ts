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
const WA_PHONE = process.env.WHATSAPP_LANDING_PHONE || '5491100000000'

function waLink(text: string): string {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`
}

interface FaqEntry {
  topic: string
  topicLabel: string
  topicOrder: number
  order: number
  question: string
  answer: string
}

const FAQ_ENTRIES: FaqEntry[] = [
  // ─── Topic 1: Conexión WhatsApp ─────────────────────────────
  {
    topic: 'whatsapp',
    topicLabel: 'Conexión WhatsApp',
    topicOrder: 1,
    order: 1,
    question: '¿Cómo vinculo mi cuenta de WhatsApp?',
    answer: `<p>Para vincular tu WhatsApp con tu cuenta de <strong>text the check</strong>:</p>
<ul>
<li>Ingresá a <a href="https://textthecheck.app/perfil" target="_blank">tu perfil</a> en la app</li>
<li>En la sección <strong>WhatsApp</strong>, tocá <strong>"Generar código"</strong></li>
<li>Se genera un código de 6 caracteres que dura 10 minutos</li>
<li>Mandá por WhatsApp: <code>VINCULAR TU_CODIGO</code></li>
</ul>
<p>Una vez vinculado, podés registrar gastos directamente por mensaje.</p>`,
  },
  {
    topic: 'whatsapp',
    topicLabel: 'Conexión WhatsApp',
    topicOrder: 1,
    order: 2,
    question: '¿Cómo desvinculo mi cuenta?',
    answer: `<p>Mandá <code>DESVINCULAR</code> por WhatsApp y tu cuenta se desvincula al instante.</p>
<p>También podés hacerlo desde la sección WhatsApp de <a href="https://textthecheck.app/perfil" target="_blank">tu perfil</a> en la app.</p>`,
  },
  {
    topic: 'whatsapp',
    topicLabel: 'Conexión WhatsApp',
    topicOrder: 1,
    order: 3,
    question: '¿Puedo usar la app sin WhatsApp?',
    answer: `<p>Sí. El dashboard en <a href="https://textthecheck.app" target="_blank">textthecheck.app</a> funciona de forma independiente.</p>
<p>Podés ver tus gastos, balances, resúmenes y registrar gastos manualmente sin necesidad de vincular WhatsApp.</p>`,
  },

  // ─── Topic 2: Dividir gastos ──────────────────────────────────
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 1,
    question: '¿Cómo creo un grupo?',
    answer: `<p>Tenés dos formas:</p>
<ul>
<li><strong>Por WhatsApp:</strong> cuando te registrás por primera vez, el bot te guía para crear tu primer grupo</li>
<li><strong>Desde la app:</strong> entrá a <a href="https://textthecheck.app/grupos" target="_blank">textthecheck.app/grupos</a> y creá uno nuevo</li>
</ul>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 2,
    question: '¿Cómo invito gente al grupo?',
    answer: `<p>Compartí el link de invitación de tu grupo. El formato es:</p>
<p><code>textthecheck.app/unirse?group=ID_DEL_GRUPO</code></p>
<p>Podés obtener el link desde la app, en la pantalla del grupo. Quien reciba el link puede unirse con un click.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 3,
    question: '¿Cómo registro un gasto grupal?',
    answer: `<p>Mandá un mensaje por WhatsApp describiendo lo que pagaste. El bot entiende lenguaje natural:</p>
<ul>
<li><code>150 pizza</code></li>
<li><code>50 dólares cena</code></li>
<li><code>5 lucas uber</code></li>
<li><code>Gasté 1500 en el super</code></li>
</ul>
<p>Por defecto, el gasto se divide entre todos los miembros del grupo.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 4,
    question: '¿Cómo divido un gasto entre personas específicas?',
    answer: `<p>Podés mencionar a las personas en el mensaje:</p>
<ul>
<li><strong>Con "con"</strong> (te incluye): <code>150 pizza con Juan</code></li>
<li><strong>Con @</strong> (no te incluye): <code>150 pizza @Juan @Maria</code></li>
</ul>
<p>Con "con" el gasto se divide entre vos y las personas mencionadas. Con @ se divide solo entre las personas mencionadas.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 5,
    question: '¿Qué es "todos menos"?',
    answer: `<p>Podés excluir personas de un gasto usando "todos menos":</p>
<ul>
<li><code>100 pizza todos menos pipi</code> — se divide entre todos excepto pipi</li>
<li><code>200 cena todos menos juan y maria</code> — excluye a juan y maria</li>
<li><code>150 taxi todos menos yo</code> — vos pagaste pero no participás del gasto</li>
</ul>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 6,
    question: '¿Cómo registro un pago a alguien?',
    answer: `<p>Escribí quién pagó a quién:</p>
<ul>
<li><code>Pagué 5000 a María</code></li>
<li><code>Recibí 3k de Juan</code></li>
<li><code>Le transferí 10 lucas a Pedro</code></li>
</ul>
<p>El balance del grupo se actualiza automáticamente.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 7,
    question: '¿Qué son los miembros fantasma?',
    answer: `<p>Son personas que agregás al grupo desde la app pero que <strong>no tienen cuenta</strong> ni WhatsApp vinculado.</p>
<p>Sirven para incluirlas en los gastos cuando no usan la app. Sus gastos los carga otro miembro mencionándolos por nombre.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 8,
    question: '¿Cómo funciona el balance?',
    answer: `<p>Escribí <code>/balance</code> para ver el resumen de deudas del grupo.</p>
<p>El balance funciona como <strong>Splitwise</strong>: calcula cuánto pagó cada persona, cuánto le corresponde, y simplifica las deudas para minimizar las transferencias necesarias.</p>
<p>También podés ver el balance detallado en el dashboard.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Dividir gastos',
    topicOrder: 2,
    order: 9,
    question: '¿Cómo se simplifican las deudas?',
    answer: `<p>El algoritmo de simplificación reduce la cantidad de transferencias necesarias.</p>
<p>Por ejemplo, si A le debe a B y B le debe a C, en vez de 2 transferencias se simplifica a una sola: A le paga directo a C.</p>
<p>Esto minimiza la cantidad de movimientos de dinero entre los miembros del grupo.</p>`,
  },

  // ─── Topic 3: Multi-moneda ──────────────────────────────────
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 3,
    order: 1,
    question: '¿Puedo registrar gastos en dólares u otras monedas?',
    answer: `<p>Sí. Soportamos <strong>USD</strong> (dólares), <strong>EUR</strong> (euros) y <strong>BRL</strong> (reales brasileños).</p>
<p>El gasto se convierte automáticamente a pesos argentinos usando la cotización del momento.</p>`,
  },
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 3,
    order: 2,
    question: '¿Qué tipo de cambio se usa?',
    answer: `<p>Se usa la cotización del <strong>dólar blue</strong> (mercado informal), actualizada cada 30 minutos via <a href="https://dolarapi.com" target="_blank">dolarapi.com</a>.</p>
<p>Para EUR y BRL se usa la cotización blue equivalente.</p>`,
  },
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 3,
    order: 3,
    question: '¿Cómo registro un gasto en dólares?',
    answer: `<p>Indicá la moneda en el mensaje:</p>
<ul>
<li><code>50 dólares cena</code></li>
<li><code>100 usd hotel</code></li>
<li><code>USD 30 regalo</code></li>
</ul>
<p>El bot detecta la moneda automáticamente y muestra la conversión.</p>`,
  },

  // ─── Topic 4: Comandos del bot ──────────────────────────────
  {
    topic: 'comandos',
    topicLabel: 'Comandos del bot',
    topicOrder: 4,
    order: 1,
    question: '¿Qué comandos tiene el bot?',
    answer: `<p><strong>Comandos disponibles:</strong></p>
<ul>
<li><code>/ayuda</code> — Ver opciones de ayuda</li>
<li><code>/balance</code> — Ver deudas del grupo</li>
<li><code>/lista</code> — Últimos gastos del grupo</li>
<li><code>/grupo</code> — Cambiar de grupo activo</li>
<li><code>/borrar</code> — Borrar el último gasto o pago</li>
</ul>`,
  },
  {
    topic: 'comandos',
    topicLabel: 'Comandos del bot',
    topicOrder: 4,
    order: 2,
    question: '¿Cómo cambio de grupo activo?',
    answer: `<p>Escribí <code>/grupo</code> y el bot te muestra la lista de tus grupos.</p>
<p>Elegí el número del grupo en el que querés registrar los próximos gastos.</p>`,
  },

  // ─── Topic 5: Dashboard y cuenta ────────────────────────────
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 5,
    order: 1,
    question: '¿Cómo inicio sesión?',
    answer: `<p>Tenés dos formas de iniciar sesión en <a href="https://textthecheck.app" target="_blank">textthecheck.app</a>:</p>
<ul>
<li><strong>Google:</strong> Iniciá sesión con tu cuenta de Google</li>
<li><strong>WhatsApp OTP:</strong> Ingresá tu número de teléfono y recibís un código por WhatsApp</li>
</ul>`,
  },
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 5,
    order: 2,
    question: '¿Cómo configuro mi perfil?',
    answer: `<p>Entrá a <a href="https://textthecheck.app/perfil" target="_blank">tu perfil</a> para configurar:</p>
<ul>
<li>Nombre y foto</li>
<li>Teléfono y email</li>
<li>Vinculación de WhatsApp</li>
<li>Datos de pago (CBU/CVU/alias)</li>
</ul>`,
  },
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 5,
    order: 3,
    question: '¿Puedo exportar mis gastos?',
    answer: `<p>Esta funcionalidad está en desarrollo. Próximamente vas a poder exportar tus gastos desde el dashboard.</p>`,
  },
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 5,
    order: 4,
    question: '¿El bot entiende jerga argentina?',
    answer: `<p>Sí. El bot entiende expresiones como:</p>
<ul>
<li><strong>lucas</strong> — miles (5 lucas = $5.000)</li>
<li><strong>mangos</strong> — pesos</li>
<li><strong>morfi</strong> — comida</li>
<li><strong>birra</strong> — cerveza</li>
<li><strong>bondi</strong> — colectivo</li>
<li><strong>k</strong> — miles (5k = $5.000)</li>
</ul>`,
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
