<template>
  <section class="min-h-screen flex flex-col items-center justify-center px-4 relative">
    <div class="flex flex-col items-center text-center max-w-lg mx-auto">
      <!-- Receipt icon -->
      <TtcSymbol size-class="w-20 h-20 mb-6" />

      <!-- Wordmark -->
      <h1 class="font-outfit font-semibold text-3xl sm:text-4xl tracking-[3px] text-ttc-text mb-4">
        text <span class="text-ttc-primary">the</span> check
      </h1>

      <!-- Tagline -->
      <p class="font-body font-medium text-[10px] sm:text-xs tracking-[3px] uppercase text-ttc-text-muted mb-8">
        tu plata, a un mensaje
      </p>

      <!-- Subtitle -->
      <p class="font-body text-sm sm:text-base text-ttc-text-muted leading-relaxed max-w-md">
        Tu compañero financiero por WhatsApp. Manejá tu plata con amigos o en lo personal — todo en un mensaje.
      </p>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <ChevronDown :size="18" :stroke-width="1.5" class="text-ttc-text-dim" />
    </div>
  </section>
</template>

<script setup>
import { ChevronDown } from 'lucide-vue-next'
</script>
