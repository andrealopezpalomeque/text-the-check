<template>
  <section class="pt-32 pb-20 md:pt-40 md:pb-28 flex flex-col items-center px-4 relative">
    <!-- Subtle radial glow behind hero content -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03]" style="filter: blur(120px);" />
    </div>

    <div class="flex flex-col items-center text-center max-w-lg mx-auto relative z-10">
      <!-- Receipt icon -->
      <TtcSymbol size-class="w-[120px] h-[120px] md:w-[140px] md:h-[140px]" />

      <!-- Wordmark -->
      <h1 class="mt-5 font-outfit font-semibold text-3xl sm:text-4xl tracking-[3px] text-ttc-text">
        text <span class="text-ttc-primary">the</span> check
      </h1>

      <!-- Tagline -->
      <p class="mt-3 font-body font-medium text-[10px] sm:text-xs tracking-[5px] uppercase text-ttc-text-muted">
        tu plata, a un mensaje
      </p>

      <!-- Subtitle -->
      <p class="mt-6 font-body text-base sm:text-lg text-ttc-text-muted leading-relaxed max-w-md">
        Dividí gastos con tus amigos, llevá tus finanzas personales
        — todo desde WhatsApp, sin complicarte.
      </p>
    </div>
  </section>
</template>

<script setup>
</script>
