<template>
  <section class="relative py-16 md:py-24 px-5 overflow-hidden">
    <!-- Background glow -->
    <div class="absolute top-1/3 right-1/4 w-[500px] h-[400px] rounded-full bg-ttc-accent opacity-[0.03] pointer-events-none" style="filter: blur(100px);" />

    <div class="relative z-10 max-w-5xl mx-auto">
      <!-- Section header -->
      <div class="text-center mb-14">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-accent mb-3">
          whatsapp como interfaz
        </p>
        <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl md:text-4xl text-ttc-text mb-3">
          Mandá como quieras, se registra solo
        </h2>
        <p class="font-body text-sm sm:text-base text-ttc-text-muted max-w-2xl mx-auto">
          No importa el formato — lo que mandes por WhatsApp se convierte en un registro automático
        </p>
      </div>

      <!-- Input type cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        <div
          v-for="(input, i) in inputTypes"
          :key="input.title"
          class="input-card opacity-0"
          :style="{ transitionDelay: `${i * 100}ms` }"
        >
          <div class="p-5 md:p-6 flex flex-col h-full">
            <!-- Icon -->
            <div class="w-10 h-10 rounded-lg bg-ttc-accent/10 flex items-center justify-center mb-4">
              <component :is="input.icon" :size="20" class="text-ttc-accent" />
            </div>
            <!-- Title -->
            <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">{{ input.title }}</h3>
            <!-- Description -->
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-4 flex-1">{{ input.description }}</p>
            <!-- Example box -->
            <div class="rounded-lg bg-ttc-surface/60 border border-ttc-border/50 px-3 py-2.5">
              <p class="font-body text-xs text-ttc-text-muted italic">{{ input.example }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt-edge divider -->
    <div class="absolute bottom-0 left-0 right-0 opacity-10">
      <svg width="100%" height="12" preserveAspectRatio="none">
        <path
          d="M 0,6 l 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5 6,-5 6,5"
          stroke="var(--color-accent)"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { MessageSquareText, Camera, Mic, FileText } from 'lucide-vue-next'

const inputTypes = [
  {
    icon: MessageSquareText,
    title: 'Texto libre',
    description: 'Escribí como hablás. Monto, categoría y con quién se divide, todo desde un mensaje.',
    example: '"50 dólares la cena con Gonza y Mili"'
  },
  {
    icon: Camera,
    title: 'Foto de ticket',
    description: 'Sacale foto a la cuenta del restaurante o al ticket del super. Se leen los items y el total.',
    example: 'Foto de la cuenta de la pizzería'
  },
  {
    icon: Mic,
    title: 'Audio',
    description: 'Grabá un audio contando lo que gastaste. Se transcribe y se registra todo automáticamente.',
    example: '"Pagué 5 lucas del uber del aeropuerto"'
  },
  {
    icon: FileText,
    title: 'PDF',
    description: 'Reenviá una factura o comprobante en PDF. Se extraen los datos del documento.',
    example: 'Factura-hotel-bariloche.pdf'
  }
]

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

  document.querySelectorAll('.input-card').forEach((card) => observer.observe(card))
})
</script>

<style scoped>
.input-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(16px);
}

.input-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.input-card:hover {
  border-color: var(--color-text-dim);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
}
</style>
