<template>
  <section class="relative py-16 md:py-24 px-5 overflow-hidden">
    <!-- Background glow -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-ttc-primary opacity-[0.03] pointer-events-none" style="filter: blur(100px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-14">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3">
          todo desde whatsapp
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text">
          Lo que necesitás, en un mensaje
        </h2>
      </div>

      <!-- Feature cards grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          ref="cardRefs"
          class="feature-card opacity-0"
          :style="{ transitionDelay: `${i * 80}ms` }"
        >
          <div class="p-6">
            <!-- Icon -->
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              :class="feature.color === 'primary' ? 'bg-ttc-primary/10' : 'bg-ttc-accent/10'"
            >
              <component
                :is="feature.icon"
                :size="22"
                :class="feature.color === 'primary' ? 'text-ttc-primary' : 'text-ttc-accent'"
              />
            </div>
            <!-- Text -->
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">{{ feature.title }}</h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed">{{ feature.description }}</p>
          </div>
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
import { ref, onMounted } from 'vue'
import {
  MessageCircle,
  ArrowLeftRight,
  DollarSign,
  GitMerge,
  Sparkles,
  Bell
} from 'lucide-vue-next'

const features = [
  {
    icon: MessageCircle,
    title: 'Registrá como quieras',
    description: 'Texto, foto de ticket, audio o PDF — mandalo por WhatsApp y se registra solo. Monto, categoría y quién pagó, sin cargar nada a mano.',
    color: 'primary'
  },
  {
    icon: ArrowLeftRight,
    title: 'Todo desde WhatsApp',
    description: 'Dividí gastos de viajes con amigos directo desde el chat. Sin instalar apps, sin planillas, sin vueltas.',
    color: 'accent'
  },
  {
    icon: DollarSign,
    title: 'Multi-moneda',
    description: 'Gastá en dólares, euros o reales — se convierte solo al tipo de cambio blue del momento. Perfecto para viajes al exterior.',
    color: 'primary'
  },
  {
    icon: GitMerge,
    title: 'Deudas simplificadas',
    description: 'En vez de 10 transferencias cruzadas, el algoritmo te dice las mínimas necesarias. Menos vueltas, menos quilombo.',
    color: 'accent'
  },
  {
    icon: Sparkles,
    title: 'IA que te entiende',
    description: 'Decí "5 lucas la birra" o "pagué 3k de morfi" — entiende cómo hablás, formatos locales y contexto del grupo.',
    color: 'primary'
  },
  {
    icon: Bell,
    title: 'Pagos fijos y alertas',
    description: 'Configurá alquiler, Netflix, expensas. Te avisa antes de cada vencimiento y lleva la cuenta de lo que ya pagaste.',
    color: 'accent'
  }
]

const cardRefs = ref([])

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
    { threshold: 0.15 }
  )

  // Observe each card
  const cards = document.querySelectorAll('.feature-card')
  cards.forEach((card) => observer.observe(card))
})
</script>

<style scoped>
.feature-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(16px);
}

.feature-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.feature-card:hover {
  border-color: var(--color-text-dim);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
}
</style>
