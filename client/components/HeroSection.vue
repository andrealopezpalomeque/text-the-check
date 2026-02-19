<template>
  <section class="py-20 md:py-32 px-5 relative overflow-hidden">
    <!-- Subtle radial glow behind title area -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-ttc-primary/[0.03]" style="filter: blur(100px);" />
    </div>

    <div class="relative z-10 max-w-5xl mx-auto text-center">
      <!-- Pill badge -->
      <div class="animate-fade-up">
        <span class="inline-block rounded-full border border-[#4A90D9]/30 bg-[#4A90D9]/[0.08] px-6 py-2 font-body text-[11px] font-semibold uppercase tracking-[3px] text-ttc-primary">
          Tu plata, a un mensaje
        </span>
      </div>

      <!-- Main title -->
      <h1 class="mt-6 font-nunito font-extrabold text-4xl md:text-6xl leading-tight text-balance animate-fade-up" style="animation-delay: 0.1s;">
        Controlá tus finanzas<br>
        <span class="text-ttc-primary">desde WhatsApp</span>
      </h1>

      <!-- Subtitle -->
      <p class="mt-6 font-body text-base md:text-lg font-normal text-ttc-text-muted leading-relaxed max-w-[540px] mx-auto animate-fade-up" style="animation-delay: 0.2s;">
        Registrá gastos, dividí cuentas con amigos y recibí resumenes inteligentes. Todo con un simple mensaje.
      </p>

      <!-- Buttons -->
      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style="animation-delay: 0.3s;">
        <a
          href="/login"
          class="inline-flex items-center gap-2 bg-ttc-primary text-white rounded-xl px-7 py-3 font-body text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Empezar ahora
          <ArrowRight :size="16" :stroke-width="2" />
        </a>
        <button
          @click="scrollToModes"
          class="inline-flex items-center gap-2 border border-ttc-border bg-transparent text-ttc-text rounded-xl px-7 py-3 font-body text-sm font-semibold hover:bg-ttc-card hover:border-ttc-text-dim transition-colors cursor-pointer"
        >
          Ver cómo funciona
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'

const scrollToModes = () => {
  document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })
}
</script>
