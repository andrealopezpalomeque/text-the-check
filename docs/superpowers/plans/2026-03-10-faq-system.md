# FAQ System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public FAQ page to the TTC web app, enhance the seed script with rich HTML content, add smart support detection in the bot, and update Firestore rules for public FAQ access.

**Architecture:** Six independent tasks: (1) enhanced seed script, (2) Firestore rules + auth middleware, (3) FAQ Vue page, (4) footer + route config updates, (5) smart support detection in Gemini + handlers, (6) error message integration. Tasks 1-4 are frontend/infra, tasks 5-6 are server-side bot changes.

**Tech Stack:** Nuxt 3 (Vue 3 SPA), Firebase Firestore (client SDK + Admin SDK), Tailwind CSS with TTC design tokens, Lucide Vue icons, TypeScript, Express.js, Gemini AI.

---

## File Structure

**Create:**
- `client/pages/faq.vue` — Public FAQ accordion page using `landing` layout

**Modify:**
- `server/src/scripts/seed-faq.ts` — Rewrite with topicLabel, topicOrder, HTML answers, 6 topic groups
- `firestore.rules` — Add `ttc_faq` public read rule
- `client/middleware/auth.ts` — Add `/faq` to public routes
- `client/nuxt.config.ts` — Add `/faq` route rule
- `client/components/LandingFooter.vue` — Add FAQ link in nav group
- `server/src/handlers/GeminiHandler.ts` — Add `isSupportQuestion` to both extraction prompts + response types
- `server/src/handlers/GruposHandler.ts` — Handle `isSupportQuestion` after AI parse, store original text, add button handler
- `server/src/handlers/FinanzasHandler.ts` — Handle `isSupportQuestion` after AI parse, store original text, add button handler
- `server/src/webhooks/wp_webhook.ts` — Route new `support_detect_*` button responses to handlers

---

## Chunk 1: Infrastructure & Client

### Task 1: Enhanced Seed Script

**Files:**
- Modify: `server/src/scripts/seed-faq.ts`

- [ ] **Step 1: Rewrite seed-faq.ts with full FAQ content**

Replace the entire file. Key changes from current version:
- Add `topicLabel` and `topicOrder` fields to interface and data
- HTML-formatted answers (not plain text)
- 6 topic groups with ~30 entries total
- WhatsApp deep link helper

```typescript
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

  // ─── Topic 2: Modo Grupos ──────────────────────────────────
  {
    topic: 'grupos',
    topicLabel: 'Modo Grupos',
    topicOrder: 2,
    order: 1,
    question: '¿Cómo creo un grupo?',
    answer: `<p>Tenés dos formas:</p>
<ul>
<li><strong>Por WhatsApp:</strong> cuando te registrás por primera vez y elegís modo Grupos, el bot te guía para crear tu primer grupo</li>
<li><strong>Desde la app:</strong> entrá a <a href="https://textthecheck.app/grupos" target="_blank">textthecheck.app/grupos</a> y creá uno nuevo</li>
</ul>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Modo Grupos',
    topicOrder: 2,
    order: 2,
    question: '¿Cómo invito gente al grupo?',
    answer: `<p>Compartí el link de invitación de tu grupo. El formato es:</p>
<p><code>textthecheck.app/unirse?group=ID_DEL_GRUPO</code></p>
<p>Podés obtener el link desde la app, en la pantalla del grupo. Quien reciba el link puede unirse con un click.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Modo Grupos',
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
    topicLabel: 'Modo Grupos',
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
    topicLabel: 'Modo Grupos',
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
    topicLabel: 'Modo Grupos',
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
    topicLabel: 'Modo Grupos',
    topicOrder: 2,
    order: 7,
    question: '¿Qué son los miembros fantasma?',
    answer: `<p>Son personas que agregás al grupo desde la app pero que <strong>no tienen cuenta</strong> ni WhatsApp vinculado.</p>
<p>Sirven para incluirlas en los gastos cuando no usan la app. Sus gastos los carga otro miembro mencionándolos por nombre.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Modo Grupos',
    topicOrder: 2,
    order: 8,
    question: '¿Cómo funciona el balance?',
    answer: `<p>Escribí <code>/balance</code> para ver el resumen de deudas del grupo.</p>
<p>El balance funciona como <strong>Splitwise</strong>: calcula cuánto pagó cada persona, cuánto le corresponde, y simplifica las deudas para minimizar las transferencias necesarias.</p>
<p>También podés ver el balance detallado en el dashboard.</p>`,
  },
  {
    topic: 'grupos',
    topicLabel: 'Modo Grupos',
    topicOrder: 2,
    order: 9,
    question: '¿Cómo se simplifican las deudas?',
    answer: `<p>El algoritmo de simplificación reduce la cantidad de transferencias necesarias.</p>
<p>Por ejemplo, si A le debe a B y B le debe a C, en vez de 2 transferencias se simplifica a una sola: A le paga directo a C.</p>
<p>Esto minimiza la cantidad de movimientos de dinero entre los miembros del grupo.</p>`,
  },

  // ─── Topic 3: Modo Finanzas ─────────────────────────────────
  {
    topic: 'finanzas',
    topicLabel: 'Modo Finanzas',
    topicOrder: 3,
    order: 1,
    question: '¿Qué es el modo Finanzas?',
    answer: `<p>Es tu <strong>tracker de gastos personales</strong>. Registrá lo que gastás día a día, organizalo por categorías, y llevá el control de tus pagos fijos.</p>
<p>Funciona por WhatsApp y desde el dashboard en <a href="https://textthecheck.app/finanzas" target="_blank">textthecheck.app/finanzas</a>.</p>`,
  },
  {
    topic: 'finanzas',
    topicLabel: 'Modo Finanzas',
    topicOrder: 3,
    order: 2,
    question: '¿Cómo registro un gasto personal?',
    answer: `<p>Mandá un mensaje con el monto y descripción:</p>
<ul>
<li><code>$500 supermercado</code></li>
<li><code>$500 comida #Salidas</code> — con categoría</li>
<li><code>5 lucas uber</code></li>
<li><code>50 dólares la cena</code></li>
</ul>
<p>También podés enviar un <strong>audio</strong> describiendo el gasto, una <strong>foto</strong> de comprobante o un <strong>PDF</strong> de transferencia.</p>`,
  },
  {
    topic: 'finanzas',
    topicLabel: 'Modo Finanzas',
    topicOrder: 3,
    order: 3,
    question: '¿Cómo funcionan las categorías?',
    answer: `<p>Tenés 17 categorías predeterminadas (Supermercado, Salidas, Transporte, Servicios, etc.).</p>
<p>La IA asigna la categoría automáticamente según el gasto. También podés forzar una categoría con <strong>#hashtag</strong>: <code>$500 café #Salidas</code>.</p>
<p>Escribí <code>/categorias</code> para ver tus categorías disponibles.</p>`,
  },
  {
    topic: 'finanzas',
    topicLabel: 'Modo Finanzas',
    topicOrder: 3,
    order: 4,
    question: '¿Qué son los pagos fijos?',
    answer: `<p>Son gastos recurrentes con fecha de vencimiento: alquiler, Netflix, servicios, etc.</p>
<p>Se detectan automáticamente cuando registrás un gasto que parece recurrente, o los podés crear manualmente desde la app.</p>
<p>Escribí <code>/fijos</code> para ver el estado de tus pagos fijos del mes: cuáles están pagados y cuáles pendientes.</p>`,
  },
  {
    topic: 'finanzas',
    topicLabel: 'Modo Finanzas',
    topicOrder: 3,
    order: 5,
    question: '¿Cómo funciona el análisis financiero?',
    answer: `<p>Escribí <code>/analisis</code> y la IA analiza tus últimos 3 meses de gastos.</p>
<p>Te da 2-3 consejos personalizados sobre tus hábitos de gasto, tendencias y oportunidades de ahorro.</p>`,
  },

  // ─── Topic 4: Multi-moneda ──────────────────────────────────
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 4,
    order: 1,
    question: '¿Puedo registrar gastos en dólares u otras monedas?',
    answer: `<p>Sí. Soportamos <strong>USD</strong> (dólares), <strong>EUR</strong> (euros) y <strong>BRL</strong> (reales brasileños).</p>
<p>El gasto se convierte automáticamente a pesos argentinos usando la cotización del momento.</p>`,
  },
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 4,
    order: 2,
    question: '¿Qué tipo de cambio se usa?',
    answer: `<p>Se usa la cotización del <strong>dólar blue</strong> (mercado informal), actualizada cada 30 minutos via <a href="https://dolarapi.com" target="_blank">dolarapi.com</a>.</p>
<p>Para EUR y BRL se usa la cotización blue equivalente.</p>`,
  },
  {
    topic: 'multimoneda',
    topicLabel: 'Multi-moneda',
    topicOrder: 4,
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

  // ─── Topic 5: Comandos del bot ──────────────────────────────
  {
    topic: 'comandos',
    topicLabel: 'Comandos del bot',
    topicOrder: 5,
    order: 1,
    question: '¿Qué comandos tiene el bot?',
    answer: `<p><strong>Comandos generales:</strong></p>
<ul>
<li><code>/ayuda</code> — Ver opciones de ayuda</li>
<li><code>/modo</code> — Ver o cambiar de modo (grupos/finanzas)</li>
</ul>
<p><strong>Modo Grupos:</strong></p>
<ul>
<li><code>/balance</code> — Ver deudas del grupo</li>
<li><code>/lista</code> — Últimos gastos del grupo</li>
<li><code>/grupo</code> — Cambiar de grupo activo</li>
<li><code>/borrar</code> — Borrar el último gasto o pago</li>
</ul>
<p><strong>Modo Finanzas:</strong></p>
<ul>
<li><code>/resumen</code> — Resumen del mes</li>
<li><code>/lista</code> — Últimos gastos personales</li>
<li><code>/fijos</code> — Estado de pagos fijos</li>
<li><code>/categorias</code> — Ver categorías</li>
<li><code>/analisis</code> — Análisis financiero con IA</li>
</ul>`,
  },
  {
    topic: 'comandos',
    topicLabel: 'Comandos del bot',
    topicOrder: 5,
    order: 2,
    question: '¿Cómo cambio entre modo Grupos y Finanzas?',
    answer: `<p>Escribí:</p>
<ul>
<li><code>/modo grupos</code> — para dividir gastos con amigos</li>
<li><code>/modo finanzas</code> — para registrar gastos personales</li>
<li><code>/modo</code> — para ver en qué modo estás</li>
</ul>`,
  },
  {
    topic: 'comandos',
    topicLabel: 'Comandos del bot',
    topicOrder: 5,
    order: 3,
    question: '¿Cómo cambio de grupo activo?',
    answer: `<p>Escribí <code>/grupo</code> y el bot te muestra la lista de tus grupos.</p>
<p>Elegí el número del grupo en el que querés registrar los próximos gastos.</p>`,
  },

  // ─── Topic 6: Dashboard y cuenta ────────────────────────────
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 6,
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
    topicOrder: 6,
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
    topicOrder: 6,
    order: 3,
    question: '¿Puedo exportar mis gastos?',
    answer: `<p>Esta funcionalidad está en desarrollo. Próximamente vas a poder exportar tus gastos desde el dashboard.</p>`,
  },
  {
    topic: 'dashboard',
    topicLabel: 'Dashboard y cuenta',
    topicOrder: 6,
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
```

- [ ] **Step 2: Verify script compiles**

Run: `cd server && npx tsc --noEmit src/scripts/seed-faq.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/seed-faq.ts
git commit -m "feat: enhance FAQ seed script with topics, HTML answers, 30 entries"
```

---

### Task 2: Firestore Rules + Auth Middleware + Route Config

**Files:**
- Modify: `firestore.rules`
- Modify: `client/middleware/auth.ts`
- Modify: `client/nuxt.config.ts`

- [ ] **Step 1: Add ttc_faq public read rule to firestore.rules**

Add this block BEFORE the catch-all deny rule at the bottom (before line 285 `match /{document=**}`):

```
    // ============================================
    // ttc_faq Collection (public read)
    // ============================================
    match /ttc_faq/{docId} {
      allow read: if true;
      allow write: if false;
    }
```

- [ ] **Step 2: Add /faq to public routes in auth middleware**

In `client/middleware/auth.ts` line 1, add `/faq` to the publicRoutes array:

```typescript
const publicRoutes = ['/', '/iniciar-sesion', '/configurar', '/unirse', '/privacy', '/landing-prueba', '/faq']
```

- [ ] **Step 3: Add /faq route rule to nuxt.config.ts**

In `client/nuxt.config.ts` inside `routeRules` (line 100-105), add:

```typescript
'/faq': { prerender: true },
```

- [ ] **Step 4: Commit**

```bash
git add firestore.rules client/middleware/auth.ts client/nuxt.config.ts
git commit -m "feat: add ttc_faq public read rule, /faq public route, prerender config"
```

---

### Task 3: FAQ Page

**Files:**
- Create: `client/pages/faq.vue`

- [ ] **Step 1: Create the FAQ page**

Reference files for patterns:
- `client/pages/privacy.vue` — layout, SEO meta, back link pattern
- `client/plugins/firebase.client.ts` — provides `$db`
- `client/composables/useFirebase.ts` — `useFirebase()` returns `{ db }`

```vue
<template>
  <div class="min-h-screen bg-ttc-bg">
    <div class="container mx-auto px-4 py-12 max-w-3xl">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-ttc-text-muted hover:text-ttc-text transition-colors mb-8"
      >
        <ArrowLeft :size="20" :stroke-width="1.5" />
        Volver al inicio
      </NuxtLink>

      <h1 class="font-display text-3xl font-bold text-ttc-text mb-2">
        Preguntas frecuentes
      </h1>
      <p class="text-ttc-text-dim text-sm mb-10">
        Todo lo que necesitás saber sobre text the check
      </p>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-8">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <div class="h-6 w-48 bg-ttc-surface rounded animate-pulse" />
          <div v-for="j in 3" :key="j" class="h-14 bg-ttc-surface rounded-lg animate-pulse" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <p class="text-ttc-text-muted">No pudimos cargar las preguntas frecuentes.</p>
        <button
          class="mt-4 text-ttc-primary hover:text-ttc-primary-light transition-colors text-sm"
          @click="fetchFaq"
        >
          Reintentar
        </button>
      </div>

      <!-- FAQ content -->
      <div v-else class="space-y-10">
        <section v-for="group in groupedFaq" :key="group.topic">
          <h2 class="font-display text-lg font-semibold text-ttc-text mb-4">
            {{ group.topicLabel }}
          </h2>

          <div class="space-y-2">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="border border-ttc-border rounded-lg overflow-hidden"
            >
              <button
                class="w-full flex items-center justify-between px-5 py-4 text-left text-ttc-text hover:bg-ttc-surface/50 transition-colors"
                @click="toggle(item.id)"
              >
                <span class="font-medium text-sm pr-4">{{ item.question }}</span>
                <ChevronDown
                  :size="18"
                  :stroke-width="1.5"
                  class="shrink-0 text-ttc-text-muted transition-transform duration-200"
                  :class="{ 'rotate-180': openItems.has(item.id) }"
                />
              </button>

              <div
                v-show="openItems.has(item.id)"
                class="px-5 pb-5 faq-answer text-sm text-ttc-text-muted leading-relaxed"
                v-html="item.answer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query } from 'firebase/firestore'
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'

definePageMeta({
  layout: 'landing',
  ssr: false,
})

useHead({
  title: 'Preguntas frecuentes — text the check',
})

useSeoMeta({
  title: 'Preguntas frecuentes — text the check',
  description: 'Preguntas frecuentes sobre text the check. Cómo dividir gastos, registrar pagos, vincular WhatsApp y más.',
  ogTitle: 'Preguntas frecuentes — text the check',
  ogDescription: 'Preguntas frecuentes sobre text the check. Cómo dividir gastos, registrar pagos, vincular WhatsApp y más.',
})

interface FaqItem {
  id: string
  topic: string
  topicLabel: string
  topicOrder: number
  order: number
  question: string
  answer: string
}

interface FaqGroup {
  topic: string
  topicLabel: string
  topicOrder: number
  items: FaqItem[]
}

const { db } = useFirebase()
const loading = ref(true)
const error = ref(false)
const faqItems = ref<FaqItem[]>([])
const openItems = ref(new Set<string>())

const groupedFaq = computed<FaqGroup[]>(() => {
  const groups = new Map<string, FaqGroup>()

  for (const item of faqItems.value) {
    if (!groups.has(item.topic)) {
      groups.set(item.topic, {
        topic: item.topic,
        topicLabel: item.topicLabel,
        topicOrder: item.topicOrder,
        items: [],
      })
    }
    groups.get(item.topic)!.items.push(item)
  }

  // Sort groups by topicOrder, items by order
  const sorted = Array.from(groups.values()).sort((a, b) => a.topicOrder - b.topicOrder)
  for (const group of sorted) {
    group.items.sort((a, b) => a.order - b.order)
  }
  return sorted
})

function toggle(id: string) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id)
  } else {
    openItems.value.add(id)
  }
}

async function fetchFaq() {
  loading.value = true
  error.value = false

  try {
    const q = query(collection(db, 'ttc_faq'))
    const snapshot = await getDocs(q)

    faqItems.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FaqItem[]
  } catch (e) {
    console.error('Error fetching FAQ:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFaq()
})
</script>

<style scoped>
.faq-answer :deep(p) {
  margin-bottom: 0.75rem;
}
.faq-answer :deep(p:last-child) {
  margin-bottom: 0;
}
.faq-answer :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.faq-answer :deep(li) {
  margin-bottom: 0.25rem;
}
.faq-answer :deep(strong) {
  color: var(--color-text);
}
.faq-answer :deep(a) {
  color: var(--color-primary);
  transition: color 0.15s;
}
.faq-answer :deep(a:hover) {
  color: var(--color-primary-light);
}
.faq-answer :deep(code) {
  background: var(--color-surface);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  color: var(--color-text);
}
</style>
```

- [ ] **Step 2: Verify the page renders**

Run: `cd client && npm run dev`
Navigate to `http://localhost:3000/faq`
Expected: Page loads with landing layout, shows loading skeleton, then FAQ content (or error if Firestore has no data yet)

- [ ] **Step 3: Commit**

```bash
git add client/pages/faq.vue
git commit -m "feat: add FAQ page with accordion UI, grouped by topic"
```

---

### Task 4: LandingFooter Update

**Files:**
- Modify: `client/components/LandingFooter.vue`

- [ ] **Step 1: Update the footer to group links in a nav**

Replace the existing `<!-- Links -->` section (the single NuxtLink to /privacy, lines 23-29) and the domain text (lines 31-34) with:

```vue
      <!-- Links -->
      <nav class="flex items-center gap-4 text-xs text-ttc-text-dim">
        <NuxtLink
          to="/faq"
          class="hover:text-ttc-text transition-colors"
        >
          Preguntas frecuentes
        </NuxtLink>
        <NuxtLink
          to="/privacy"
          class="hover:text-ttc-text transition-colors"
        >
          Politica de Privacidad
        </NuxtLink>
      </nav>

      <!-- Domain -->
      <p class="text-xs text-ttc-text-dim">
        textthecheck.app
      </p>
```

- [ ] **Step 2: Commit**

```bash
git add client/components/LandingFooter.vue
git commit -m "feat: add FAQ link to landing footer"
```

---

## Chunk 2: Smart Support Detection (Server)

### Task 5: Add isSupportQuestion to Gemini Prompts + Response Types

**Files:**
- Modify: `server/src/handlers/GeminiHandler.ts`

- [ ] **Step 1: Add isSupportQuestion to the Grupos extraction prompt**

In `buildExtractionPrompt()` method, add to the UNKNOWN response format section (around line 619-624). Change the UNKNOWN format from:

```
For UNKNOWN:
{
  "type": "unknown",
  "confidence": <0.0 to 1.0>,
  "suggestion": "<suggestion for user in Spanish>"
}
```

to:

```
For UNKNOWN:
{
  "type": "unknown",
  "confidence": <0.0 to 1.0>,
  "suggestion": "<suggestion for user in Spanish>",
  "isSupportQuestion": true | false
}
```

And add this instruction block right before the RESPONSE FORMAT section (before line 588):

```
SUPPORT QUESTION DETECTION:
- isSupportQuestion: true SOLO si el mensaje es claramente una pregunta general, saludo, consulta de soporte, o texto sin relación a un gasto/pago.
- Ejemplos de isSupportQuestion=true: "hola", "cómo funciona esto", "necesito ayuda", "qué puedo hacer", "no entiendo"
- Ejemplos de isSupportQuestion=false: "150", "pizza", "5 lucas", "le pagué a juan" (cualquier cosa que pueda ser un gasto o pago)
- En caso de duda, usa false.
```

Also update the UNKNOWN example at line 674:
```
Message: "Hola"
{"type":"unknown","confidence":0.1,"suggestion":"Hola! Para registrar un gasto, decime el monto y la descripción. Ej: 150 pizza","isSupportQuestion":true}
```

- [ ] **Step 2: Add isSupportQuestion to the Finanzas personal expense prompt**

In `buildPersonalExpensePrompt()`, same changes. Add support detection instruction before RESPONSE FORMAT, and update the UNKNOWN format:

```
For UNKNOWN:
{
  "type": "unknown",
  "confidence": <0.0 to 1.0>,
  "suggestion": "<suggestion for user in Spanish>",
  "isSupportQuestion": true | false
}
```

Update the UNKNOWN example:
```
Message: "hola"
{"type":"unknown","confidence":0.1,"suggestion":"Hola! Para registrar un gasto, decime el monto y la descripción. Ej: $500 café #comida","isSupportQuestion":true}
```

- [ ] **Step 3: Add isSupportQuestion to the response type interfaces and validation**

Find the `validateUnknownResult` method and add `isSupportQuestion` to it. It should already return a type with `suggestion` — add the boolean field:

```typescript
private validateUnknownResult(p: Record<string, unknown>): AIUnknownResult {
  return {
    type: 'unknown',
    confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0,
    suggestion: typeof p.suggestion === 'string' ? p.suggestion : 'No pude entender el mensaje',
    isSupportQuestion: typeof p.isSupportQuestion === 'boolean' ? p.isSupportQuestion : false,
  }
}
```

Also update `AIUnknownResult` interface at line 47-51 of GeminiHandler.ts. Change:

```typescript
export interface AIUnknownResult {
  type: 'unknown'
  confidence: number
  suggestion?: string
}
```

to:

```typescript
export interface AIUnknownResult {
  type: 'unknown'
  confidence: number
  suggestion?: string
  isSupportQuestion: boolean
}
```

And update `validateUnknownResult` at line 453-458, preserving the existing `0.3` confidence default and `undefined` suggestion default:

```typescript
private validateUnknownResult(p: Record<string, unknown>): AIUnknownResult {
  return {
    type: 'unknown',
    confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.3,
    suggestion: typeof p.suggestion === 'string' ? p.suggestion : undefined,
    isSupportQuestion: typeof p.isSupportQuestion === 'boolean' ? p.isSupportQuestion : false,
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/handlers/GeminiHandler.ts
git commit -m "feat: add isSupportQuestion to Gemini extraction prompts"
```

---

### Task 6: Handle isSupportQuestion in GruposHandler

**Files:**
- Modify: `server/src/handlers/GruposHandler.ts`
- Modify: `server/src/webhooks/wp_webhook.ts`

- [ ] **Step 1: Add pending support detection state to GruposHandler**

In GruposHandler, add a Map to store original text when support is detected:

```typescript
private pendingSupportTexts = new Map<string, { text: string; expiresAt: number }>()
```

Add cleanup in the same cleanup interval pattern as existing pending states.

- [ ] **Step 2: Add sendButtons import to GruposHandler**

In `server/src/handlers/GruposHandler.ts` line 14, change:

```typescript
import { sendMessage, downloadMedia } from '../helpers/whatsapp.js'
```

to:

```typescript
import { sendMessage, sendButtons, downloadMedia } from '../helpers/whatsapp.js'
```

- [ ] **Step 3: Add skipSupportDetection parameter to GruposHandler.handleMessage**

Add `skipSupportDetection = false` as the last parameter of `handleMessage`:

```typescript
async handleMessage(from: string, messageType: string, messageData: any, user: User, contactName: string, skipSupportDetection = false): Promise<void> {
```

Pass it through to the AI result check in the next step.

- [ ] **Step 4: Handle isSupportQuestion in the AI parse flow**

In GruposHandler's `handleMessage` method (around line 365 where `aiResult.type === 'unknown'` is handled), change:

```typescript
} else if (aiResult.type === 'unknown') {
  // AI couldn't parse — show our formatted parse error (not raw AI suggestion)
  await sendMessage(from, formatParseError('grupos', { groupName: group?.name }))
  return
}
```

to:

```typescript
} else if (aiResult.type === 'unknown') {
  // Check if it's a support question (AIUnknownResult has no amount field — just check the flag)
  if (aiResult.isSupportQuestion && !skipSupportDetection) {
    this.pendingSupportTexts.set(user.id, {
      text,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })
    await sendButtons(from, 'Parece que tenés una consulta. ¿Querés que te ayude?', [
      { id: 'support_detect_ai', title: 'Soporte AI' },
      { id: 'support_detect_expense', title: 'Registrar gasto' },
    ])
    return
  }
  await sendMessage(from, formatParseError('grupos', { groupName: group?.name }))
  return
}
```

- [ ] **Step 5: Add public methods to get/clear pending support text**

```typescript
public getPendingSupportText(userId: string): string | null {
  const pending = this.pendingSupportTexts.get(userId)
  if (!pending || Date.now() > pending.expiresAt) {
    this.pendingSupportTexts.delete(userId)
    return null
  }
  return pending.text
}

public clearPendingSupportText(userId: string): void {
  this.pendingSupportTexts.delete(userId)
}
```

- [ ] **Step 6: Update clearPendingStates to also clear pendingSupportTexts**

In GruposHandler's `clearPendingStates` method (line 205), add `this.pendingSupportTexts.delete(userId)`:

```typescript
clearPendingStates(userId: string): boolean {
  const hadPending = this.pendingAIExpenses.has(userId) || this.pendingGroupSelections.has(userId) || this.pendingExpenses.has(userId) || this.pendingSupportTexts.has(userId)
  this.pendingAIExpenses.delete(userId)
  this.pendingGroupSelections.delete(userId)
  this.pendingExpenses.delete(userId)
  this.pendingSupportTexts.delete(userId)
  return hadPending
}
```

- [ ] **Step 7: Route support detection buttons in wp_webhook.ts**

In `wp_webhook.ts`, in the interactive button handling section (around line 586-627), add handling for the new button IDs:

```typescript
if (buttonId === 'support_detect_ai') {
  createSupportSession(from)
  await sendMessage(from, 'Escribí tu consulta y te ayudo.')
  // Clear pending text in both handlers
  const user = await gruposHandler.getUserByPhone(from)
  if (user) {
    gruposHandler.clearPendingSupportText(user.id)
    finanzasHandler.clearPendingSupportText(user.id)
  }
  return
}

if (buttonId === 'support_detect_expense') {
  const user = await gruposHandler.getUserByPhone(from)
  if (!user) {
    await sendMessage(from, 'Escribí el gasto que querés registrar.')
    return
  }
  const { mode } = await determineUserMode(from)
  // Re-process original text as expense (skipSupportDetection=true)
  const originalText = mode === 'grupos'
    ? gruposHandler.getPendingSupportText(user.id)
    : finanzasHandler.getPendingSupportText(user.id)

  if (originalText && mode === 'grupos') {
    gruposHandler.clearPendingSupportText(user.id)
    await gruposHandler.handleMessage(from, 'text', { type: 'text', text: { body: originalText } }, user, contactName, true)
  } else if (originalText && mode === 'finanzas') {
    finanzasHandler.clearPendingSupportText(user.id)
    await finanzasHandler.handleMessage(from, 'text', { type: 'text', text: { body: originalText } }, contactName, true)
  } else {
    await sendMessage(from, 'Escribí el gasto que querés registrar.')
  }
  return
}
```

- [ ] **Step 8: Commit**

```bash
git add server/src/handlers/GruposHandler.ts server/src/webhooks/wp_webhook.ts
git commit -m "feat: smart support detection in Grupos with button flow"
```

---

### Task 7: Handle isSupportQuestion in FinanzasHandler

**Files:**
- Modify: `server/src/handlers/FinanzasHandler.ts`

- [ ] **Step 1: Add sendButtons import to FinanzasHandler**

In `server/src/handlers/FinanzasHandler.ts` line 13, change:

```typescript
import { sendMessage, downloadMedia } from '../helpers/whatsapp.js'
```

to:

```typescript
import { sendMessage, sendButtons, downloadMedia } from '../helpers/whatsapp.js'
```

- [ ] **Step 2: Add pending support detection state to FinanzasHandler**

Same pattern as GruposHandler:

```typescript
private pendingSupportTexts = new Map<string, { text: string; expiresAt: number }>()

public getPendingSupportText(userId: string): string | null {
  const pending = this.pendingSupportTexts.get(userId)
  if (!pending || Date.now() > pending.expiresAt) {
    this.pendingSupportTexts.delete(userId)
    return null
  }
  return pending.text
}

public clearPendingSupportText(userId: string): void {
  this.pendingSupportTexts.delete(userId)
}
```

Also update `clearPendingStates` in FinanzasHandler to also clear `this.pendingSupportTexts.delete(userId)`.

- [ ] **Step 3: Add skipSupportDetection parameter — thread through all 3 methods**

**handleMessage** (line ~152): Add `skipSupportDetection = false` as last parameter:
```typescript
async handleMessage(from: string, messageType: string, messageData: any, contactName: string, skipSupportDetection = false): Promise<void> {
```

Pass to processTextMessage at line 162:
```typescript
await this.processTextMessage(from, typeof text === 'string' ? text : String(text), contactName, userId, skipSupportDetection)
```

**processTextMessage** (line ~186): Add `skipSupportDetection = false` as last parameter:
```typescript
private async processTextMessage(from: string, text: string, contactName: string, userId: string | null, skipSupportDetection = false): Promise<void> {
```

Pass to handleExpenseMessage at line 243:
```typescript
await this.handleExpenseMessage(from, text, userId, skipSupportDetection)
```

**handleExpenseMessage** (line ~472): Add `skipSupportDetection = false` as last parameter:
```typescript
private async handleExpenseMessage(phone: string, text: string, userId: string | null, skipSupportDetection = false): Promise<void> {
```

- [ ] **Step 4: Handle isSupportQuestion in expense parsing flow**

In `handleExpenseMessage` (line 472), after the AI returns its result (line ~483) and BEFORE the regex fallback check (line ~489), add:

```typescript
// Check for support question (before regex fallback)
// userId is guaranteed non-null here (early return at line 473)
if (aiResult.type === 'unknown' && (aiResult as any).isSupportQuestion && !skipSupportDetection) {
  this.pendingSupportTexts.set(userId!, {
    text,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  await sendButtons(phone, 'Parece que tenés una consulta. ¿Querés que te ayude?', [
    { id: 'support_detect_ai', title: 'Soporte AI' },
    { id: 'support_detect_expense', title: 'Registrar gasto' },
  ])
  return
}
```

Note: Use `(aiResult as any).isSupportQuestion` or narrow properly via type guard since `AIPersonalParseResult` is a union. Alternatively, since `AIUnknownResult` now has `isSupportQuestion`, TypeScript narrows it correctly after the `aiResult.type === 'unknown'` check — so `aiResult.isSupportQuestion` should work directly after the type check.

- [ ] **Step 4: Commit**

```bash
git add server/src/handlers/FinanzasHandler.ts
git commit -m "feat: smart support detection in Finanzas with button flow"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No compilation errors

- [ ] **Step 2: Verify client builds**

Run: `cd client && npm run generate`
Expected: Build succeeds, `/faq` route is generated

- [ ] **Step 3: Verify FAQ page renders locally**

Run: `cd client && npm run dev`
Navigate to: `http://localhost:3000/faq`
Expected: Landing layout with FAQ accordion (may show error if no seeded data)

- [ ] **Step 4: Verify footer link**

Navigate to: `http://localhost:3000`
Expected: Footer shows "Preguntas frecuentes" and "Politica de Privacidad" links side by side

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```

---

## Post-Implementation Reminders

1. **Run the seed script** after deploying server: `cd server && npx tsx src/scripts/seed-faq.ts`
2. **Deploy Firestore rules**: `npx firebase deploy --only firestore:rules`
3. **Deploy client**: `cd client && npm run generate && cd .. && npx firebase deploy --only hosting`
4. **Test full flow**:
   - Visit `/faq` — should show 6 topic groups with accordion
   - Click footer "Preguntas frecuentes" link
   - In WhatsApp, send a greeting like "hola cómo funciona?" — should get support detection buttons
   - Pick "Soporte AI" — should start AI support session
   - Pick "Registrar gasto" — should re-process as expense
   - Type `/ayuda` — should show [Comandos] [Soporte AI] buttons
