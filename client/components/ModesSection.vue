<template>
  <section id="modes" class="relative pt-16 md:pt-20 pb-20 px-4 overflow-hidden">
    <!-- Subtle background glow -->
    <div
      :class="[
        'absolute inset-0 transition-opacity duration-700 pointer-events-none',
        activeMode === 'viajes' ? 'opacity-100' : 'opacity-0'
      ]"
    >
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-ttc-primary/[0.03] rounded-full blur-[100px]" />
    </div>
    <div
      :class="[
        'absolute inset-0 transition-opacity duration-700 pointer-events-none',
        activeMode === 'finanzas' ? 'opacity-100' : 'opacity-0'
      ]"
    >
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-ttc-accent/[0.03] rounded-full blur-[100px]" />
    </div>

    <div class="relative max-w-5xl mx-auto">
      <!-- Section label -->
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary text-center mb-3">
        dos modos, un chat
      </p>

      <!-- Section title -->
      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl text-ttc-text text-center mb-3">
        Todo registrado, todo al día — desde un mensaje
      </h2>

      <!-- Subtitle -->
      <p class="font-body text-[15px] text-ttc-text-muted text-center mb-10 max-w-[520px] mx-auto">
        No importa si es una birra con amigos o el alquiler del mes.
      </p>

      <!-- Mode Toggle -->
      <div class="flex justify-center mb-10">
        <ModeToggle :active-mode="activeMode" @update:active-mode="activeMode = $event" />
      </div>

      <!-- Desktop: two columns | Mobile: stacked -->
      <div class="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
        <!-- Left column: Cards -->
        <div class="space-y-4 order-1">
          <ModeCard
            mode="viajes"
            :is-active="activeMode === 'viajes'"
            @select="activeMode = 'viajes'"
          />
          <!-- On mobile: show chat between the two cards -->
          <div class="lg:hidden">
            <ChatPreview :active-mode="activeMode" />
          </div>
          <ModeCard
            mode="finanzas"
            :is-active="activeMode === 'finanzas'"
            @select="activeMode = 'finanzas'"
          />
        </div>

        <!-- Right column: Chat preview (desktop only) -->
        <div class="hidden lg:block order-2 sticky top-20">
          <ChatPreview :active-mode="activeMode" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const activeMode = ref('viajes')
</script>
