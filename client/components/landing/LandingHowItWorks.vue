<template>
  <section ref="sectionRef" class="relative py-16 md:py-24 overflow-hidden">
    <div class="relative z-10 px-5 max-w-4xl mx-auto">
      <h2 class="font-nunito font-bold text-lg text-ttc-text-muted mb-14 text-left md:text-center">
        Tres pasos. Cero fricción.
      </h2>

      <!-- Timeline -->
      <div class="relative">
        <!-- Vertical line (desktop) -->
        <div class="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-ttc-border -translate-x-1/2" />

        <!-- Step 1: Left -->
        <div
          class="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-0 mb-12 md:mb-20"
          :class="isVisible ? 'animate-slide-in-left' : 'opacity-0'"
        >
          <div class="md:w-1/2 md:pr-12 md:text-right relative">
            <span class="step-number md:right-12 md:left-auto">01</span>
            <div class="flex items-center gap-3 md:justify-end mb-2">
              <h3 class="font-nunito font-bold text-lg text-ttc-text">Mandá un mensaje</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Escribile al bot por WhatsApp lo que gastaste. Texto, audio o foto del ticket — todo vale.
            </p>
          </div>
          <!-- Center dot -->
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-ttc-primary bg-ttc-bg z-10 items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-ttc-primary" />
          </div>
          <div class="md:w-1/2 md:pl-12">
            <div class="bg-[#005c4b] text-white text-base px-5 py-3 rounded-xl rounded-tl-sm max-w-[320px] font-body shadow-md" style="transform: rotate(-1deg)">
              "pagué 8 lucas de la birra" 🍺
            </div>
          </div>
        </div>

        <!-- Step 2: Right -->
        <div
          class="relative flex flex-col md:flex-row-reverse md:items-center gap-4 md:gap-0 mb-12 md:mb-20"
          :class="isVisible ? 'animate-slide-in-right stagger-2' : 'opacity-0'"
        >
          <div class="md:w-1/2 md:pl-12 relative">
            <span class="step-number md:left-12 md:right-auto">02</span>
            <div class="flex items-center gap-3 mb-2">
              <h3 class="font-nunito font-bold text-lg text-ttc-text">La IA lo entiende</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Entiende lunfardo, montos en lucas, @menciones y hasta fotos de tickets. Te confirma antes de guardar.
            </p>
          </div>
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-ttc-whatsapp bg-ttc-bg z-10 items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-ttc-whatsapp" />
          </div>
          <div class="md:w-1/2 md:pr-12 md:flex md:justify-end">
            <div class="bg-ttc-card border border-ttc-border text-base px-5 py-3 rounded-xl rounded-tr-sm max-w-[320px] font-body shadow-md" style="transform: rotate(1deg)">
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
          <div class="md:w-1/2 md:pr-12 md:text-right relative">
            <span class="step-number md:right-12 md:left-auto">03</span>
            <div class="flex items-center gap-3 md:justify-end mb-2">
              <h3 class="font-nunito font-bold text-lg text-ttc-text">Todos saben cuánto deben</h3>
            </div>
            <p class="text-sm text-ttc-text-muted leading-relaxed">
              Balances automáticos. Cada uno ve cuánto debe o cuánto le deben. Chau discusiones.
            </p>
          </div>
          <div class="hidden md:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-ttc-red bg-ttc-bg z-10 items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-ttc-red" />
          </div>
          <div class="md:w-1/2 md:pl-12">
            <div class="bg-ttc-card border border-ttc-border text-base px-5 py-3.5 rounded-xl rounded-tl-sm max-w-[320px] font-body shadow-md" style="transform: rotate(-0.5deg)">
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

<style scoped>
.step-number {
  position: absolute;
  top: -20px;
  left: 0;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 80px;
  line-height: 1;
  color: var(--color-primary);
  opacity: 0.06;
  pointer-events: none;
  user-select: none;
}

@media (min-width: 768px) {
  .step-number {
    font-size: 100px;
    top: -30px;
  }
}
</style>
