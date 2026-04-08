<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 px-5 overflow-hidden">
    <div class="relative z-10 max-w-3xl mx-auto">
      <!-- Section header -->
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3 text-left md:text-center">
        todo incluido
      </p>
      <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,38px)] text-ttc-text mb-12 text-left md:text-center leading-tight">
        Todo lo que necesitás para dividir gastos
      </h2>

      <!-- Expandable features card -->
      <div
        class="bg-ttc-card border border-ttc-border rounded-2xl p-6 md:p-8 mb-10"
        :class="isVisible ? 'animate-fade-up' : 'opacity-0'"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="(feature, i) in visibleFeatures"
            :key="feature.title"
            class="flex items-start gap-3 py-2"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="feature.colorClass"
            >
              <component :is="feature.icon" :size="16" />
            </div>
            <div>
              <h3 class="font-nunito font-bold text-sm text-ttc-text mb-0.5">{{ feature.title }}</h3>
              <p class="font-body text-xs text-ttc-text-muted leading-relaxed">{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <!-- Show more toggle -->
        <button
          v-if="features.length > 6"
          @click="showAll = !showAll"
          class="mt-4 font-body text-sm text-ttc-primary hover:text-ttc-primary-light transition-colors flex items-center gap-1.5 mx-auto"
        >
          {{ showAll ? 'Ver menos' : `Ver ${features.length - 6} más` }}
          <svg class="w-4 h-4 transition-transform" :class="showAll ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <!-- Balance preview -->
      <div
        class="bg-ttc-card border border-ttc-primary/20 rounded-2xl p-6 md:p-7 max-w-[400px] mx-auto"
        :class="isVisible ? 'animate-fade-up stagger-2' : 'opacity-0'"
      >
        <div class="text-[11px] font-medium text-ttc-text-muted uppercase tracking-[1px] mb-1">Balance del grupo</div>
        <div class="font-nunito font-extrabold text-xl text-ttc-text mb-5">Brasil 2026 🇧🇷</div>

        <div v-for="(row, i) in balanceRows" :key="row.name"
          class="flex justify-between items-center py-2.5"
          :class="{ 'border-b border-ttc-border': i < balanceRows.length - 1 }"
        >
          <span class="text-sm font-medium text-ttc-text">{{ row.name }}</span>
          <span class="font-nunito font-bold text-base" :class="row.colorClass">{{ row.amount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  MessageCircle, AtSign, UserMinus, UserPlus,
  DollarSign, Scale, GitMerge, Link, Bell, Sparkles
} from 'lucide-vue-next'

const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)
const showAll = ref(false)

const features = [
  { icon: MessageCircle, title: 'Escribí como hablás', description: 'Lunfardo, lucas, mangos — el bot te entiende.', colorClass: 'bg-ttc-primary/10 text-ttc-primary' },
  { icon: AtSign, title: 'Dividí con @menciones', description: '"50 dólares la cena con @Gonza y @Mili"', colorClass: 'bg-ttc-whatsapp/10 text-ttc-whatsapp' },
  { icon: DollarSign, title: 'Multi-moneda', description: 'Pesos, dólares, euros, reales. Cotización blue en tiempo real.', colorClass: 'bg-ttc-primary/10 text-ttc-primary' },
  { icon: Scale, title: 'Balance Splitwise-style', description: 'Cada uno ve cuánto debe o cuánto le deben.', colorClass: 'bg-ttc-whatsapp/10 text-ttc-whatsapp' },
  { icon: GitMerge, title: 'Simplificación de deudas', description: 'Reduce la cantidad de transferencias necesarias al mínimo.', colorClass: 'bg-ttc-primary/10 text-ttc-primary' },
  { icon: Sparkles, title: 'IA que confirma', description: 'Siempre te muestra lo que entendió antes de guardar.', colorClass: 'bg-ttc-whatsapp/10 text-ttc-whatsapp' },
  { icon: UserMinus, title: 'Todos menos X', description: 'Dividí entre todos excepto alguien. "todos menos Sofi".', colorClass: 'bg-ttc-red/10 text-ttc-red' },
  { icon: UserPlus, title: 'Miembros fantasma', description: 'Agregá a alguien que no tiene WhatsApp todavía.', colorClass: 'bg-ttc-primary/10 text-ttc-primary' },
  { icon: Link, title: 'Invitá con link', description: 'Compartí un link para que se unan al grupo.', colorClass: 'bg-ttc-whatsapp/10 text-ttc-whatsapp' },
  { icon: Bell, title: 'Pagos fijos y alertas', description: 'Cargá gastos recurrentes y recibí recordatorios.', colorClass: 'bg-ttc-red/10 text-ttc-red' },
]

const visibleFeatures = computed(() => showAll.value ? features : features.slice(0, 6))

const balanceRows = [
  { name: 'Vos', amount: '+$12.400', colorClass: 'text-ttc-primary' },
  { name: 'Gonza', amount: '-$6.200', colorClass: 'text-ttc-red' },
  { name: 'Mati', amount: '-$4.800', colorClass: 'text-ttc-red' },
  { name: 'Sofi', amount: '-$1.400', colorClass: 'text-ttc-red' },
]
</script>
