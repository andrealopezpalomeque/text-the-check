<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 overflow-hidden">
    <div class="relative z-10 px-5 max-w-5xl mx-auto">
      <!-- Section header — just the h2, no label or subtitle -->
      <h2 class="font-nunito font-extrabold text-[clamp(24px,5vw,38px)] text-ttc-text mb-10 text-left md:text-center leading-tight">
        Mandá como quieras, se registra solo
      </h2>

      <!-- Hero card: Texto libre (full-width, horizontal on desktop) -->
      <div
        class="bg-ttc-card border-2 border-ttc-primary/30 rounded-2xl p-5 md:p-7 mb-5 md:flex md:items-center md:gap-8"
        :class="isVisible ? 'animate-slide-in-left' : 'opacity-0'"
      >
        <div class="flex items-center gap-4 mb-4 md:mb-0 md:flex-shrink-0">
          <div class="w-12 h-12 rounded-xl bg-ttc-primary/10 flex items-center justify-center">
            <MessageSquareText :size="24" class="text-ttc-primary" />
          </div>
          <h3 class="font-nunito font-bold text-lg text-ttc-text md:hidden">{{ inputTypes[0].title }}</h3>
        </div>
        <div class="flex-1">
          <h3 class="font-nunito font-bold text-lg text-ttc-text mb-1.5 hidden md:block">{{ inputTypes[0].title }}</h3>
          <p class="font-body text-sm text-ttc-text-muted leading-relaxed">{{ inputTypes[0].description }}</p>
        </div>
        <div class="mt-4 md:mt-0 md:flex-shrink-0 md:w-[260px]">
          <div class="rounded-lg bg-ttc-surface/60 border border-ttc-border/50 px-4 py-3">
            <p class="font-dm-mono text-sm text-ttc-text-muted">{{ inputTypes[0].example }}</p>
          </div>
        </div>
      </div>

      <!-- Companion cards: 3 in a row on desktop, vertical stack on mobile -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="(input, i) in inputTypes.slice(1)"
          :key="input.title"
          class="bg-ttc-card border border-ttc-border rounded-2xl p-5 flex flex-col transition-all duration-300 hover:border-ttc-text-dim hover:-translate-y-0.5"
          :class="[
            isVisible ? animationClass(i) : 'opacity-0',
          ]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            :class="i % 2 === 0 ? 'bg-ttc-whatsapp/10' : 'bg-ttc-primary/10'"
          >
            <component :is="input.icon" :size="20" :class="i % 2 === 0 ? 'text-ttc-whatsapp' : 'text-ttc-primary'" />
          </div>
          <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">{{ input.title }}</h3>
          <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-4 flex-1">{{ input.description }}</p>
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

function animationClass(i) {
  const classes = ['animate-fade-up stagger-1', 'animate-fade-up stagger-2', 'animate-slide-in-right stagger-3']
  return classes[i] || 'animate-fade-up'
}

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
