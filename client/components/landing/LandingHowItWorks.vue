<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 overflow-hidden">
    <!-- Warm gradient stripe -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03]"
      style="background: linear-gradient(135deg, #4A90D9 0%, #25D366 50%, #E8533F 100%);"
    />

    <div class="relative z-10 px-5 max-w-4xl mx-auto">
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary mb-3 text-left md:text-center">
        Cómo funciona
      </p>
      <h2 class="font-nunito font-extrabold text-[clamp(26px,5vw,42px)] text-ttc-text mb-16 text-left md:text-center leading-tight">
        Tres pasos. Cero fricción.
      </h2>

      <!-- Timeline -->
      <div class="relative">
        <!-- Vertical line (desktop) -->
        <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-ttc-border -translate-x-1/2" />

        <!-- Step 1: Left -->
        <div
          class="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-0 mb-12 md:mb-16"
          :class="isVisible ? 'animate-slide-in-left' : 'opacity-0'"
        >
          <div class="md:w-1/2 md:pr-12 md:text-right">
            <div class="flex items-center gap-3 md:justify-end mb-2">
              <span class="font-nunito font-extrabold text-3xl text-ttc-primary opacity-40">01</span>
              <h3 class="font-nunito font-bold text-lg text-ttc-text">Mandá un mensaje</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Escribile al bot por WhatsApp lo que gastaste. Texto, audio o foto del ticket — todo vale.
            </p>
          </div>
          <!-- Center dot -->
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ttc-primary border-4 border-ttc-bg z-10" />
          <div class="md:w-1/2 md:pl-12">
            <div class="bg-[#005c4b] text-white text-sm px-4 py-2.5 rounded-xl rounded-tl-sm max-w-[260px] font-body shadow-md" style="transform: rotate(-1deg)">
              "pagué 8 lucas de la birra" 🍺
            </div>
          </div>
        </div>

        <!-- Step 2: Right -->
        <div
          class="relative flex flex-col md:flex-row-reverse md:items-center gap-4 md:gap-0 mb-12 md:mb-16"
          :class="isVisible ? 'animate-slide-in-right stagger-2' : 'opacity-0'"
        >
          <div class="md:w-1/2 md:pl-12">
            <div class="flex items-center gap-3 mb-2">
              <span class="font-nunito font-extrabold text-3xl text-ttc-whatsapp opacity-40">02</span>
              <h3 class="font-nunito font-bold text-lg text-ttc-text">La IA lo entiende</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Entiende lunfardo, montos en lucas, @menciones y hasta fotos de tickets. Te confirma antes de guardar.
            </p>
          </div>
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ttc-whatsapp border-4 border-ttc-bg z-10" />
          <div class="md:w-1/2 md:pr-12 md:flex md:justify-end">
            <div class="bg-ttc-card border border-ttc-border text-sm px-4 py-2.5 rounded-xl rounded-tr-sm max-w-[280px] font-body shadow-md" style="transform: rotate(1deg)">
              <span class="text-ttc-text">Gasto: <span class="text-ttc-primary font-semibold">$8.000</span> — Birra</span>
              <br><span class="text-ttc-text-muted text-xs">Pagó: Vos · Dividido con: @Gonza</span>
              <br><span class="text-ttc-whatsapp text-xs font-medium">¿Correcto?</span>
            </div>
          </div>
        </div>

        <!-- Step 3: Left -->
        <div
          class="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-0"
          :class="isVisible ? 'animate-slide-in-left stagger-4' : 'opacity-0'"
        >
          <div class="md:w-1/2 md:pr-12 md:text-right">
            <div class="flex items-center gap-3 md:justify-end mb-2">
              <span class="font-nunito font-extrabold text-3xl text-ttc-red opacity-40">03</span>
              <h3 class="font-nunito font-bold text-lg text-ttc-text">Todos saben cuánto deben</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Balances automáticos. Cada uno ve cuánto debe o cuánto le deben. Chau discusiones.
            </p>
          </div>
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ttc-red border-4 border-ttc-bg z-10" />
          <div class="md:w-1/2 md:pl-12">
            <div class="bg-ttc-card border border-ttc-border text-sm px-4 py-3 rounded-xl rounded-tl-sm max-w-[240px] font-body shadow-md" style="transform: rotate(-0.5deg)">
              <span class="text-ttc-primary font-semibold">✓ Registrado</span>
              <br><span class="text-ttc-text-muted text-xs">Gonza te debe <span class="text-ttc-primary font-medium">$4.000</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const sectionRef = ref(null)
const { isVisible } = useScrollReveal(sectionRef)
</script>
