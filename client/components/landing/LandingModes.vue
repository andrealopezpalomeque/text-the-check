<template>
  <section class="relative py-16 md:py-24 px-5 overflow-hidden">
    <!-- Background glows -->
    <div class="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-ttc-primary opacity-[0.03] pointer-events-none" style="filter: blur(80px);" />
    <div class="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-ttc-accent opacity-[0.03] pointer-events-none" style="filter: blur(80px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-14">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3">
          dos modos, un chat
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text">
          Para vos y para tu grupo
        </h2>
      </div>

      <!-- Two mode cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

        <!-- Viajes / Grupos mode -->
        <div class="mode-card group opacity-0 flex flex-col" ref="gruposCard">
          <div class="p-6 md:p-8 flex-1">
            <!-- Header with icon -->
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl bg-ttc-primary/10 flex items-center justify-center">
                <Users :size="22" class="text-ttc-primary" />
              </div>
              <div>
                <h3 class="font-nunito font-bold text-lg text-ttc-text">Viajes y Grupos</h3>
                <p class="font-body text-[11px] text-ttc-primary font-semibold uppercase tracking-wider">Dividí gastos con amigos</p>
              </div>
            </div>

            <!-- Description -->
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-6">
              Mandá un mensaje como "50 cena con Gonza" y listo. Se calcula solo quién debe a quién.
            </p>

            <!-- Features -->
            <ul class="space-y-3">
              <li v-for="feature in gruposFeatures.slice(0, visibleGrupos)" :key="feature.text" class="flex items-start gap-3">
                <component :is="feature.icon" :size="18" class="flex-shrink-0 mt-0.5 text-ttc-primary" />
                <span class="font-body text-sm text-ttc-text-muted">{{ feature.text }}</span>
              </li>
            </ul>

            <!-- Show more toggle -->
            <button
              v-if="gruposFeatures.length > 5"
              @click="showAllGrupos = !showAllGrupos"
              class="mt-4 font-body text-xs text-ttc-primary hover:text-ttc-primary-light transition-colors flex items-center gap-1"
            >
              <ChevronDown :size="14" :class="{ 'rotate-180': showAllGrupos }" class="transition-transform" />
              {{ showAllGrupos ? 'Ver menos' : `Ver ${gruposFeatures.length - 5} más` }}
            </button>
          </div>
          <!-- Bottom accent -->
          <div class="h-[3px] bg-gradient-to-r from-transparent via-ttc-primary to-transparent opacity-30 group-hover:opacity-60 transition-opacity" />
        </div>

        <!-- Finanzas mode -->
        <div class="mode-card group opacity-0 flex flex-col" ref="finanzasCard">
          <div class="p-6 md:p-8 flex-1">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl bg-ttc-accent/10 flex items-center justify-center">
                <Wallet :size="22" class="text-ttc-accent" />
              </div>
              <div>
                <h3 class="font-nunito font-bold text-lg text-ttc-text">Mis Finanzas</h3>
                <p class="font-body text-[11px] text-ttc-accent font-semibold uppercase tracking-wider">Finanzas personales</p>
              </div>
            </div>

            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-6">
              Anotá lo que gastás en el día, configurá tus pagos fijos y que te avise antes de cada vencimiento.
            </p>

            <ul class="space-y-3">
              <li v-for="feature in finanzasFeatures.slice(0, visibleFinanzas)" :key="feature.text" class="flex items-start gap-3">
                <component :is="feature.icon" :size="18" class="flex-shrink-0 mt-0.5 text-ttc-accent" />
                <span class="font-body text-sm text-ttc-text-muted">{{ feature.text }}</span>
              </li>
            </ul>

            <button
              v-if="finanzasFeatures.length > 5"
              @click="showAllFinanzas = !showAllFinanzas"
              class="mt-4 font-body text-xs text-ttc-accent hover:opacity-80 transition-colors flex items-center gap-1"
            >
              <ChevronDown :size="14" :class="{ 'rotate-180': showAllFinanzas }" class="transition-transform" />
              {{ showAllFinanzas ? 'Ver menos' : `Ver ${finanzasFeatures.length - 5} más` }}
            </button>
          </div>
          <div class="h-[3px] bg-gradient-to-r from-transparent via-ttc-accent to-transparent opacity-30 group-hover:opacity-60 transition-opacity" />
        </div>
      </div>
    </div>

    <!-- Receipt-edge divider -->
    <div class="absolute bottom-0 left-0 right-0 opacity-10">
      <svg width="100%" height="12" preserveAspectRatio="none">
        <path
          d="M 0,6 l 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5"
          stroke="var(--color-primary)"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  MessageCircle,
  AtSign,
  UserMinus,
  UserPlus,
  DollarSign,
  Scale,
  GitMerge,
  Link,
  Send,
  Tag,
  CalendarClock,
  Brain,
  TrendingUp,
  BarChart3,
  HeadphonesIcon,
  Users,
  Wallet,
  ChevronDown
} from 'lucide-vue-next'

const showAllGrupos = ref(false)
const showAllFinanzas = ref(false)

const gruposFeatures = [
  { icon: MessageCircle, text: 'Escribí como hablás — "5 lucas la birra", "50 dólares la cena"' },
  { icon: AtSign, text: 'Dividí entre todos o elegí con @menciones: "@Gonza @Mili"' },
  { icon: UserMinus, text: '"Todos menos X" — excluí a quien no participó' },
  { icon: UserPlus, text: 'Miembros fantasma — agregá gente que no tiene la app por nombre' },
  { icon: DollarSign, text: 'Multi-moneda — dólares, euros, reales con tipo de cambio blue' },
  { icon: Scale, text: 'Balance Splitwise-style — quién debe a quién, siempre actualizado' },
  { icon: GitMerge, text: 'Simplificación de deudas — mínimas transferencias necesarias' },
  { icon: Link, text: 'Invitá con un link — se unen sin instalar nada' }
]

const finanzasFeatures = [
  { icon: Send, text: 'Un mensaje para registrar cualquier gasto' },
  { icon: Tag, text: 'Categorías inteligentes — se asignan solas' },
  { icon: CalendarClock, text: 'Pagos fijos con alertas de vencimiento' },
  { icon: Brain, text: 'Resumen semanal por IA — en qué se te fue la plata' },
  { icon: TrendingUp, text: 'Análisis financiero de 3 meses — tendencias y consejos' },
  { icon: BarChart3, text: 'Dashboard con gráficos de categorías' },
  { icon: HeadphonesIcon, text: 'Soporte AI por WhatsApp si tenés dudas' }
]

const visibleGrupos = computed(() => showAllGrupos.value ? gruposFeatures.length : 5)
const visibleFinanzas = computed(() => showAllFinanzas.value ? finanzasFeatures.length : 5)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('.mode-card').forEach((card) => observer.observe(card))
})
</script>

<style scoped>
.mode-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(16px);
}

.mode-card.is-visible {
  opacity: 1 !important;
  transform: translateY(0);
}

.mode-card:hover {
  border-color: var(--color-text-dim);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
}
</style>
