<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 overflow-hidden">
    <!-- Background glow -->
    <div class="absolute top-1/3 right-1/4 w-[500px] h-[400px] rounded-full opacity-[0.04] pointer-events-none" style="background: radial-gradient(ellipse, #E8533F 0%, transparent 70%); filter: blur(100px);" />

    <div class="relative z-10">
      <!-- Section header -->
      <div class="px-5 max-w-5xl mx-auto mb-10">
        <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-red mb-3 text-left md:text-center">
          whatsapp como interfaz
        </p>
        <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,38px)] text-ttc-text mb-3 text-left md:text-center leading-tight">
          Mandá como quieras, se registra solo
        </h2>
        <p class="font-body text-sm sm:text-base text-ttc-text-muted max-w-2xl md:mx-auto text-left md:text-center">
          No importa el formato — lo que mandes por WhatsApp se convierte en un registro automático
        </p>
      </div>

      <!-- Horizontal scroll on mobile, staggered grid on desktop -->
      <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:max-w-4xl md:mx-auto md:pb-0">
        <div
          v-for="(input, i) in inputTypes"
          :key="input.title"
          class="snap-center shrink-0 w-[280px] md:w-auto bg-ttc-card border border-ttc-border rounded-2xl p-5 md:p-6 flex flex-col transition-all duration-300 hover:border-ttc-text-dim hover:-translate-y-0.5"
          :class="[
            isVisible ? 'animate-fade-up' : 'opacity-0',
            `stagger-${i + 1}`
          ]"
          :style="i % 2 === 1 ? 'md:transform: translateY(16px)' : ''"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            :class="i % 2 === 0 ? 'bg-ttc-primary/10' : 'bg-ttc-whatsapp/10'"
          >
            <component :is="input.icon" :size="20" :class="i % 2 === 0 ? 'text-ttc-primary' : 'text-ttc-whatsapp'" />
          </div>
          <!-- Title -->
          <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">{{ input.title }}</h3>
          <!-- Description -->
          <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-4 flex-1">{{ input.description }}</p>
          <!-- Example box -->
          <div class="rounded-lg bg-ttc-surface/60 border border-ttc-border/50 px-3 py-2.5">
            <p class="font-dm-mono text-xs text-ttc-text-muted">{{ input.example }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { MessageSquareText, Camera, Mic, FileText } from 'lucide-vue-next'

const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)

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
</script>
